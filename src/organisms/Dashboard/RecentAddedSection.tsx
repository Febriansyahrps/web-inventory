"use client";

import {
  useDashboardStore,
  type DashboardRecentProduct,
} from "@/store/useDashboardStore";
import { ExportOutlined } from "@ant-design/icons";
import { Button, Card, Table } from "antd";
import type { TableColumnsType } from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

const RecentAddedSection = () => {
  const router = useRouter();
  const recent = useDashboardStore((state) => state.recent);
  const loading = useDashboardStore((state) => state.loading);

  const columns: TableColumnsType<DashboardRecentProduct> = [
    {
      title: "Tanggal",
      dataIndex: "created_at",
      key: "created_at",
      render: (value: string) => dayjs(value).format("DD-MM-YYYY"),
    },
    {
      title: "Nama Barang",
      dataIndex: "nama_barang",
      key: "nama_barang",
    },
    {
      title: "Kategori",
      dataIndex: "kategori_barang",
      key: "kategori_barang",
      render: (value: { id: number; name: string } | null) =>
        value?.name ?? "-",
      className: "max-[991px]:hidden!",
    },
    {
      title: "Jumlah",
      dataIndex: "jumlah_barang",
      key: "jumlah_barang",
      className: "max-[991px]:hidden!",
    },
  ];

  return (
    <Card className="p-4 w-full h-full">
      <div className="flex items-center justify-between">
        <h3 className="">Barang Baru Ditambahkan</h3>
        <Link href={"/barang"} className="max-[991px]:hidden!">
          <Button icon={<ExportOutlined />}>Lihat Semua Barang</Button>
        </Link>
      </div>
      <Table
        className="mt-4"
        rowKey="id"
        size="small"
        dataSource={recent}
        columns={columns}
        loading={loading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => router.push(`/barang/${record.id}`),
          style: { cursor: "pointer" },
        })}
      />
      <Link href={"/barang"} className="min-[991px]:hidden! ">
        <Button
          className="mt-4"
          icon={<ExportOutlined />}
          style={{ width: "100%" }}
        >
          Lihat Semua Barang
        </Button>
      </Link>
    </Card>
  );
};

export default RecentAddedSection;
