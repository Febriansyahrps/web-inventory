export async function register() {
  // Netlify and Vercel run this inside short-lived serverless processes, where a
  // long-running node-cron schedule does not survive; both platforms drive the
  // scheduled backup with their own scheduler instead.
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    !process.env.NETLIFY &&
    !process.env.VERCEL
  ) {
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
