# Cloud Scheduler Setup — Proactive Telegram Notifications

This document contains the exact `gcloud` commands to configure the Cloud Scheduler jobs
that trigger daily reminders and weekly summaries for the Solar ERP backend.

---

## Prerequisites

1. **gcloud CLI installed and authenticated**

   ```bash
   gcloud auth login
   ```

2. **Active project set**

   ```bash
   gcloud config set project project-2c115a8a-65f0-4214-8e9
   ```

3. **Cloud Scheduler API enabled**

   ```bash
   gcloud services enable cloudscheduler.googleapis.com
   ```

4. **The backend is deployed to Cloud Run** (`solar-erp-backend`, region `southamerica-east1`).

---

## Step 1 — Get the backend URL

```bash
gcloud run services describe solar-erp-backend \
  --region=southamerica-east1 \
  --project=project-2c115a8a-65f0-4214-8e9 \
  --format='value(status.url)'
```

Copy the output. You will use it as `{BACKEND_URL}` in the commands below.

---

## Step 2 — Set INTERNAL_API_SECRET on Cloud Run

Choose a strong random secret (e.g. `openssl rand -hex 32`) and set it as an environment
variable on the Cloud Run service. This value must match the one used by the scheduler jobs.

```bash
gcloud run services update solar-erp-backend \
  --region=southamerica-east1 \
  --project=project-2c115a8a-65f0-4214-8e9 \
  --update-env-vars "INTERNAL_API_SECRET={A_RANDOM_SECRET}"
```

> Replace `{A_RANDOM_SECRET}` with your generated secret. Keep it safe — it protects the
> internal endpoints from unauthorized calls.

---

## Step 3 — Create the daily reminders job (T5.1)

Runs every day at **08:00 Argentina time** (11:00 UTC).

```bash
gcloud scheduler jobs create http solar-erp-daily-reminders \
  --location=southamerica-east1 \
  --schedule="0 11 * * *" \
  --time-zone="America/Argentina/Buenos_Aires" \
  --uri="{BACKEND_URL}/api/v1/internal/send-reminders" \
  --http-method=POST \
  --headers="X-Internal-Secret={INTERNAL_API_SECRET},Content-Type=application/json" \
  --message-body="{}" \
  --project=project-2c115a8a-65f0-4214-8e9
```

> Replace `{BACKEND_URL}` with the URL from Step 1, and `{INTERNAL_API_SECRET}` with the
> secret from Step 2.

---

## Step 4 — Create the weekly summary job (T5.2)

Runs every **Monday at 08:00 Argentina time** (Monday 11:00 UTC).

```bash
gcloud scheduler jobs create http solar-erp-weekly-summary \
  --location=southamerica-east1 \
  --schedule="0 11 * * 1" \
  --time-zone="America/Argentina/Buenos_Aires" \
  --uri="{BACKEND_URL}/api/v1/internal/send-weekly-summary" \
  --http-method=POST \
  --headers="X-Internal-Secret={INTERNAL_API_SECRET},Content-Type=application/json" \
  --message-body="{}" \
  --project=project-2c115a8a-65f0-4214-8e9
```

---

## Step 5 — Verify IAM permissions (T5.3)

Cloud Scheduler needs permission to invoke the Cloud Run service. If the service is
**publicly accessible** (allUsers has `roles/run.invoker`), no extra IAM setup is needed.

If the service is **private**, grant the Cloud Scheduler service account permission to
invoke it:

```bash
# Get the Cloud Scheduler service account for the project
PROJECT_NUMBER=$(gcloud projects describe project-2c115a8a-65f0-4214-8e9 --format='value(projectNumber)')
SCHEDULER_SA="service-${PROJECT_NUMBER}@gcp-sa-cloudscheduler.iam.gserviceaccount.com"

# Grant invoker role on the Cloud Run service
gcloud run services add-iam-policy-binding solar-erp-backend \
  --region=southamerica-east1 \
  --project=project-2c115a8a-65f0-4214-8e9 \
  --member="serviceAccount:${SCHEDULER_SA}" \
  --role="roles/run.invoker"
```

> Note: The `X-Internal-Secret` header in the job already acts as an application-level
> secret. The IAM binding is an additional infrastructure-level protection layer.

---

## Verify the jobs were created

```bash
gcloud scheduler jobs list \
  --location=southamerica-east1 \
  --project=project-2c115a8a-65f0-4214-8e9
```

You should see both `solar-erp-daily-reminders` and `solar-erp-weekly-summary` listed.

---

## Manually trigger a job (for testing)

```bash
# Trigger daily reminders
gcloud scheduler jobs run solar-erp-daily-reminders \
  --location=southamerica-east1 \
  --project=project-2c115a8a-65f0-4214-8e9

# Trigger weekly summary
gcloud scheduler jobs run solar-erp-weekly-summary \
  --location=southamerica-east1 \
  --project=project-2c115a8a-65f0-4214-8e9
```

After triggering, check the Cloud Run logs to confirm the endpoint was hit and messages
were sent:

```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=solar-erp-backend" \
  --project=project-2c115a8a-65f0-4214-8e9 \
  --limit=50 \
  --format="table(timestamp,textPayload)"
```

---

## Schedule Reference

| Job | Cron | Timezone | Local time |
|-----|------|----------|------------|
| `solar-erp-daily-reminders` | `0 11 * * *` | America/Argentina/Buenos_Aires | Every day at 08:00 ART |
| `solar-erp-weekly-summary` | `0 11 * * 1` | America/Argentina/Buenos_Aires | Every Monday at 08:00 ART |
