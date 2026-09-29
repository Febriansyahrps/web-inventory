export async function register() {
  // Vercel runs this inside short-lived serverless processes, where a
  // long-running node-cron schedule does not survive; Vercel drives the
  // scheduled backup with its own cron instead.
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.VERCEL) {
    const cron = await import("node-cron");
    const { triggerBackupEmailCheck } =
      await import("./lib/scheduledBackupTrigger");

    // 01:00 WIB (Asia/Jakarta) daily.
    cron.schedule(
      "0 1 * * *",
      async () => {
        await triggerBackupEmailCheck();
      },
      { timezone: "Asia/Jakarta" },
    );
  }
}
