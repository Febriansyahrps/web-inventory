"use client";

import Breadcrumbs from "@/src/molecules/Breadcrumbs";
import UserForm from "@/src/organisms/User/UserForm";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EditAccountPage() {
  const { akunId } = useParams<{ akunId: string }>();

  return (
    <main>
      <Breadcrumbs
        items={[
          {
            title: <Link href={"/"}>Dashboard</Link>,
          },
          {
            title: <Link href={"/akun"}>Kelola Akun</Link>,
          },
          { title: "Detail Akun" },
        ]}
      />
      <UserForm isAddUser={false} userId={Number(akunId)} />
    </main>
  );
}
