#!/usr/bin/env node

// Idempotent, service-role-only importer for the NDJSON produced by
// functions/migration/export-firestore.js. Never put exported customer data
// or the Supabase secret/service_role key in the repository.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {fileURLToPath} from "node:url";
import loadMigrationEnv from "./load-env.cjs";

loadMigrationEnv(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env.migration"));

const [inputFile, batchArg] = process.argv.slice(2);
const batchSize = Number(batchArg || process.env.SUPABASE_IMPORT_BATCH_SIZE || 50);
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectedProjectId = process.env.FIREBASE_PROJECT_ID || "foodsync-43a7e";

if (!inputFile) throw new Error("Uso: node scripts/migration/import-firestore-archive.mjs <firestore.ndjson> [batch-size]");
if (!supabaseUrl || !serviceKey) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_SECRET_KEY (ou a chave legada SUPABASE_SERVICE_ROLE_KEY) no ambiente local.");
}
if (serviceKey.startsWith("sb_publishable_")) {
  throw new Error("A publishable key não pode importar dados. Use SUPABASE_SECRET_KEY apenas no ambiente local.");
}
if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 500) {
  throw new Error("O tamanho do lote deve ser um inteiro entre 1 e 500.");
}
if (!fs.existsSync(inputFile)) throw new Error(`Arquivo de exportação não encontrado: ${inputFile}`);

const manifestPath = `${inputFile}.manifest.json`;
if (!fs.existsSync(manifestPath)) {
  throw new Error(`Manifesto não encontrado: ${manifestPath}. Gere uma exportação completa antes de importar.`);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch {
  throw new Error(`Manifesto inválido: ${manifestPath}`);
}
if (manifest.projectId !== expectedProjectId) {
  throw new Error(`O manifesto é do projeto Firebase ${manifest.projectId || "desconhecido"}; esperado ${expectedProjectId}.`);
}
if (!Number.isSafeInteger(manifest.documentCount) || !manifest.collections || typeof manifest.collections !== "object") {
  throw new Error("Manifesto sem contagem total ou por coleção; exportação não pode ser validada.");
}
if (manifest.formatVersion !== 3 ||
    typeof manifest.snapshotId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(manifest.snapshotId) ||
    typeof manifest.exportStartedAt !== "string" || Number.isNaN(Date.parse(manifest.exportStartedAt))) {
  throw new Error("Exportação antiga ou sem ID/horário válidos de snapshot; gere um novo arquivo antes de importar.");
}

const endpoint = new URL(`${supabaseUrl}/rest/v1/firebase_documents_archive`);
endpoint.searchParams.set("on_conflict", "collection_path,firebase_document_id");
const stats = {lidos: 0, enviados: 0, lotes: 0, porColecao: {}};
let batch = [];

function rowFromRecord(record, lineNumber) {
  if (!record || typeof record.collection !== "string" || typeof record.id !== "string") {
    throw new Error(`Registro inválido na linha ${lineNumber}.`);
  }
  if (!record.data || typeof record.data !== "object" || Array.isArray(record.data)) {
    throw new Error(`Documento sem objeto de dados na linha ${lineNumber}.`);
  }
  if (typeof record.updateTime !== "string" || Number.isNaN(Date.parse(record.updateTime))) {
    throw new Error(`Documento sem updateTime válido na linha ${lineNumber}.`);
  }
  return {
    collection_path: record.collection,
    firebase_document_id: record.id,
    source_update_time: new Date(record.updateTime).toISOString(),
    last_seen_export_id: manifest.snapshotId,
    last_seen_export_started_at: new Date(manifest.exportStartedAt).toISOString(),
    empresa_id: typeof record.data.idEmpresa === "string" ? record.data.idEmpresa : null,
    payload: record.data,
  };
}

async function inspectArchive() {
  const counts = {};
  let total = 0;
  let lineNumber = 0;
  const lines = readline.createInterface({
    input: fs.createReadStream(inputFile, {encoding: "utf8"}),
    crlfDelay: Infinity,
  });
  for await (const line of lines) {
    lineNumber += 1;
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      throw new Error(`JSON inválido na linha ${lineNumber}; nenhum dado foi enviado.`);
    }
    const row = rowFromRecord(record, lineNumber);
    total += 1;
    counts[row.collection_path] = (counts[row.collection_path] || 0) + 1;
  }

  const expectedCounts = Object.fromEntries(Object.entries(manifest.collections)
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b)));
  const actualCounts = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  if (total !== manifest.documentCount || JSON.stringify(actualCounts) !== JSON.stringify(expectedCounts)) {
    throw new Error(
        `Arquivo incompleto ou divergente do manifesto; nenhum dado foi enviado. ` +
        `Manifesto: ${manifest.documentCount} documentos; arquivo: ${total}.`,
    );
  }
  return {total, collections: counts};
}

async function flush() {
  if (!batch.length) return;
  const count = batch.length;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
      ...(!serviceKey.startsWith("sb_secret_") ? {Authorization: `Bearer ${serviceKey}`} : {}),
    },
    body: JSON.stringify(batch),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1200);
    throw new Error(`Supabase recusou o lote (${response.status}): ${detail}`);
  }
  stats.enviados += count;
  stats.lotes += 1;
  batch = [];
}

try {
  const archive = await inspectArchive();
  console.log(`Pré-validação concluída: ${archive.total} documentos em ${Object.keys(archive.collections).length} coleções.`);
  const lines = readline.createInterface({
    input: fs.createReadStream(inputFile, {encoding: "utf8"}),
    crlfDelay: Infinity,
  });
  let lineNumber = 0;
  for await (const line of lines) {
    lineNumber += 1;
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      throw new Error(`JSON inválido na linha ${lineNumber}.`);
    }
    const row = rowFromRecord(record, lineNumber);
    stats.lidos += 1;
    stats.porColecao[row.collection_path] = (stats.porColecao[row.collection_path] || 0) + 1;
    batch.push(row);
    if (batch.length >= batchSize) await flush();
  }
  await flush();
  console.log(JSON.stringify(stats, null, 2));
} catch (error) {
  console.error(`Importação parada após ${stats.enviados} documentos confirmados. Pode ser repetida: ${error.message}`);
  process.exitCode = 1;
}
