# Controlled-Pilot Deployment

The included Docker image is a single-instance pilot deployment. It uses SQLite on a persistent volume and therefore must not be horizontally scaled.

## Required environment

- `ENVIRONMENT=production`
- `PUBLIC_BASE_URL=https://your-domain.example`
- `DATABASE_PATH=/data/justice_grows.db`
- `DATA_DIR=/data`
- `DATA_ENCRYPTION_KEY=<Fernet key>`
- `ADMIN_TOKEN=<at least 48 random bytes encoded as URL-safe text>`
- `PUBLIC_AGGREGATE_MIN_N=10`
- Optional `SUBMISSION_WEBHOOK_URL=<HTTPS endpoint>`

## Platform requirements

- One container instance
- Persistent encrypted disk mounted at `/data`
- TLS at the load balancer
- Health check at `/api/health`
- Daily encrypted snapshot of `/data`
- Outbound HTTPS allowed only as needed for the optional webhook
- Inbound access to `/admin` restricted by identity-aware proxy or VPN in addition to the application token
- Central access/error logs and uptime alerts

## Deploy sequence

1. Create the persistent disk and secret values.
2. Build and deploy one container.
3. Confirm `/api/health` and run `scripts/smoke_test.py`.
4. Confirm the public dashboard shows zero real activity on a fresh database.
5. Restrict `/admin`; verify token rejection and success.
6. Submit a test candidate with non-real data in staging only; verify Passport access and deletion.
7. Test backup and restore.
8. Complete counsel, security, accessibility, and operating gates before real public records are entered.

## Scale trigger

Migrate to the architecture in `docs/PRODUCTION_ARCHITECTURE.md` before any of the following:

- More than one web instance
- National unrestricted public launch
- Source-document uploads
- More than 5,000 candidate profiles
- Multiple external organizations using the admin console
- Automated jurisdiction connectors
- Employment-screening or consumer-reporting functionality of any kind
