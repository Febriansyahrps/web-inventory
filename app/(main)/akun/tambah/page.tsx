"use client";

import Breadcrumbs from "@/src/molecules/Breadcrumbs";
import UserForm from "@/src/organisms/User/UserForm";
import Link from "next/link";

export default function AddProductPage() {
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
          { title: "Tambah Akun" },
        ]}
      />
      <UserForm isAddUser={true} />
    </main>
  );
}
