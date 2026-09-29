import ActivityLogTable from "@/src/organisms/ActivityLog/ActivityLogTable";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Riwayat Aktivitas",
};

export default function HistoryPage() {
  return (
    <main>
      <h1 className="font-semibold text-2xl">Riwayat Aktivitas</h1>
      <Suspense>
        <ActivityLogTable />
      </Suspense>
    </main>
  );
}
