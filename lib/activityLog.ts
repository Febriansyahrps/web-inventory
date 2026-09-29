// lib/activityLog.ts — shared writer for the activity_log audit trail.
// Every write/download endpoint goes through this one function so the stored
// shape stays consistent.
import { prisma } from "@/lib/prisma";

export async function logActivity({
  userId,
  action,
  entity,
  entityId,
  label,
}: {
  userId: number | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "DOWNLOAD" | "EMAIL";
  entity: "BARANG" | "USER" | "BACKUP";
  entityId: number | null;
  label: string;
}) {
  await prisma.activityLog.create({
    data: { idUser: userId, action, entity, entityId, label },
  });
}
