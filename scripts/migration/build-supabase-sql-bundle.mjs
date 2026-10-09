#!/usr/bin/env node

// Build ordered, secret-free per-migration SQL files for Supabase SQL Editor.
// Running one file at a time makes failures visible before the next migration.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../..");
const migrationsDirectory = path.join(repositoryRoot, "supabase", "migrations");
const outputDirectory = path.resolve(
    process.argv[2] || path.join(scriptDirectory, "generated", "migrations"),
);

const migrations = fs.readdirSync(migrationsDirectory)
    .filter(name => /^\d{12}_[a-z0-9_-]+\.sql$/i.test(name))
    .sort((left, right) => left.localeCompare(right));

if (migrations.length === 0) {
  throw new Error(`Nenhuma migration encontrada em ${migrationsDirectory}.`);
}
if (migrations[0].slice(8, 12) !== "0001") {
  throw new Error(`${migrations[0]} deve iniciar sua data com a sequência 0001.`);
}

for (let index = 1; index < migrations.length; index += 1) {
  const previous = migrations[index - 1].slice(0, 12);
  const current = migrations[index].slice(0, 12);
  const previousDate = previous.slice(0, 8);
  const currentDate = current.slice(0, 8);
  const previousSequence = Number(previous.slice(8));
  const currentSequence = Number(current.slice(8));
  if (currentDate === previousDate && currentSequence !== previousSequence + 1) {
    throw new Error(`Há uma lacuna na sequência de migrations entre ${previous} e ${current}.`);
  }
  if (currentDate !== previousDate && currentSequence !== 1) {
    throw new Error(`${migrations[index]} deve iniciar sua data com a sequência 0001.`);
  }
}

const prepared = migrations.map(name => {
  const source = fs.readFileSync(path.join(migrationsDirectory, name), "utf8");
  if (/^\s*(?:begin|commit|rollback)\s*;/im.test(source)) {
    throw new Error(`${name} contém controle de transação próprio; revise antes de empacotar.`);
  }
  const contents = [
    `-- >>> BEGIN ${name}`,
    "begin;",
    source.trimEnd(),
    "commit;",
    `-- <<< END ${name}`,
  ].join("\n");
  return {
    file: name,
    contents: `${contents}\n`,
    bytes: Buffer.byteLength(contents, "utf8") + 1,
    sha256: crypto.createHash("sha256").update(contents, "utf8").digest("hex"),
  };
});

fs.mkdirSync(outputDirectory, {recursive: true});
for (const migration of prepared) {
  fs.writeFileSync(
      path.join(outputDirectory, migration.file),
      migration.contents,
      {encoding: "utf8", flag: "w"},
  );
}

const manifest = {
  migrations: prepared.map(({file, bytes, sha256}) => ({file, bytes, sha256})),
};
fs.writeFileSync(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    {encoding: "utf8", flag: "w"},
);
console.log(JSON.stringify({
  migrations: migrations.length,
  firstMigration: migrations[0],
  lastMigration: migrations[migrations.length - 1],
  outputDirectory,
  files: prepared.map(({file, bytes, sha256}) => ({file, bytes, sha256})),
  containsSecrets: false,
}, null, 2));
