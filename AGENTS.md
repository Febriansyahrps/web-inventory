# AGENTS.md — Scheduled Backup Email Trigger (instrumentation.ts + node-cron)

## Context

Adds a scheduled job that automatically triggers `POST /api/send-backup-email` once a day, but **only if there was any `barang`-related activity in the preceding 24 hours** — avoiding unnecessary emails on days with no inventory changes.

**Trigger time: 3:00 PM (test schedule)** — adjust later for production if needed.

## Scope Decisions

| Decision                       | Choice                                                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How the job calls the endpoint | **Real HTTP request** to `/api/send-backup-email`, authenticated with a **system/service JWT** — not a direct in-process function call. Keeps the scheduled trigger consistent with "only trigger the api," and doesn't require bypassing the existing auth check.        |
| System token                   | A long-lived JWT minted once for this internal purpose, stored as`CRON_AUTH_TOKEN` in `.env`. Generated using the **existing, frozen** JWT signing logic in `lib/auth.ts` — no changes to that file, just a token issued with a longer expiry for this specific use case. |
| Activity window                | Rolling 24 hours ending at the moment the cron job fires (e.g. if it fires at 3:00 PM, checks`activity_log` rows with `entity: "BARANG"` and `created_at` between 3:00 PM yesterday and 3:00 PM today).                                                                   |
| Where the check happens        | **Inside `/api/send-backup-email` itself** — the endpoint checks activity before generating/sending anything. The cron job's only job is to call the endpoint; it does not pre-check activity itself.                                                                     |
| No activity in window          | Endpoint skips sending entirely —**no email sent, and no activity log entry created** for the skipped check.                                                                                                                                                              |
| Has activity in window         | Endpoint proceeds exactly as already built (generate ZIP, send via Resend, log the`DOWNLOAD` activity).                                                                                                                                                                   |

---

## Required Change to `/api/send-backup-email`

This endpoint (already built in the prior task) needs one addition: an activity check **before** generating/sending the backup.

```ts
const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

const recentBarangActivity = await prisma.activityLog.findFirst({
  where: {
    entity: "BARANG",
    createdAt: { gte: windowStart },
  },
});

if (!recentBarangActivity) {
  return NextResponse.json(
    {
      message:
        "No barang activity in the last 24 hours — backup email not sent.",
    },
    { status: 200 },
  );
}

// existing logic continues below: generate ZIP, send via Resend, log activity
```

- This check applies **every time** the endpoint is called (including manual admin calls, not just the scheduled trigger) — consistent behavior regardless of who/what calls it. Confirm this is acceptable; if manual admin-triggered sends should bypass this check (always send on demand), that would need a separate flag/param instead.

---

## Tasks for the Coding Agent

Execute in order. Each task should be its own commit.

### Task 1 — Install node-cron

```bash
npm install node-cron
npm install -D @types/node-cron
```

### Task 2 — Generate System Token

- Using the existing `lib/auth.ts` signing logic, mint a JWT for a designated admin user (or a dedicated system/service user if one should be created for this purpose — confirm with user which approach they prefer).
- Set a long expiry appropriate for a background service token (e.g. 1 year, or no expiry — confirm preference; this differs from the 1-day expiry used for normal user logins, so implement it as a separate signing call, not by changing the default expiry in `lib/auth.ts`).
- Store the resulting token in `.env` as `CRON_AUTH_TOKEN`.

### Task 3 — Add Activity Check to `/api/send-backup-email`

- Add the check shown above, before the existing ZIP-generation/send logic.
- No activity in the last 24h → return 200 with a "nothing to send" message, skip everything else, no log entry created.
- Activity found → proceed exactly as the endpoint already does.

### Task 4 — Create the Scheduled Job

- Create `lib/scheduledBackupTrigger.ts`:

```ts
export async function triggerBackupEmailCheck() {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/send-backup-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CRON_AUTH_TOKEN}`,
    },
  });

  const result = await response.json();
  console.log("[scheduled-backup-check]", result.message ?? result);
}
```

- Add `APP_BASE_URL` to `.env` (e.g. `http://localhost:3000` for local dev).

### Task 5 — Register the Cron Schedule

- Create/update `instrumentation.ts` at the project root:

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { triggerBackupEmailCheck } =
      await import("./lib/scheduledBackupTrigger");

    cron.schedule("0 15 * * *", async () => {
      await triggerBackupEmailCheck();
    });
  }
}
```

- `"0 15 * * *"` = 3:00 PM daily (test schedule, per current requirement).
- Confirm the installed Next.js version supports `instrumentation.ts` (stable in recent versions) before proceeding — flag to the user if unsupported rather than working around it silently.

### Task 6 — Verify

- With no `barang` activity in the last 24h, manually trigger `triggerBackupEmailCheck()` (or wait for the 3 PM schedule) → confirm the endpoint returns the "nothing to send" message, no email arrives, and no new `activity_log` row is created.
- Perform a `barang` action (add/update/delete) → trigger again → confirm the backup email is sent and one `DOWNLOAD` activity log entry is created.
- Confirm the scheduled job fires automatically at 3:00 PM without manual intervention (test schedule).
- Confirm the `CRON_AUTH_TOKEN` correctly authenticates as Admin (the endpoint doesn't reject it as invalid/expired).

**Done when:** the cron job fires daily at the scheduled time, correctly skips sending when there's no `barang` activity in the prior 24 hours, sends and logs correctly when there is, and requires no manual server restarts or external schedulers beyond `npm start` running continuously.

---

## Open Items

1. Should the "no activity in 24h → skip silently" behavior also apply when an **admin manually** calls `/api/send-backup-email` (not just the scheduled trigger), or should manual calls always force-send regardless of activity? Current spec applies the check universally — confirm this is intended.
2. System token: sign it as the existing seeded `admin` user, or create a dedicated service/system user account for clearer separation between human admin actions and automated ones in the activity log?
3. Confirm token expiry duration for `CRON_AUTH_TOKEN` (e.g. 1 year vs. no expiry).

---

## Notes

- `lib/auth.ts` (JWT verification/signing) must not be modified — only reused with a different expiry value for the system token.
- Manual testing (Postman, etc.) will be done by the user directly.
