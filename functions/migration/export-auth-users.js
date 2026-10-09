"use strict";

// Exports Firebase Authentication records for the planned user migration.
// Password hashes are omitted unless explicitly requested, and the output
// defaults to LocalAppData rather than the repository.

const fs = require("node:fs");
const path = require("node:path");
const {once} = require("node:events");
const {applicationDefault, initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const loadMigrationEnv = require("../../scripts/migration/load-env.cjs");

loadMigrationEnv(path.resolve(__dirname, "../../.env.migration"));

const projectId = process.env.FIREBASE_PROJECT_ID || "foodsync-43a7e";
const defaultRoot = process.env.LOCALAPPDATA || process.env.TEMP;
const outputArgument = process.argv[2];
const includePasswordHashes = process.argv.includes("--include-password-hashes");

if (!defaultRoot && !outputArgument) {
  throw new Error(
      "Defina LOCALAPPDATA ou TEMP, ou informe o caminho de saída.",
  );
}

const outputPath = path.resolve(
    outputArgument || path.join(
        defaultRoot,
        "LotrixMigration",
        "auth-users.ndjson",
    ),
);

/** Write one NDJSON record and wait until the stream can accept more. */
async function writeLine(stream, value) {
  if (!stream.write(`${JSON.stringify(value)}\n`)) await once(stream, "drain");
}

/** Export Firebase Auth users to a private local file and aggregate manifest. */
async function main() {
  const partialPath = `${outputPath}.partial`;
  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  if (fs.existsSync(partialPath)) fs.unlinkSync(partialPath);

  const appName = `lotrix-auth-export-${Date.now()}`;
  const app = initializeApp({
    credential: applicationDefault(),
    projectId,
  }, appName);
  const auth = getAuth(app);
  const stream = fs.createWriteStream(partialPath, {encoding: "utf8", flags: "wx"});
  const stats = {
    projectId,
    users: 0,
    passwordUsers: 0,
    hashesIncluded: 0,
    hashesMissing: 0,
    hashesOmitted: 0,
  };

  try {
    let pageToken;
    do {
      const page = await auth.listUsers(1000, pageToken);
      for (const user of page.users) {
        const record = {
          uid: user.uid,
          email: user.email || null,
          emailVerified: user.emailVerified,
          displayName: user.displayName || null,
          disabled: user.disabled,
          phoneNumber: user.phoneNumber || null,
          photoURL: user.photoURL || null,
          metadata: {
            creationTime: user.metadata.creationTime || null,
            lastSignInTime: user.metadata.lastSignInTime || null,
            lastRefreshTime: user.metadata.lastRefreshTime || null,
          },
          providerData: user.providerData.map((provider) => ({
            providerId: provider.providerId,
            uid: provider.uid,
            email: provider.email || null,
            displayName: provider.displayName || null,
            phoneNumber: provider.phoneNumber || null,
            photoURL: provider.photoURL || null,
          })),
          customClaims: user.customClaims || {},
          tenantId: user.tenantId || null,
        };

        const passwordProvider = user.providerData.some(
            (provider) => provider.providerId === "password",
        );
        if (passwordProvider) {
          stats.passwordUsers += 1;
          if (includePasswordHashes) {
            if (user.passwordHash && user.passwordSalt) {
              record.passwordHash = user.passwordHash;
              record.passwordSalt = user.passwordSalt;
              stats.hashesIncluded += 1;
            } else {
              stats.hashesMissing += 1;
            }
          } else {
            stats.hashesOmitted += 1;
          }
        }

        await writeLine(stream, record);
        stats.users += 1;
      }
      pageToken = page.pageToken;
    } while (pageToken);

    stream.end();
    await once(stream, "finish");
    fs.renameSync(partialPath, outputPath);
    fs.writeFileSync(`${outputPath}.manifest.json`, `${JSON.stringify({
      ...stats,
      exportedAt: new Date().toISOString(),
      passwordHashesRequested: includePasswordHashes,
    }, null, 2)}\n`, {flag: "w", mode: 0o600});
    console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    stream.destroy();
    if (fs.existsSync(partialPath)) fs.unlinkSync(partialPath);
    throw error;
  } finally {
    await app.delete();
  }
}

main().catch((error) => {
    console.error(
        `Exportação Firebase Auth não concluída: ${error.message}`,
    );
  process.exitCode = 1;
});
