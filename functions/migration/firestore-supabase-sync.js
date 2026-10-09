"use strict";

// Serializes the Firestore value types used by the archive exporter and sends
// one ordered, idempotent document event to the private Supabase RPC.

/**
 * Convert Firestore-only values into portable JSON values.
 * @param {*} value Firestore value to encode.
 * @return {*} JSON-compatible value.
 */
function encodeFirestoreValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return {__type: "date", value: value.toISOString()};
  }
  if (typeof value.toDate === "function" &&
      typeof value.seconds === "number") {
    return {__type: "timestamp", value: value.toDate().toISOString()};
  }
  if (typeof value.toBase64 === "function") {
    return {__type: "bytes", base64: value.toBase64()};
  }
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return {
      __type: "bytes",
      base64: Buffer.from(value).toString("base64"),
    };
  }
  if (typeof value.latitude === "number" &&
      typeof value.longitude === "number") {
    return {
      __type: "geopoint",
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }
  if (typeof value.path === "string" && value.firestore) {
    return {__type: "reference", path: value.path};
  }
  if (Array.isArray(value)) return value.map(encodeFirestoreValue);
  if (typeof value === "object") {
    return Object.fromEntries(
        Object.entries(value)
            .filter(([, item]) => item !== undefined)
            .map(([key, item]) => [key, encodeFirestoreValue(item)]),
    );
  }
  return value;
}

/**
 * Split a Firestore document path into collection path and document ID.
 * @param {string} documentPath Firestore document path.
 * @return {{collectionPath: string, documentId: string}} Path parts.
 */
function splitDocumentPath(documentPath) {
  if (typeof documentPath !== "string") {
    throw new Error("Caminho de documento Firestore ausente.");
  }
  const segments = documentPath.split("/");
  if (segments.length < 2 || segments.length % 2 !== 0 ||
      segments.some((segment) => !segment)) {
    throw new Error("Caminho de documento Firestore inválido.");
  }
  return {
    collectionPath: segments.slice(0, -1).join("/"),
    documentId: segments[segments.length - 1],
  };
}

/**
 * Normalize CloudEvent time to sortable UTC with nanosecond precision.
 * @param {string} value CloudEvent timestamp.
 * @return {string} UTC timestamp with nine fractional digits.
 */
function normalizeEventTime(value) {
  const match = typeof value === "string" && value.match(
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match) throw new Error("Horário do evento Firestore inválido.");

  const milliseconds = Date.parse(
      `${match[1]}${match[3]}`,
  );
  if (!Number.isFinite(milliseconds)) {
    throw new Error("Horário do evento Firestore inválido.");
  }

  const utcWholeSecond = new Date(Math.floor(milliseconds / 1000) * 1000)
      .toISOString()
      .slice(0, 19);
  const nanoseconds = (match[2] || "").padEnd(9, "0").slice(0, 9);
  return `${utcWholeSecond}.${nanoseconds}Z`;
}

/**
 * Send one Firestore change event to the replay-safe Supabase RPC.
 * @param {Object} event Firestore CloudEvent.
 * @param {string} documentPath Full Firestore document path.
 * @param {{fetch: Function, supabaseUrl: string, secret: string}} options
 *   Supabase request dependencies.
 * @return {Promise<void>} Resolves after Supabase accepts the event.
 */
async function syncFirestoreEvent(event, documentPath, options) {
  if (!event?.data || typeof event.id !== "string" ||
      typeof event.time !== "string") {
    throw new Error("Evento Firestore sem ID, horário ou snapshots.");
  }

  const {collectionPath, documentId} = splitDocumentPath(documentPath);
  const before = event.data.before;
  const after = event.data.after;
  const deleted = !after?.exists;
  let sourceUpdateTime;
  if (deleted) {
    sourceUpdateTime = before?.updateTime?.toDate?.().toISOString() || null;
  } else {
    sourceUpdateTime = after.updateTime?.toDate?.().toISOString();
  }

  if (!deleted && !sourceUpdateTime) {
    throw new Error("Snapshot Firestore sem updateTime.");
  }

  const rpcUrl = `${options.supabaseUrl.replace(/\/$/, "")}` +
    "/rest/v1/rpc/apply_firebase_document_event";
  const response = await options.fetch(rpcUrl, {
    method: "POST",
    headers: {
      "apikey": options.secret,
      "Content-Type": "application/json",
      ...(!options.secret.startsWith("sb_secret_") ? {
        Authorization: `Bearer ${options.secret}`,
      } : {}),
    },
    body: JSON.stringify({
      p_collection_path: collectionPath,
      p_document_id: documentId,
      p_event_id: event.id,
      p_event_time: normalizeEventTime(event.time),
      p_deleted: deleted,
      p_payload: deleted ? null : encodeFirestoreValue(after.data()),
      p_update_time: sourceUpdateTime,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
        `Supabase recusou o evento Firestore (HTTP ${response.status}).`,
    );
  }
}

module.exports = {
  encodeFirestoreValue,
  normalizeEventTime,
  splitDocumentPath,
  syncFirestoreEvent,
};
