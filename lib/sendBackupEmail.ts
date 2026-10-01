// lib/sendBackupEmail.ts — emails the current backup ZIP via Resend.
// Kept as callable logic (not just an HTTP route) so a future scheduled job can
// trigger the same send internally without going through the API layer or
// needing a user token.
import { Resend } from "resend";
import { generateBackupZip } from "@/lib/exportBackup";
import { logActivity } from "@/lib/activityLog";

// Falls back to Resend's shared test sender until a custom domain is verified.
const FROM_ADDRESS = "onboarding@resend.dev";

export interface SendBackupEmailResult {
  sent_to: string;
  sent_at: string;
  resend_message_id: string;
  filename: string;
}

export async function sendBackupEmail(
  userId: number | null,
): Promise<SendBackupEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const recipient = process.env.BACKUP_RECIPIENT_EMAIL;
  if (!recipient) throw new Error("BACKUP_RECIPIENT_EMAIL is not set");

  const resend = new Resend(apiKey);
  const { buffer, filename } = await generateBackupZip();
  const sentAt = new Date().toISOString();

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: recipient,
    subject: `Data Backup Inventaris SMK Tamansiswa Banjarnegara — ${sentAt.slice(0, 10)}`,
    text: "Sistem telah berhasil melakukan pencadangan data inventaris terbaru. Silakan unduh berkas ZIP (file CSV) terlampir untuk kebutuhan arsip Anda.",
    attachments: [{ filename, content: buffer.toString("base64") }],
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Gagal mengirim email backup");
  }

  // Only logged once Resend has confirmed the send.
  await logActivity({
    userId,
    action: "EMAIL",
    entity: "BACKUP",
    entityId: null,
    label: `ke email ${recipient}`,
  });

  return {
    sent_to: recipient,
    sent_at: sentAt,
    resend_message_id: data.id,
    filename,
  };
}
