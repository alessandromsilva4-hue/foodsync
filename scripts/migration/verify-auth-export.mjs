#!/usr/bin/env node

// Local-only preflight for a Firebase Auth export. Reports aggregates only;
// never prints emails, UIDs, or password hashes.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {fileURLToPath} from "node:url";
import loadMigrationEnv from "./load-env.cjs";

loadMigrationEnv(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env.migration"));

const [authFile, firestoreFile] = process.argv.slice(2);
const expectedProjectId = process.env.FIREBASE_PROJECT_ID || "foodsync-43a7e";
if (!authFile) {
  throw new Error("Uso: node scripts/migration/verify-auth-export.mjs <auth-users.ndjson> [firestore.ndjson]");
}

function readManifest(file) {
  const manifestPath = `${file}.manifest.json`;
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
  return manifest;
}

const authManifest = readManifest(authFile);
if (!Number.isSafeInteger(authManifest.users) || authManifest.users < 0) {
  throw new Error("Manifesto Auth sem contagem válida de usuários.");
}

const uids = new Set();
const emails = new Map();
const providers = new Map();
let total = 0;
let passwordUsers = 0;
let hashesAvailable = 0;
let malformed = 0;
let lineNumber = 0;
const lines = readline.createInterface({
  input: fs.createReadStream(authFile, {encoding: "utf8"}),
  crlfDelay: Infinity,
});

for await (const line of lines) {
  lineNumber += 1;
  if (!line.trim()) continue;
  let user;
  try {
    user = JSON.parse(line);
  } catch {
    malformed += 1;
    continue;
  }
  if (!user || typeof user.uid !== "string" || !user.uid || !Array.isArray(user.providerData)) {
    malformed += 1;
    continue;
  }

  total += 1;
  uids.add(user.uid);
  const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
  if (email) emails.set(email, (emails.get(email) || 0) + 1);

  let hasPasswordProvider = false;
  for (const provider of user.providerData) {
    if (!provider || typeof provider.providerId !== "string") continue;
    providers.set(provider.providerId, (providers.get(provider.providerId) || 0) + 1);
    if (provider.providerId === "password") hasPasswordProvider = true;
  }
  if (hasPasswordProvider) {
    passwordUsers += 1;
    if (typeof user.passwordHash === "string" && user.passwordHash &&
        typeof user.passwordSalt === "string" && user.passwordSalt) hashesAvailable += 1;
  }
}

const duplicateEmailCount = [...emails.values()].filter(count => count > 1).length;
const duplicateUidCount = total - uids.size;
const computedHashesMissing = authManifest.passwordHashesRequested
  ? passwordUsers - hashesAvailable
  : 0;
const computedHashesOmitted = authManifest.passwordHashesRequested ? 0 : passwordUsers;
if ((Number.isSafeInteger(authManifest.passwordUsers) && authManifest.passwordUsers !== passwordUsers) ||
    (Number.isSafeInteger(authManifest.hashesIncluded) && authManifest.hashesIncluded !== hashesAvailable) ||
    (Number.isSafeInteger(authManifest.hashesMissing) && authManifest.hashesMissing !== computedHashesMissing) ||
    (Number.isSafeInteger(authManifest.hashesOmitted) && authManifest.hashesOmitted !== computedHashesOmitted)) {
  throw new Error("Contagens de hashes/contas do arquivo Auth divergem do manifesto.");
}
const profileIds = new Set();
let authProfilesMatched = 0;
let firestoreDocumentCount = null;

if (firestoreFile) {
  const firestoreManifest = readManifest(firestoreFile);
  if (!Number.isSafeInteger(firestoreManifest.documentCount) || !firestoreManifest.collections) {
    throw new Error("Manifesto Firestore sem totais válidos.");
  }
  let firestoreTotal = 0;
  let firestoreUsers = 0;
  const firestoreLines = readline.createInterface({
    input: fs.createReadStream(firestoreFile, {encoding: "utf8"}),
    crlfDelay: Infinity,
  });
  let firestoreLineNumber = 0;
  for await (const line of firestoreLines) {
    firestoreLineNumber += 1;
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      throw new Error(`JSON inválido na linha ${firestoreLineNumber} do arquivo Firestore.`);
    }
    if (!record || typeof record.collection !== "string" || typeof record.id !== "string") {
      throw new Error(`Registro inválido na linha ${firestoreLineNumber} do arquivo Firestore.`);
    }
    firestoreTotal += 1;
    if (record.collection === "usuarios") {
      firestoreUsers += 1;
      profileIds.add(record.id);
    }
  }
  if (firestoreTotal !== firestoreManifest.documentCount ||
      firestoreUsers !== (firestoreManifest.collections.usuarios || 0)) {
    throw new Error("Arquivo Firestore diverge do manifesto; comparação de perfis cancelada.");
  }
  firestoreDocumentCount = firestoreTotal;
  for (const uid of uids) if (profileIds.has(uid)) authProfilesMatched += 1;
}

if (total !== authManifest.users || malformed > 0 || duplicateUidCount > 0) {
  throw new Error(`Export Auth inválido/incompleto: ${total}/${authManifest.users} usuários, ${malformed} registros inválidos, ${duplicateUidCount} UIDs repetidos.`);
}

const profilesMissing = firestoreFile ? total - authProfilesMatched : null;
const passwordHashesMissing = passwordUsers - hashesAvailable;
const report = {
  projetoFirebase: expectedProjectId,
  usuariosEsperados: authManifest.users,
  usuariosExportados: total,
  contasComSenha: passwordUsers,
  hashesDeSenhaDisponiveis: hashesAvailable,
  contasComSenhaSemHash: passwordHashesMissing,
  hashesSolicitados: Boolean(authManifest.passwordHashesRequested),
  eMailsDuplicados: duplicateEmailCount,
  perfisFirestoreConferidos: firestoreFile !== undefined,
  documentosFirestoreExportados: firestoreDocumentCount,
  usuariosComPerfilFirestoreCorrespondente: firestoreFile ? authProfilesMatched : null,
  usuariosSemPerfilFirestore: profilesMissing,
  provedores: Object.fromEntries([...providers.entries()].sort(([a], [b]) => a.localeCompare(b))),
  resultado: passwordHashesMissing === 0 && duplicateEmailCount === 0 && (!firestoreFile || profilesMissing === 0)
    ? "pronto_para_revisao"
    : "requer_revisao",
};

console.log(JSON.stringify(report, null, 2));
if (report.resultado !== "pronto_para_revisao") process.exitCode = 1;
