#!/usr/bin/env node

// Report migration prerequisites without printing credentials or customer data.

import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import loadMigrationEnv from "./load-env.cjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
loadMigrationEnv(path.resolve(scriptDirectory, "../../.env.migration"));

const firebaseCredentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "";
const firebaseCredentialFileFound = firebaseCredentialPath &&
  fs.existsSync(firebaseCredentialPath);
const firebaseAdcCandidates = [
  process.env.APPDATA && path.join(
      process.env.APPDATA,
      "gcloud",
      "application_default_credentials.json",
  ),
  process.env.USERPROFILE && path.join(
      process.env.USERPROFILE,
      ".config",
      "gcloud",
      "application_default_credentials.json",
  ),
].filter(Boolean);
const firebaseAdcFileFound = firebaseAdcCandidates.some(candidate =>
  fs.existsSync(candidate),
);

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "") || "";
const supabaseUrlConfigured = Boolean(
  supabaseUrl && !/your-project|replace/i.test(supabaseUrl),
);
const supabaseAdminKey = process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdminKeyConfigured = Boolean(
  supabaseAdminKey && !supabaseAdminKey.startsWith("sb_publishable_") &&
  !/replace|your-project|user:password/i.test(supabaseAdminKey),
);
const supabaseDbUrl = process.env.SUPABASE_DB_URL || "";
const supabaseDbUrlConfigured = Boolean(
  supabaseDbUrl && !/replace|your-project|user:password/i.test(supabaseDbUrl),
);
const tools = Object.fromEntries(["psql", "supabase", "firebase", "gcloud"].map(name => {
  const result = spawnSync(name, ["--version"], {
    stdio: "ignore",
    windowsHide: true,
  });
  return [name, !result.error];
}));

let publicTableProbe = "not_checked";
let adminTableProbe = "not_checked";
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
if (process.argv.includes("--probe-public-table") &&
    supabaseUrlConfigured && publishableKey) {
  try {
    const response = await fetch(
        `${supabaseUrl}/rest/v1/app_documents?select=collection_path&limit=0`,
        {
          headers: {apikey: publishableKey, Authorization: `Bearer ${publishableKey}`},
          signal: AbortSignal.timeout(10000),
        },
    );
    publicTableProbe = response.ok ? "present" :
      response.status === 404 ? "missing_or_not_exposed" : `http_${response.status}`;
    await response.body?.cancel();
  } catch {
    publicTableProbe = "unavailable";
  }
} else if (process.argv.includes("--probe-public-table")) {
  publicTableProbe = "missing_public_supabase_config";
}

if (process.argv.includes("--probe-admin-table") &&
    supabaseUrlConfigured && supabaseAdminKeyConfigured) {
  try {
    const headers = {apikey: supabaseAdminKey};
    if (!supabaseAdminKey.startsWith("sb_secret_")) {
      headers.Authorization = `Bearer ${supabaseAdminKey}`;
    }
    const response = await fetch(
        `${supabaseUrl}/rest/v1/app_documents?select=collection_path&limit=0`,
        {headers, signal: AbortSignal.timeout(10000)},
    );
    adminTableProbe = response.ok ? "present" :
      response.status === 404 ? "missing_or_not_exposed" :
      [401, 403].includes(response.status) ? "credential_or_permission_rejected" :
      `http_${response.status}`;
    await response.body?.cancel();
  } catch {
    adminTableProbe = "unavailable";
  }
} else if (process.argv.includes("--probe-admin-table")) {
  adminTableProbe = "missing_admin_supabase_config";
}

const firebaseCredentialConfigured = Boolean(
  firebaseCredentialFileFound || firebaseAdcFileFound,
);
const missing = [];
if (!firebaseCredentialConfigured) missing.push("Firebase Admin credential or ADC");
if (!supabaseUrlConfigured) missing.push("SUPABASE_URL");
if (!supabaseAdminKeyConfigured) missing.push("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
const directDatabaseMissing = supabaseDbUrlConfigured ? [] : ["SUPABASE_DB_URL"];

console.log(JSON.stringify({
  firebaseProjectConfigured: Boolean(
    process.env.FIREBASE_PROJECT_ID || "foodsync-43a7e",
  ),
  firebaseCredentialFileConfigured: Boolean(firebaseCredentialPath),
  firebaseCredentialFileFound: Boolean(firebaseCredentialFileFound),
  firebaseAdcFileFound,
  supabaseProjectConfigured: Boolean(
    process.env.SUPABASE_PROJECT_REF &&
    !/your-project|replace/i.test(process.env.SUPABASE_PROJECT_REF),
  ),
  supabaseUrlConfigured,
  supabaseAdminKeyConfigured,
  supabaseDbUrlConfigured,
  publicTableProbe,
  adminTableProbe,
  tools,
  missingPrerequisites: missing,
  minimumInputsPresent: missing.length === 0,
  directDatabaseMissingPrerequisites: directDatabaseMissing,
  directDatabaseReady: directDatabaseMissing.length === 0,
  note: "SUPABASE_DB_URL só é necessária para conexão Postgres direta; o bundle pode ser aplicado no SQL Editor e a carga Firestore usa REST. Presença de arquivos/variáveis não comprova que as credenciais foram aceitas.",
}, null, 2));
