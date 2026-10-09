#!/usr/bin/env node

// Read-only parity check between a Firestore export manifest and the
// Supabase staging archive. Never print credentials or document contents.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {fileURLToPath} from "node:url";
import loadMigrationEnv from "./load-env.cjs";

loadMigrationEnv(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env.migration"));

const inputFile = process.argv[2];
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectedProjectId = process.env.FIREBASE_PROJECT_ID || "foodsync-43a7e";

if (!inputFile) throw new Error("Uso: node scripts/migration/verify-firestore-archive.mjs <firestore.ndjson>");
if (!supabaseUrl || !serviceKey) {
  throw new Error("Defina SUPABASE_URL e SUPABASE_SECRET_KEY (ou a chave legada SUPABASE_SERVICE_ROLE_KEY) no ambiente local.");
}
if (serviceKey.startsWith("sb_publishable_")) {
  throw new Error("A publishable key não pode verificar o arquivo privado. Use a chave administrativa local.");
}

const manifestPath = `${inputFile}.manifest.json`;
if (!fs.existsSync(manifestPath)) throw new Error(`Manifesto não encontrado: ${manifestPath}`);
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
  throw new Error("Manifesto sem contagem total ou por coleção.");
}
if (manifest.formatVersion !== 3 ||
    typeof manifest.snapshotId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(manifest.snapshotId) ||
    typeof manifest.exportStartedAt !== "string" || Number.isNaN(Date.parse(manifest.exportStartedAt))) {
  throw new Error("Exportação antiga ou sem ID/horário válidos de snapshot; gere um novo arquivo antes de verificar.");
}

const endpoint = new URL(`${supabaseUrl}/rest/v1/firebase_documents_archive`);
const headers = {
  apikey: serviceKey,
  Range: "0-0",
  "Prefer": "count=exact",
};
if (!serviceKey.startsWith("sb_secret_")) headers.Authorization = `Bearer ${serviceKey}`;

async function remoteCount(collectionPath, filters = {}) {
  const url = new URL(endpoint);
  url.searchParams.set("select", "firebase_document_id");
  url.searchParams.set("last_seen_export_id", `eq.${manifest.snapshotId}`);
  if (collectionPath !== undefined) url.searchParams.set("collection_path", `eq.${collectionPath}`);
  for (const [column, filter] of Object.entries(filters)) url.searchParams.set(column, filter);
  const response = await fetch(url, {method: "GET", headers});
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 800);
    throw new Error(`Supabase recusou a verificação (${response.status}): ${detail}`);
  }
  const range = response.headers.get("content-range");
  const match = range?.match(/\/(\d+)$/);
  if (!match) throw new Error("Supabase não retornou uma contagem exata (Content-Range). Verifique se a API Data está habilitada.");
  return Number(match[1]);
}

function incrementCount(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

async function inspectLocalArchive() {
  const collectionCounts = new Map();
  const tenantCounts = new Map();
  const productMembershipCounts = new Map();
  const companies = new Set();
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
      throw new Error(`JSON inválido na linha ${lineNumber}; verificação remota cancelada.`);
    }
    if (!record || typeof record.collection !== "string" || typeof record.id !== "string" ||
        !record.data || typeof record.data !== "object" || Array.isArray(record.data) ||
        typeof record.updateTime !== "string" || Number.isNaN(Date.parse(record.updateTime))) {
      throw new Error(`Documento inválido na linha ${lineNumber}; verificação remota cancelada.`);
    }

    total += 1;
    incrementCount(collectionCounts, record.collection);
    const companyId = typeof record.data.idEmpresa === "string" ? record.data.idEmpresa : "";
    if (companyId) {
      companies.add(companyId);
      incrementCount(tenantCounts, `${record.collection}\u0000${companyId}`);
    }

    if (record.collection === "produtos" && Array.isArray(record.data.empresas)) {
      for (const membership of new Set(record.data.empresas.filter(value => typeof value === "string" && value))) {
        companies.add(membership);
        incrementCount(productMembershipCounts, membership);
      }
    }
  }

  const expectedCollections = Object.fromEntries(Object.entries(manifest.collections)
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a.localeCompare(b)));
  const actualCollections = Object.fromEntries([...collectionCounts.entries()].sort(([a], [b]) => a.localeCompare(b)));
  if (total !== manifest.documentCount || JSON.stringify(actualCollections) !== JSON.stringify(expectedCollections)) {
    throw new Error(`O NDJSON diverge do manifesto: ${total}/${manifest.documentCount} documentos; nenhuma consulta remota foi executada.`);
  }

  return {total, collectionCounts, tenantCounts, productMembershipCounts, companies};
}

const local = await inspectLocalArchive();
const expected = Object.fromEntries(Object.entries(manifest.collections)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a.localeCompare(b)));
const actual = {};
for (const collectionPath of Object.keys(expected)) {
  actual[collectionPath] = await remoteCount(collectionPath);
}
const total = await remoteCount();
const documentsWithoutUpdateTime = await remoteCount(undefined, {source_update_time: "is.null"});
const differences = Object.entries(expected)
    .filter(([collectionPath, count]) => actual[collectionPath] !== count)
    .map(([collectionPath, expectedCount]) => ({
      collection: collectionPath,
      esperado: expectedCount,
      importado: actual[collectionPath],
    }));

const tenantDifferences = [];
for (const key of local.tenantCounts.keys()) {
  const [collectionPath, companyId] = key.split("\u0000");
  const expectedCount = local.tenantCounts.get(key);
  const importedCount = await remoteCount(collectionPath, {empresa_id: `eq.${companyId}`});
  if (importedCount !== expectedCount) {
    tenantDifferences.push({colecao: collectionPath, empresa: companyId, esperado: expectedCount, importado: importedCount});
  }
}

const productMembershipDifferences = [];
for (const companyId of local.companies) {
  const expectedCount = local.productMembershipCounts.get(companyId) || 0;
  if (expectedCount === 0) continue;
  const importedCount = await remoteCount("produtos", {
    "payload->empresas": `cs.${JSON.stringify([companyId])}`,
  });
  if (importedCount !== expectedCount) {
    productMembershipDifferences.push({empresa: companyId, esperado: expectedCount, importado: importedCount});
  }
}

const report = {
  projetoFirebase: expectedProjectId,
  documentosEsperados: manifest.documentCount,
  documentosNoArquivo: total,
  documentosSemUpdateTime: documentsWithoutUpdateTime,
  colecoesConferidas: Object.keys(expected).length,
  diferencas: differences,
  empresasConferidas: local.companies.size,
  diferencasPorEmpresa: tenantDifferences,
  diferencasVinculosProdutos: productMembershipDifferences,
  resultado: total === manifest.documentCount && documentsWithoutUpdateTime === 0 && differences.length === 0 &&
      tenantDifferences.length === 0 && productMembershipDifferences.length === 0 ? "correto" : "divergente",
};
console.log(JSON.stringify(report, null, 2));
if (report.resultado !== "correto") process.exitCode = 1;
