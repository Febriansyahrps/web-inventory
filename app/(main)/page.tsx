import Dashboard from "@/src/organisms/Dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function HomePage() {
  return (
    <main>
      <h1 className="font-semibold text-2xl">
        SISTEM INFORMASI PENCATATAN INVENTARIS
      </h1>
      <p className="mt-1 text-[16px]!">SMK TAMANSISWA BANJARNEGARA</p>
      <Dashboard />
    </main>
  );
}
