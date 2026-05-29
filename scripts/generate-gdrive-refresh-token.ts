import dotenv from "dotenv";
import { google } from "googleapis";
import readline from "readline";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

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

function askUserInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function loadOAuthClientCredentials(): {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
} {
  const fromEnvId = process.env.GDRIVE_OAUTH_CLIENT_ID?.trim();
  const fromEnvSecret = process.env.GDRIVE_OAUTH_CLIENT_SECRET?.trim();
  if (fromEnvId && fromEnvSecret) {
    return {
      clientId: fromEnvId,
      clientSecret: fromEnvSecret,
      redirectUris: [],
    };
  }

  const oauthFile = process.env.GDRIVE_OAUTH_CLIENT_FILE?.trim();
  if (!oauthFile) {
    throw new Error(
      "Missing OAuth client settings. Set GDRIVE_OAUTH_CLIENT_ID/GDRIVE_OAUTH_CLIENT_SECRET or GDRIVE_OAUTH_CLIENT_FILE"
    );
  }

  const absolutePath = path.resolve(oauthFile);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`OAuth client file not found: ${absolutePath}`);
  }

  const raw = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as {
    installed?: { client_id?: string; client_secret?: string; redirect_uris?: string[] };
    web?: { client_id?: string; client_secret?: string; redirect_uris?: string[] };
  };

  const source = raw.installed ?? raw.web;
  const clientId = source?.client_id?.trim();
  const clientSecret = source?.client_secret?.trim();
  const redirectUris = source?.redirect_uris ?? [];

  if (!clientId || !clientSecret) {
    throw new Error(
      `Invalid OAuth client file: ${absolutePath}. Expected installed/web.client_id and client_secret.`
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUris,
  };
}

async function main() {
  const oauthCredentials = loadOAuthClientCredentials();
  const clientId = oauthCredentials.clientId;
  const clientSecret = oauthCredentials.clientSecret;
  const redirectUri =
    process.env.GDRIVE_OAUTH_REDIRECT_URI?.trim() ||
    oauthCredentials.redirectUris[0] ||
    "http://localhost";

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: getDriveScopes(),
  });

  console.log("Open this URL in your browser and authorize access:");
  console.log(`Using redirect URI: ${redirectUri}`);
  console.log(authUrl);
  console.log("");

  const code = await askUserInput("Paste the authorization code here: ");
  if (!code) {
    throw new Error("Authorization code is required");
  }

  const tokenResponse = await oauth2Client.getToken(code);
  const tokens = tokenResponse.tokens;

  if (!tokens.refresh_token) {
    throw new Error(
      "Refresh token was not returned. Re-run and ensure prompt=consent is used, and revoke prior app access if needed."
    );
  }

  console.log("\nOAuth token generated successfully.");
  console.log("Add these values to your .env:");
  console.log(`GDRIVE_OAUTH_CLIENT_ID=\"${clientId}\"`);
  console.log(`GDRIVE_OAUTH_CLIENT_SECRET=\"${clientSecret}\"`);
  console.log(`GDRIVE_OAUTH_REFRESH_TOKEN=\"${tokens.refresh_token}\"`);

  if (redirectUri) {
    console.log(`GDRIVE_OAUTH_REDIRECT_URI=\"${redirectUri}\"`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to generate refresh token: ${message}`);
  process.exit(1);
});
