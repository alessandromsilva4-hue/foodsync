#!/usr/bin/env node

// Applies a complete, pre-verified Firestore snapshot to the app mirror.
// Requires an explicit --apply because it removes target rows absent in source.

import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import loadMigrationEnv from "./load-env.cjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
loadMigrationEnv(path.resolve(scriptDirectory, "../../.env.migration"));

const [inputFile, applyFlag] = process.argv.slice(2);
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectedProjectId = process.env.FIREBASE_PROJECT_ID || "foodsync-43a7e";

if (!inputFile || applyFlag !== "--apply") {
  throw new Error("Uso: node scripts/migration/reconcile-firestore-snapshot.mjs <firestore.ndjson> --apply");
}
if (!supabaseUrl || !serviceKey) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) no ambiente local.");
}
if (serviceKey.startsWith("sb_publishable_")) {
  throw new Error("A publishable key não pode reconciliar dados. Use a chave administrativa local.");
}
if (!fs.existsSync(inputFile)) throw new Error(`Arquivo de exportação não encontrado: ${inputFile}`);

const manifestPath = `${inputFile}.manifest.json`;
if (!fs.existsSync(manifestPath)) throw new Error(`Manifesto não encontrado: ${manifestPath}`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.projectId !== expectedProjectId || manifest.formatVersion !== 3 ||
    !Number.isSafeInteger(manifest.documentCount) ||
    typeof manifest.snapshotId !== "string" ||
    typeof manifest.exportStartedAt !== "string" || Number.isNaN(Date.parse(manifest.exportStartedAt))) {
  throw new Error("Manifesto incompatível, incompleto ou de outro projeto Firebase.");
}

const verifierPath = path.join(scriptDirectory, "verify-firestore-archive.mjs");
const verification = spawnSync(process.execPath, [verifierPath, inputFile], {stdio: "inherit"});
if (verification.error) throw new Error(`Falha ao iniciar o verificador: ${verification.error.message}`);
if (verification.status !== 0) {
  throw new Error("Snapshot não passou na verificação remota; nenhuma reconciliação foi executada.");
}

const response = await fetch(`${supabaseUrl}/rest/v1/rpc/reconcile_firebase_snapshot`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    "Content-Type": "application/json",
    ...(!serviceKey.startsWith("sb_secret_") ? {Authorization: `Bearer ${serviceKey}`} : {}),
  },
  body: JSON.stringify({
    p_export_id: manifest.snapshotId,
    p_export_started_at: new Date(manifest.exportStartedAt).toISOString(),
    p_expected_document_count: manifest.documentCount,
  }),
  signal: AbortSignal.timeout(120000),
});

if (!response.ok) {
  const detail = (await response.text()).slice(0, 1000);
  throw new Error(`Reconciliação Supabase recusada (HTTP ${response.status}): ${detail}`);
}

console.log(JSON.stringify(await response.json(), null, 2));
