"use client";

import Breadcrumbs from "@/src/molecules/Breadcrumbs";
import ProductForm from "@/src/organisms/Product/ProductForm";
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
            title: <Link href={"/barang"}>Barang</Link>,
          },
          { title: "Tambah Barang" },
        ]}
      />
      <ProductForm isAddProduct={true} />
    </main>
  );
}
