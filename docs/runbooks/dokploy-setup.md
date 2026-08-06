# Dokploy and Cloudflare setup

Two configuration surfaces of this deployment have no pipeline and no review: the Dokploy panel and
the Cloudflare dashboard. Everything on them is applied by a human and cannot be inspected in a pull
request. This runbook is the record that makes them reproducible.

Both the stage environment and the production environment are built from this document. If reality
differs from what is written here — a renamed field, an extra step, a value that did not work —
correct this file in the same session. It is the only place the configuration exists.

## Before you start

| Prerequisite | Needed for |
|---|---|
| VPS provisioned with Dokploy | Everything. Dokploy's own floor is 2 GB RAM and 30 GB disk; this host also runs PostgreSQL, Loki and Grafana, so size above the floor |
| Cloudflare account with `zychlin.org` on Cloudflare DNS | Proxy, origin certificate, rate limiting, R2, email |
| R2 bucket and an API token with write access | Database backups |
| GHCR package readable by the VPS | The application image; the panel pulls, it never builds |
| Workers Paid plan on the Cloudflare account | Outbound email only; nothing else blocks on it |

Nothing here is built on the VPS. Images are built and pushed by GitHub Actions; the panel only
pulls and deploys. Dokploy's own documentation warns that on-VPS builds "can lead to timeout on
your server or even freezing your server", and this host runs the production database.

---

## Dokploy panel

### 1. Environments

Create one project with two environments: `stage` first, then `production`. Each carries its own
managed PostgreSQL, its own application and its own variables. Stage exists to rehearse the ETL
against a real Dokploy-managed PostgreSQL, so every step below is applied identically to both — a
stage that differs from production does not rehearse it.

### 2. Managed PostgreSQL

Create PostgreSQL as a Dokploy **managed database**, not as a service in the repository's
`compose.yaml`. The managed form is what supplies the scheduled `pg_dump` to S3 and the restore
flow from the UI, and that is this deployment's safety net.

- Image: `postgres:18` — the panel's own default. It must match the image in `compose.yaml`, the
  testcontainers image in the E2E harness, and the target the Drizzle migration was generated
  against. If the four disagree, the stage rehearsal is not rehearsing production.
- Note the internal connection string; the application's database variable takes it.

### 3. Application

Create the application from a Docker image, not from a repository source:

- Image: the GHCR package this repository's deploy workflow pushes. If the package is private, add
  registry credentials in the panel (a GitHub token with `read:packages`).
- Container port: 3000.
- Replicas: **1**, and see step 6 before changing it.
- Mount a volume at `/app/.data/job-files`. Speaker-list uploads are written there and read back
  by the queue worker; without a mount they live in the container's anonymous volume and a
  redeploy loses any import still in flight.
- Deployment is triggered by the deploy workflow calling the application's Dokploy webhook. Copy
  the webhook URL into the repository's Actions secrets.

### 4. Environment variables

Settings reach the application by two different routes, and mixing them up bites silently:

- Settings held in Nuxt's `runtimeConfig` are overridden only by the `NUXT_`-prefixed name —
  `NUXT_DATABASE_URL`, `NUXT_JOB_FILES_DIR`, `NUXT_CLOUDFLARE_ACCOUNT_ID`,
  `NUXT_CLOUDFLARE_EMAIL_TOKEN`, `NUXT_EMAIL_FROM`. Dropping the prefix leaves the built-in default
  in force.
- The rest are read straight from `process.env` under exactly the name they carry in
  `.env.example`, with no prefix: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ANTHROPIC_API_KEY`,
  `NUXT_SEED_STAGING`. Prefixing these makes them invisible — an app booted without
  `BETTER_AUTH_SECRET` has no session secret.
- `.env` files are not read in production. The panel is the only source of these values.

Take the key list from `.env.example` at the commit being deployed and set each name exactly as it
appears there. Images are built in CI without production secrets, so anything secret exists only
here.

### 5. Swarm health check and update configuration

Path: **Application → Advanced → Cluster Settings → Swarm Settings**. Both blocks are entered as
JSON. Durations are nanoseconds.

Update configuration:

```json
{ "Parallelism": 1, "Delay": 10000000000, "FailureAction": "rollback", "Order": "start-first" }
```

Health check:

```json
{
  "Test": ["CMD", "curl", "-f", "http://localhost:3000/health"],
  "Interval": 10000000000,
  "Timeout": 5000000000,
  "StartPeriod": 30000000000,
  "Retries": 3
}
```

Why both are mandatory: Dokploy's default deployment stops the running container before starting
the new one, which its own documentation says "leads to Bad Gateway". `Order: start-first` removes
that gap, and `FailureAction: rollback` on a failing health check is the only automatic rollback
this deployment has after leaving Workers — it is worth nothing without the health check that feeds
it.

`curl` must be present in the runtime image; the health check runs inside the container. The
endpoint answers `200` when the database is reachable and `503` when it is not.

### 6. Single replica is a constraint, not a default

Database migrations run in the container entrypoint, before the server starts, and there is no
lock around them. That is safe at one replica and only at one replica: a second replica starts a
second entrypoint that migrates the same database concurrently.

Do not raise the replica count, and do not start a second deployment while one is in flight.
Multi-replica deployment and the migration lock it requires are a separate ticket, blocked until
traffic justifies them.

### 7. Traefik forwarded headers

Dokploy's generated `traefik.yml` contains no `forwardedHeaders` block, so Traefik does not trust
inbound `X-Forwarded-For` and appends its own view of the peer — which, behind Cloudflare, is
Cloudflare. Left alone, the audit log records Cloudflare's addresses instead of the visitor's.

Edit `traefik.yml` through the panel's file editor and add the Cloudflare ranges to the HTTPS
entry point:

```yaml
entryPoints:
  websecure:
    address: ":443"
    forwardedHeaders:
      trustedIPs:
        - 173.245.48.0/20
        # …the rest of https://www.cloudflare.com/ips-v4
        - 2400:cb00::/32
        # …the rest of https://www.cloudflare.com/ips-v6
```

Paste the current lists from those two URLs rather than copying an old set from elsewhere, then
restart Traefik. One Traefik serves the whole host, so this is done once, not per environment.

Verify by making an authenticated request and reading the IP recorded on the resulting audit-log
row: it must be the client's address, not a Cloudflare one.

### 8. Backups

Configure the backup on the managed PostgreSQL:

- Destination: an S3 destination pointing at the R2 bucket — endpoint
  `https://<account_id>.r2.cloudflarestorage.com`, region `auto`, and the token's access key and
  secret. R2 is used because Cloudflare is retained for proxying anyway and R2 has no egress
  charge, which matters for restores.
- Schedule: daily.
- `keepLatestCount`: set it explicitly. Dokploy applies it after each successful run; left unset,
  the bucket grows without bound.

The dump is `pg_dump -Fc --no-acl --no-owner` piped through `gzip`, so a restore outside the panel
is `gunzip` into `pg_restore`, not `psql`.

Before the environment is considered ready, restore one nightly dump into stage PostgreSQL and run
the ETL's validation steps against the restored copy. An unexercised backup is not a safety net.

### 9. Observability

Deploy Loki and Grafana on the same host from the repository's `compose.observability.yaml` as a
Dokploy Compose service. Cloudflare's persisted logs and traces disappear at cutover and Dokploy's
container logs have no documented retention, so this is where server logs live.

Check it end to end: force an error, restart the application container, and retrieve that error
from Grafana an hour later.

### 10. Scheduled jobs

Dokploy ships a Schedule Jobs feature taking cron expressions. This deployment needs nothing from
it beyond the backup schedule above — job-file cleanup runs on pg-boss cron inside the application
process.

---

## Cloudflare dashboard

Cloudflare stays in front of the VPS as proxy, TLS edge, DDoS protection and CDN. The application
has no rate limiting of its own, so this layer is load-bearing rather than decorative.

### 11. DNS, proxy and TLS

- The record for the environment's hostname points at the VPS and is **proxied** (orange cloud).
- SSL/TLS mode: **Full (strict)**.
- Install a Cloudflare **origin certificate** on the VPS as a custom certificate in the panel and
  assign it to the domain. Full (strict) requires a certificate the edge trusts, and an HTTP-01
  challenge cannot complete through a proxied record, so the origin certificate is the path that
  works with the proxy left on.

After the DNS switch, confirm that Cloudflare request headers reach the application and that the
TLS chain terminates at the certificate installed here.

### 12. Rate limiting for the import endpoint

The speaker import endpoint accepts a 20 MB upload and makes two paid Anthropic calls behind only a
permission check. Add a rate-limiting rule matching `POST` to that path so that requests past the
configured rate are rejected at the edge.

The point of putting it here rather than in application code is that a rejected request costs
nothing: verify by exceeding the rate and confirming no extraction call was billed.

### 13. R2 bucket

Create the bucket and an API token scoped to it, then use them in step 8. Nothing else reads it.

### 14. Freeze notice

During the cutover's write freeze, a Cloudflare rule serves a maintenance response. It is raised by
hand at the start of the window and lifted after the DNS switch.

It lives on this surface deliberately: raising or lifting it cannot disturb the Workers deployment
that stays running and intact as the reversal path.

### 15. Email sending domain

Onboard `zychlin.org` as a Cloudflare Email Service sending domain. This is done before the queue
and email work is verified, not during the cutover.

- The zone must be on Cloudflare DNS. `zychlin.org` already is.
- Outbound sending requires a Workers Paid plan; it is unavailable on Free.
- Onboarding adds and locks MX, SPF and DKIM records on `cf-bounce.<domain>` plus DMARC on
  `_dmarc`, and keeps them managed for the lifetime of the domain configuration.
- The starting daily send quota is not published anywhere. Read the actual figure in the dashboard
  once the domain is onboarded, and revisit the decision to use this service if it sits below the
  registration rate.

---

## Ready checklist

Run this before declaring an environment ready.

| Check | Expected |
|---|---|
| `/health` from inside the deployment | `200`; `503` with the database stopped |
| A deployment while the old container serves traffic | No Bad Gateway; a failing health check rolls back |
| Replica count | 1 |
| IP on a fresh audit-log row | The client's address, not a Cloudflare one |
| One nightly dump restored into stage | Restores, and the ETL validation steps pass against it |
| A forced error, one hour and one container restart later | Retrievable in Grafana |
| Import requests past the configured rate | Rejected at the edge, no extraction call billed |
| TLS chain on the proxied hostname | Terminates at the installed origin certificate |
