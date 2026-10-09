"use strict";

// Read-only, paginated Firestore exporter for the Lotrix migration.
// Run from the functions directory; the output defaults to LocalAppData so
// customer data is not written into the Git worktree.

const fs = require("node:fs");
const path = require("node:path");
const {randomUUID} = require("node:crypto");
const {once} = require("node:events");
const {applicationDefault, initializeApp} = require("firebase-admin/app");
const {FieldPath, getFirestore} = require("firebase-admin/firestore");
const loadMigrationEnv = require("../../scripts/migration/load-env.cjs");

loadMigrationEnv(path.resolve(__dirname, "../../.env.migration"));

const projectId = process.env.FIREBASE_PROJECT_ID || "foodsync-43a7e";
const defaultRoot = process.env.LOCALAPPDATA || process.env.TEMP;
const outputArgument = process.argv[2];
if (!defaultRoot && !outputArgument) {
  throw new Error("Defina LOCALAPPDATA ou TEMP, ou informe o caminho de saída.");
}
const outputPath = path.resolve(
    outputArgument || path.join(defaultRoot, "LotrixMigration", "firestore.ndjson"),
);
const pageSize = 400;
const printerServiceCollectionGroupPath = ["printerServiceUpdates", null, "services"];

function encodeValue(value) {
  if (value === null || value === undefined) return value ?? null;
  if (value instanceof Date) return {__type: "date", value: value.toISOString()};
  if (typeof value.toDate === "function" && typeof value.seconds === "number") {
    return {__type: "timestamp", value: value.toDate().toISOString()};
  }
  if (typeof value.toBase64 === "function") {
    return {__type: "bytes", base64: value.toBase64()};
  }
  if (typeof value.latitude === "number" && typeof value.longitude === "number") {
    return {__type: "geopoint", latitude: value.latitude, longitude: value.longitude};
  }
  if (typeof value.path === "string" && value.firestore) {
    return {__type: "reference", path: value.path};
  }
  if (Array.isArray(value)) return value.map(encodeValue);
  if (typeof value === "object") {
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, encodeValue(item)]),
    );
  }
  return value;
}

async function writeLine(stream, value) {
  if (!stream.write(`${JSON.stringify(value)}\n`)) await once(stream, "drain");
}

async function exportDocument(document, stream, counts, exportedPrinterServicePaths) {
  const collectionPath = document.ref.parent.path;
  const documentPath = document.ref.path.split("/");
  const isPrinterServiceDocument = documentPath.length === 4 &&
    documentPath[0] === printerServiceCollectionGroupPath[0] &&
    documentPath[2] === printerServiceCollectionGroupPath[2];

  // The Printer Service writes directly to a subcollection whose parent
  // document may not exist. Collection-group export can find those orphaned
  // children; this set prevents duplicating documents already found recursively.
  if (isPrinterServiceDocument && exportedPrinterServicePaths.has(document.ref.path)) return;
  if (isPrinterServiceDocument) exportedPrinterServicePaths.add(document.ref.path);

  counts[collectionPath] = (counts[collectionPath] || 0) + 1;
  await writeLine(stream, {
    collection: collectionPath,
    id: document.id,
    updateTime: document.updateTime.toDate().toISOString(),
    data: encodeValue(document.data()),
  });

  const childCollections = await document.ref.listCollections();
  for (const childCollection of childCollections) {
    await exportCollection(childCollection, stream, counts, exportedPrinterServicePaths);
  }
}

async function exportCollection(collectionRef, stream, counts, exportedPrinterServicePaths) {
  let cursor;
  while (true) {
    let query = collectionRef
        .orderBy(FieldPath.documentId())
        .limit(pageSize);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const document of snapshot.docs) {
      await exportDocument(document, stream, counts, exportedPrinterServicePaths);
    }
    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < pageSize) break;
  }
}

async function exportOrphanedPrinterServiceDocuments(db, stream, counts, exportedPrinterServicePaths) {
  const snapshot = await db.collectionGroup(printerServiceCollectionGroupPath[2]).get();
  for (const document of snapshot.docs) {
    const segments = document.ref.path.split("/");
    if (segments.length === 4 && segments[0] === printerServiceCollectionGroupPath[0] &&
        segments[2] === printerServiceCollectionGroupPath[2]) {
      await exportDocument(document, stream, counts, exportedPrinterServicePaths);
    }
  }
}

async function main() {
  const partialPath = `${outputPath}.partial`;
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  if (fs.existsSync(partialPath)) fs.unlinkSync(partialPath);

  const app = initializeApp({
    credential: applicationDefault(),
    projectId,
  }, `lotrix-export-${Date.now()}`);
  const db = getFirestore(app);
  const stream = fs.createWriteStream(partialPath, {encoding: "utf8", flags: "wx"});
  const counts = {};
  const exportedPrinterServicePaths = new Set();
  const snapshotId = randomUUID();
  const exportStartedAt = new Date().toISOString();

  try {
    const collections = await db.listCollections();
    for (const collection of collections) {
      await exportCollection(collection, stream, counts, exportedPrinterServicePaths);
    }
    await exportOrphanedPrinterServiceDocuments(db, stream, counts, exportedPrinterServicePaths);
    stream.end();
    await once(stream, "finish");
    fs.renameSync(partialPath, outputPath);

    const manifest = {
      projectId,
      snapshotId,
      exportStartedAt,
      exportedAt: new Date().toISOString(),
      formatVersion: 3,
      format: "ndjson v3; manifest includes snapshotId/exportStartedAt and documents include updateTime",
      pageSize,
      documentCount: Object.values(counts).reduce((sum, count) => sum + count, 0),
      collections: counts,
    };
    fs.writeFileSync(`${outputPath}.manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, {
      flag: "w",
      mode: 0o600,
    });
    console.log(JSON.stringify(manifest, null, 2));
  } catch (error) {
    stream.destroy();
    if (fs.existsSync(partialPath)) fs.unlinkSync(partialPath);
    throw error;
  } finally {
    await app.delete();
  }
}

main().catch((error) => {
  console.error(`Exportação Firestore não concluída: ${error.message}`);
  process.exitCode = 1;
});
