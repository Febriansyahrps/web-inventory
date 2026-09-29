import Backup from "@/src/organisms/Backup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backup Data",
};

export default function BackupPage() {
  return (
    <main>
      <h1 className="font-semibold text-2xl">Backup Data</h1>
      <Backup />
    </main>
  );
}
