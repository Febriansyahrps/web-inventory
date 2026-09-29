import ProductFilter from "@/src/organisms/Product/ProductFilter";
import ProductKPISection from "@/src/organisms/Product/ProductKPISection";
import ProductTable from "@/src/organisms/Product/ProductTable";
import ProductReportSection from "@/src/organisms/ProductReportSection";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Daftar Barang",
};

export default function ProductPage() {
  return (
    <main>
      <Suspense>
        <ProductFilter />
        <div className="min-[860px]:hidden flex max-[575px]:flex-col-reverse! gap-4 max-[575px]:gap-3 pt-4 justify-end">
          <ProductReportSection />
        </div>
        <ProductKPISection />
        <ProductTable />
      </Suspense>
    </main>
  );
}
