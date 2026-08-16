# Postman Guide - DubusApp Backup Cron

## Full API Collection

- Collection: `DubusApp-Full-API.postman_collection.json`
- Scope: auth/login flow, public API, protected session API, internal token API, dan cron token API.

### Quick Run Order (Full API)

1. `01.1 - Get CSRF Token`
2. `01.2 - Login Credentials (Callback)`
3. `01.3 - Get Session`
4. Lanjut test folder `03 - Protected API (Session)`

### Variables to Fill (Full API)

- `baseUrl` (default: `http://localhost:3000`)
- `username`
- `password`
- `rbacInternalToken` (isi `RBAC_INTERNAL_TOKEN` atau secret internal yang dipakai app)
- `cronSecret` (isi `CRON_SECRET`)
- Data IDs untuk test: `customerId`, `itemId`, `itemSizeId1`, `headerSizeCustomerId`, `roleId`

## Files

- Collection: `DubusApp-Backup-Cron.postman_collection.json`
- Environment: `DubusApp-Backup-Cron.postman_environment.json`

## Import Steps

1. Open Postman.
2. Click `Import`.
3. Import both files from `postman/` folder.
4. Select environment `DubusApp Backup Cron Env`.

## Environment Variables to Fill

- `cronSecret`: value from `CRON_SECRET`
- `backupWebhookUrl`: your backup runner endpoint
- `backupWebhookToken`: value from `BACKUP_WEBHOOK_TOKEN`
- `localBaseUrl`: default `http://localhost:3000` (or `http://localhost:3001` if needed)
- `vercelBaseUrl`: your Vercel app URL

## Recommended Test Order

1. `01 - Local Cron Unauthorized`
2. `02 - Local Cron Authorized`
3. `03 - Vercel Cron Authorized`
4. `04 - Backup Webhook Direct Test` (optional)

## Expected Response

### 01 - Local Cron Unauthorized

- Expected status: `401`
- Meaning: cron endpoint auth guard works.

### 02 - Local Cron Authorized

- Expected status: `200`, `500`, or `502`
- Meaning:
  - `200`: trigger to backup runner succeeded
  - `500/502`: backup runner URL/token or runner service problem

### 03 - Vercel Cron Authorized

- Expected status: `200`, `401`, `500`, or `502`
- Meaning:
  - `401`: wrong `cronSecret`
  - `200`: trigger success
  - `500/502`: downstream backup runner issue

### 04 - Backup Webhook Direct Test

- Expected status: `200`, `201`, `202`, `401`, `403`, or `500`
- Meaning:
  - `200/201/202`: runner accepts and processes request
  - `401/403`: wrong `backupWebhookToken`
  - `500`: runner internal issue

## Troubleshooting

- If local request fails to connect, ensure app is running (`npm run dev`).
- If local app uses port `3001`, update `localBaseUrl` accordingly.
- If Vercel request returns `401`, verify `CRON_SECRET` value in Vercel.
- If authorized cron returns `500/502`, verify `BACKUP_WEBHOOK_URL` and runner availability.
- Do not commit real token values into collection/environment files.
