import UserFilter from "@/src/organisms/User/UserFilter";
import UserTable from "@/src/organisms/User/UserTable";
import UserForm from "@/src/organisms/User/UserForm";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Kelola Akun",
};

export default async function AccountPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;
  const userId = Number(cookieStore.get("user-id")?.value);

  // Non-admins only manage their own account; show the detail form directly.
  if (role !== "1") {
    return (
      <main>
        <UserForm isAddUser={false} userId={userId} />
      </main>
    );
  }

  return (
    <main>
      <Suspense>
        <UserFilter />
        <UserTable />
      </Suspense>
    </main>
  );
}
