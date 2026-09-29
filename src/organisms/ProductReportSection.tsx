"use client";

import { Button } from "antd";
import React, { useState } from "react";
import { useCookie } from "../utils/useCookie";
import {
  PlusOutlined,
  PrinterOutlined,
  ProductOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import ReportModal from "../molecules/ReportModal";

const ProductReportSection = ({ isDashboard }: { isDashboard?: boolean }) => {
  // Read auth cookies hydration-safely (server snapshot is undefined).
  const role = useCookie("role");
  const [reportModal, setReportModal] = useState(false);

  return (
    <>
      <Button
        icon={<PrinterOutlined />}
        onClick={() => setReportModal(!reportModal)}
        className="max-[575px]:w-full!"
      >
        Buat Laporan
      </Button>
      {role === "1" && isDashboard && (
        <Link
          href={"/barang"}
          className="hidden max-[575px]:w-full! max-[575px]:block! "
        >
          <Button icon={<ProductOutlined />} className="max-[575px]:w-full!">
            Lihat Barang
          </Button>
        </Link>
      )}
      {role === "1" && (
        <Link href={"/barang/tambah"} className="max-[575px]:w-full!">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="max-[575px]:w-full!"
          >
            Tambah Barang
          </Button>
        </Link>
      )}
      <ReportModal reportModal={reportModal} setReportModal={setReportModal} />
    </>
  );
};

export default ProductReportSection;
