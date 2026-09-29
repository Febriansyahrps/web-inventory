import UserFilter from "@/src/organisms/User/UserFilter";
import UserTable from "@/src/organisms/User/UserTable";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Kelola Akun",
};

export default function AccountPage() {
  return (
    <main>
      <Suspense>
        <UserFilter />
        <UserTable />
      </Suspense>
    </main>
  );
}
