import dotenv from "dotenv";

import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// Explicitly load runtime env files used by this script.
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

type OAuthClientCredentials = {
  clientId: string;
  clientSecret: string;
};

function getDriveScopes(): string[] {
  const raw = process.env.GDRIVE_OAUTH_SCOPES?.trim();
  if (!raw) {
    return ["https://www.googleapis.com/auth/drive.file"];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadOAuthClientCredentials(): OAuthClientCredentials | null {
  const fromEnvId = process.env.GDRIVE_OAUTH_CLIENT_ID?.trim();
  const fromEnvSecret = process.env.GDRIVE_OAUTH_CLIENT_SECRET?.trim();
  if (fromEnvId && fromEnvSecret) {
    return {
      clientId: fromEnvId,
      clientSecret: fromEnvSecret,
    };
  }

  const oauthFile = process.env.GDRIVE_OAUTH_CLIENT_FILE?.trim();
  if (!oauthFile) {
    return null;
  }

  const absolutePath = path.resolve(oauthFile);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`OAuth client file not found: ${absolutePath}`);
  }

  const raw = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as {
    installed?: { client_id?: string; client_secret?: string };
    web?: { client_id?: string; client_secret?: string };
  };

  const source = raw.installed ?? raw.web;
  const clientId = source?.client_id?.trim();
  const clientSecret = source?.client_secret?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      `Invalid OAuth client file: ${absolutePath}. Expected installed/web.client_id and client_secret.`
    );
  }

  return {
    clientId,
    clientSecret,
  };
}

function hasOAuthCredentials(): boolean {
  return Boolean(loadOAuthClientCredentials() && process.env.GDRIVE_OAUTH_REFRESH_TOKEN?.trim());
}

function validateRefreshToken(refreshToken: string) {
  const trimmed = refreshToken.trim();
  if (!trimmed) {
    throw new Error("GDRIVE_OAUTH_REFRESH_TOKEN is empty");
  }

  // Google authorization codes often start with "4/" while refresh tokens are typically "1//".
  if (trimmed.startsWith("4/")) {
    throw new Error(
      "GDRIVE_OAUTH_REFRESH_TOKEN looks like an authorization code (starts with '4/'). Re-run npm run db:gdrive:oauth-token and use the printed GDRIVE_OAUTH_REFRESH_TOKEN value."
    );
  }
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw || !raw.trim()) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid number in ${name}: ${raw}`);
  }

  return Math.floor(parsed);
}

function loadServiceAccount(): ServiceAccountCredentials {
  const fromJson = process.env.GDRIVE_SERVICE_ACCOUNT_JSON;
  if (fromJson && fromJson.trim()) {
    const parsed = JSON.parse(fromJson) as ServiceAccountCredentials;
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  }

  const fromBase64 = process.env.GDRIVE_SERVICE_ACCOUNT_BASE64;
  if (fromBase64 && fromBase64.trim()) {
    const decoded = Buffer.from(fromBase64, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as ServiceAccountCredentials;
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  }

  const credentialsFile = process.env.GDRIVE_SERVICE_ACCOUNT_FILE;
  if (credentialsFile && credentialsFile.trim()) {
    const absolutePath = path.resolve(credentialsFile);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Service account file not found: ${absolutePath}`);
    }

    const fileText = fs.readFileSync(absolutePath, "utf8");
    const parsed = JSON.parse(fileText) as ServiceAccountCredentials;
    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  }

  throw new Error(
    "Missing Google credentials. Provide one of: GDRIVE_SERVICE_ACCOUNT_JSON, GDRIVE_SERVICE_ACCOUNT_BASE64, or GDRIVE_SERVICE_ACCOUNT_FILE"
  );
}

function validateCredentials(credentials: ServiceAccountCredentials) {
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      "Invalid service account credentials: client_email and private_key are required"
    );
  }
}

async function ensurePgDumpAvailable() {
  const command = getPgDumpCommand();

  try {
    await execFileAsync(command, ["--version"]);
    return command;
  } catch {
    throw new Error(
      "pg_dump not found. Set PG_DUMP_PATH or install PostgreSQL client tools and ensure pg_dump is available"
    );
  }
}

function getPgDumpCommand(): string {
  const fromEnv = process.env.PG_DUMP_PATH?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  const commonCandidates = findCommonPgDumpCandidates();
  for (const candidate of commonCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return "pg_dump";
}

function findCommonPgDumpCandidates(): string[] {
  const candidates: string[] = [];

  if (process.platform !== "win32") {
    return candidates;
  }

  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const postgreSqlRoot = path.join(programFiles, "PostgreSQL");

  if (fs.existsSync(postgreSqlRoot)) {
    const versions = fs.readdirSync(postgreSqlRoot, { withFileTypes: true });
    for (const version of versions) {
      if (version.isDirectory()) {
        candidates.push(
          path.join(postgreSqlRoot, version.name, "bin", "pg_dump.exe")
        );
      }
    }
  }

  const laragonRoot = "C:\\laragon\\bin\\postgresql";
  if (fs.existsSync(laragonRoot)) {
    const versions = fs.readdirSync(laragonRoot, { withFileTypes: true });
    for (const version of versions) {
      if (version.isDirectory()) {
        candidates.push(path.join(laragonRoot, version.name, "bin", "pg_dump.exe"));
      }
    }
  }

  return candidates.reverse();
}

async function runPgDump(pgDumpCommand: string, outputFile: string, databaseUrl: string) {
  await execFileAsync(pgDumpCommand, [
    `--dbname=${databaseUrl}`,
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    `--file=${outputFile}`,
  ]);
}

function cleanupLocalBackups(backupDir: string, keepDays: number) {
  const cutoffTimestamp = Date.now() - keepDays * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(backupDir);

  for (const file of files) {
    if (!file.endsWith(".dump")) {
      continue;
    }

    const fullPath = path.join(backupDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.mtimeMs < cutoffTimestamp) {
      fs.unlinkSync(fullPath);
    }
  }
}

async function getDriveClient() {
  if (hasOAuthCredentials()) {
    const oauthCredentials = loadOAuthClientCredentials();
    if (!oauthCredentials) {
      throw new Error("OAuth credentials are missing");
    }

    const refreshToken = process.env.GDRIVE_OAUTH_REFRESH_TOKEN?.trim() || "";
    validateRefreshToken(refreshToken);

    const oauth = new google.auth.OAuth2(
      oauthCredentials.clientId,
      oauthCredentials.clientSecret
    );

    oauth.setCredentials({
      refresh_token: refreshToken,
    });

    return google.drive({ version: "v3", auth: oauth });
  }

  const credentials = loadServiceAccount();
  validateCredentials(credentials);

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: getDriveScopes(),
  });

  await auth.authorize();
  return google.drive({ version: "v3", auth });
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function resolveDriveFolderId(
  drive: ReturnType<typeof google.drive>
): Promise<string | undefined> {
  const folderId = process.env.GDRIVE_FOLDER_ID?.trim();
  if (folderId) {
    return folderId;
  }

  const folderName = process.env.GDRIVE_FOLDER_NAME?.trim();
  if (!folderName) {
    return undefined;
  }

  const escapedName = escapeDriveQueryValue(folderName);
  const list = await drive.files.list({
    q: [
      "trashed = false",
      "mimeType = 'application/vnd.google-apps.folder'",
      `name = '${escapedName}'`,
    ].join(" and "),
    fields: "files(id,name,createdTime)",
    orderBy: "createdTime desc",
    pageSize: 10,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const folders = list.data.files ?? [];
  if (folders.length === 0) {
    throw new Error(
      `Google Drive folder not found by name: ${folderName}. Set GDRIVE_FOLDER_ID directly if needed.`
    );
  }

  if (folders.length > 1) {
    const ids = folders.map((folder) => folder.id).filter(Boolean).join(", ");
    throw new Error(
      `Multiple folders found with name '${folderName}'. Set GDRIVE_FOLDER_ID explicitly. Candidates: ${ids}`
    );
  }

  return folders[0]?.id || undefined;
}

async function uploadToDrive(
  drive: ReturnType<typeof google.drive>,
  localFilePath: string,
  fileName: string,
  folderId?: string
) {

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType: "application/octet-stream",
      body: fs.createReadStream(localFilePath),
    },
    supportsAllDrives: true,
    fields: "id,name,webViewLink",
  });

  return {
    id: response.data.id || "",
    name: response.data.name || fileName,
    webViewLink: response.data.webViewLink || "",
  };
}

async function cleanupRemoteBackups(
  drive: ReturnType<typeof google.drive>,
  folderId: string | undefined,
  prefix: string,
  keepFiles: number
) {
  if (keepFiles <= 0) {
    return;
  }

  if (!folderId) {
    return;
  }

  const query = [
    `'${folderId}' in parents`,
    "trashed = false",
    `name contains '${prefix}'`,
  ].join(" and ");

  const list = await drive.files.list({
    q: query,
    fields: "files(id,name,createdTime)",
    orderBy: "createdTime desc",
    pageSize: 200,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  const files = list.data.files ?? [];
  if (files.length <= keepFiles) {
    return;
  }

  const toDelete = files.slice(keepFiles);
  for (const file of toDelete) {
    if (!file.id) {
      continue;
    }

    await drive.files.delete({
      fileId: file.id,
      supportsAllDrives: true,
    });
  }
}

function getTimestamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

function getLocalNoSslFallbackUrl(databaseUrl: string): string | null {
  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname.toLowerCase();
    const sslmode = parsed.searchParams.get("sslmode")?.toLowerCase();

    if ((host === "localhost" || host === "127.0.0.1") && sslmode === "require") {
      parsed.searchParams.set("sslmode", "disable");
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

async function main() {
  const directUrl = process.env.DIRECT_URL?.trim();
  const databaseUrl = directUrl || getRequiredEnv("DATABASE_URL");

  const backupDir = process.env.BACKUP_DIR?.trim() || "backups";
  const keepDays = parseIntEnv("BACKUP_KEEP_DAYS", 14);
  const keepRemoteFiles = parseIntEnv("GDRIVE_KEEP_FILES", 30);
  const prefix = process.env.BACKUP_FILE_PREFIX?.trim() || "dubusapp_";

  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = getTimestamp();
  const fileName = `${prefix}${timestamp}.dump`;
  const outputFile = path.join(backupDir, fileName);

  console.log(`Starting database backup: ${outputFile}`);

  const pgDumpCommand = await ensurePgDumpAvailable();
  try {
    await runPgDump(pgDumpCommand, outputFile, databaseUrl);
  } catch (error) {
    const fallbackUrl = getLocalNoSslFallbackUrl(databaseUrl);
    if (!fallbackUrl) {
      throw error;
    }

    console.log("Retrying pg_dump with sslmode=disable for localhost...");
    await runPgDump(pgDumpCommand, outputFile, fallbackUrl);
  }

  console.log(`Backup created successfully: ${outputFile}`);

  cleanupLocalBackups(backupDir, keepDays);
  console.log(`Local cleanup done. Keep days: ${keepDays}`);

  const drive = await getDriveClient();
  const folderId = await resolveDriveFolderId(drive);
  if (folderId) {
    console.log(`Target Google Drive folder ID: ${folderId}`);
  }

  const uploaded = await uploadToDrive(drive, outputFile, fileName, folderId);
  if (uploaded.webViewLink) {
    console.log(`Uploaded to Google Drive: ${uploaded.webViewLink}`);
  } else {
    console.log(`Uploaded to Google Drive. File ID: ${uploaded.id}`);
  }

  await cleanupRemoteBackups(drive, folderId, prefix, keepRemoteFiles);
  console.log(`Remote cleanup done. Keep files: ${keepRemoteFiles}`);
}

main().catch((error: unknown) => {
  let message = error instanceof Error ? error.message : String(error);
  if (message.includes("Service Accounts do not have storage quota")) {
    message = `${message}\nHint: Use a folder inside a Shared Drive and set GDRIVE_FOLDER_ID to that folder ID, or set GDRIVE_OAUTH_CLIENT_ID/GDRIVE_OAUTH_CLIENT_SECRET/GDRIVE_OAUTH_REFRESH_TOKEN to upload with user OAuth credentials.`;
  }

  console.error(`Backup failed: ${message}`);
  process.exit(1);
});
