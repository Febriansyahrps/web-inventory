"use client";

import Breadcrumbs from "@/src/molecules/Breadcrumbs";
import ProductForm from "@/src/organisms/Product/ProductForm";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProductDetailPage() {
  const { barangId } = useParams<{ barangId: string }>();

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
          { title: "Detail Barang" },
        ]}
      />
      <ProductForm isAddProduct={false} productId={Number(barangId)} />
    </main>
  );
}
