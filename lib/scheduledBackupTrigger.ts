// lib/scheduledBackupTrigger.ts — calls the backup-email endpoint on a daily
// schedule. The endpoint itself decides whether there's anything to send; this
// helper only fires the authenticated HTTP request.
export async function triggerBackupEmailCheck() {
  const baseUrl =
    process.env.URL ??
    process.env.APP_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  const response = await fetch(`${baseUrl}/api/send-backup-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CRON_AUTH_TOKEN}`,
      // Marks this as the scheduled call so the endpoint gates on activity.
      "x-scheduled-trigger": "true",
    },
  });

  const result = await response.json();
  console.log("[scheduled-backup-check]", result.message ?? result);
}
