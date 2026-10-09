#!/usr/bin/env node

// Derive exact, ID-free Cloud Function paths for deeper subcollections seen in
// a complete Firestore export. Review the generated list before deployment.

import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import loadMigrationEnv from "./load-env.cjs";

loadMigrationEnv(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env.migration"));

const [manifestPath, writeFlag] = process.argv.slice(2);
if (!manifestPath || (writeFlag !== undefined && writeFlag !== "--write")) {
  throw new Error("Uso: node scripts/migration/generate-firestore-trigger-patterns.mjs <firestore.ndjson.manifest.json> [--write]");
}
if (!fs.existsSync(manifestPath)) throw new Error(`Manifesto não encontrado: ${manifestPath}`);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch {
  throw new Error("Manifesto Firestore inválido.");
}
if (manifest.projectId !== (process.env.FIREBASE_PROJECT_ID || "foodsync-43a7e") ||
    manifest.formatVersion !== 3 || !Number.isSafeInteger(manifest.documentCount) ||
    !manifest.collections || typeof manifest.collections !== "object" || Array.isArray(manifest.collections)) {
  throw new Error("Manifesto incompleto, incompatível ou de outro projeto Firebase.");
}

const patterns = new Set();
let manifestDocumentCount = 0;
for (const [collectionPath, count] of Object.entries(manifest.collections)) {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error(`Contagem inválida no manifesto para ${collectionPath}.`);
  }
  manifestDocumentCount += count;
  if (count === 0) continue;

  const segments = collectionPath.split("/");
  if (!collectionPath || segments.some(segment => !segment) || segments.length % 2 !== 1) {
    throw new Error(`Caminho de coleção inválido no manifesto: ${collectionPath}.`);
  }
  // Root and one-level paths are already covered by the two generic triggers.
  if (segments.length <= 3) continue;

  const documentPattern = segments.map((segment, index) =>
    index % 2 === 0 ? segment : `{parentDocument${(index + 1) / 2}}`,
  );
  documentPattern.push("{documentId}");
  if (documentPattern.some((segment, index) => index % 2 === 0 && /[{}]/.test(segment))) {
    throw new Error(`Nome de coleção incompatível com padrão de trigger: ${collectionPath}.`);
  }
  patterns.add(documentPattern.join("/"));
}
if (manifestDocumentCount !== manifest.documentCount) {
  throw new Error("As contagens por coleção não correspondem ao total do manifesto.");
}

const output = `${JSON.stringify([...patterns].sort(), null, 2)}\n`;
if (writeFlag === "--write") {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const outputPath = path.resolve(scriptDirectory, "../../functions/migration/firestore-trigger-patterns.json");
  fs.writeFileSync(outputPath, output, {encoding: "utf8", mode: 0o600});
  console.log(`Padrões profundos gravados para revisão: ${outputPath}`);
} else {
  process.stdout.write(output);
  console.log("Execute novamente com --write para atualizar a configuração de deploy.");
}
