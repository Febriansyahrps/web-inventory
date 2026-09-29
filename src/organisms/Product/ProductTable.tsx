"use client";

import DeleteProductModal from "@/src/molecules/DeleteProductModal";
import { useProductStore, Product } from "@/store/useProductStore";
import { DeleteOutlined, FormOutlined } from "@ant-design/icons";
import { Button, Card, Table, TableColumnsType, TableProps } from "antd";
import Cookies from "js-cookie";
import dayjs from "dayjs";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useScreenDefine } from "@/src/utils/screenDefine";

type productRow = {
  key: number;
  created_at: string;
  kode_barang: string;
  nama_barang: string;
  no_register: string;
  merk_barang: string | null;
  kategori_barang: string;
  lokasi_barang: string;
  asal_barang: string;
  keadaan_barang: string;
  satuan_barang: string;
  tahun_perolehan: number | null;
  jumlah_barang: number;
  harga_barang: number;
  action: Product;
};

// API sortable columns (see /api/product SORT_COLUMNS)
const sortField: Record<string, string> = {
  created_at: "created_at",
  kode_barang: "kode_barang",
  nama_barang: "nama_barang",
  no_register: "no_register",
  merk_barang: "merk_barang",
  kategori_barang: "kategori_barang",
  lokasi_barang: "lokasi_barang",
  asal_barang: "asal_barang",
  keadaan_barang: "keadaan_barang",
  satuan_barang: "satuan_barang",
  tahun_perolehan: "tahun_perolehan",
  jumlah_barang: "jumlah_barang",
  harga_barang: "harga_barang",
};

const ProductTable = () => {
  const getParam = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fetchProducts = useProductStore((state) => state.fetchProducts);
  const products = useProductStore((state) => state.products);
  const totalProduct = useProductStore((state) => state.totalProduct);
  const limit = useProductStore((state) => state.limit);
  const page = useProductStore((state) => state.page);
  const loading = useProductStore((state) => state.loading);
  const error = useProductStore((state) => state.error);

  const isBelowMd = useScreenDefine(767);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const role = Cookies.get("role");

  // Build the API query from the current URL params. Used both by the sync
  // effect below and to refetch after a delete (which doesn't change the URL).
  const buildQuery = useCallback(() => {
    const csv = (key: string) =>
      (getParam.get(key) || "")
        .split(",")
        .map(Number)
        .filter((n) => n > 0);

    return {
      page: Number(getParam.get("page")) || 1,
      limit: Number(getParam.get("limit")) || 20,
      search: getParam.get("search") || undefined,
      sort: getParam.get("sort") || undefined,
      kategori: csv("kategori"),
      lokasi: csv("lokasi"),
      asal_barang: csv("asal_barang"),
      keadaan: csv("keadaan"),
      satuan: csv("satuan"),
      low_price: Number(getParam.get("low_price")) || undefined,
      high_price: Number(getParam.get("high_price")) || undefined,
      range_date: getParam.get("range_date") || undefined,
      start_date: getParam.get("start_date") || undefined,
      end_date: getParam.get("end_date") || undefined,
    };
  }, [getParam]);

  // Sync URL params (?page / ?limit / ?sort / filters) to the API. Re-runs
  // whenever the search params change, so table pagination/sort/filter
  // triggers a refetch.
  useEffect(() => {
    fetchProducts(buildQuery());
  }, [fetchProducts, buildQuery]);

  // After a delete the current page may no longer exist (it held the only
  // remaining row), so step back until a page with data is found and sync the
  // URL so the pagination control matches.
  const refetchAfterDelete = async () => {
    const query = buildQuery();
    const originalPage = query.page ?? 1;
    let target = originalPage;

    await fetchProducts({ ...query, page: target });
    while (target > 1 && useProductStore.getState().products.length === 0) {
      target -= 1;
      await fetchProducts({ ...query, page: target });
    }

    if (target !== originalPage) {
      const params = new URLSearchParams(Array.from(getParam.entries()));
      params.set("page", String(target));
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const productData: productRow[] = products.map((state) => ({
    key: state.id,
    created_at: state.created_at,
    kode_barang: state.kode_barang,
    nama_barang: state.nama_barang,
    no_register: state.no_register,
    merk_barang: state.merk_barang,
    kategori_barang: state.kategori_barang?.name ?? "-",
    lokasi_barang: state.lokasi_barang?.name ?? "-",
    asal_barang: state.asal_barang?.name ?? "-",
    keadaan_barang: state.keadaan_barang?.name ?? "-",
    satuan_barang: state.satuan_barang?.name ?? "-",
    tahun_perolehan: state.tahun_perolehan,
    jumlah_barang: state.jumlah_barang,
    harga_barang: state.harga_barang,
    action: state,
  }));

  const columnsData: TableColumnsType<productRow> = [
    {
      title: "Tanggal",
      dataIndex: "created_at",
      key: "created_at",
      sorter: true,
      width: 120,
      render: (value: string) => dayjs(value).format("DD-MM-YYYY"),
    },
    {
      title: "Nama Barang",
      dataIndex: "nama_barang",
      key: "nama_barang",
      sorter: true,
      width: 180,
      fixed: isBelowMd ? undefined : "start",
    },
    {
      title: "Kode Barang",
      dataIndex: "kode_barang",
      key: "kode_barang",
      sorter: true,
      responsive: ["md"],
      width: 140,
    },
    {
      title: "No. Register",
      dataIndex: "no_register",
      key: "no_register",
      sorter: true,
      responsive: ["md"],
      width: 140,
    },
    {
      title: "Merk",
      dataIndex: "merk_barang",
      key: "merk_barang",
      sorter: true,
      responsive: ["md"],
      width: 120,
      render: (value: string | null) => value ?? "-",
    },
    {
      title: "Kategori",
      dataIndex: "kategori_barang",
      key: "kategori_barang",
      width: 140,
      sorter: true,
      responsive: ["md"],
    },
    {
      title: "Asal",
      dataIndex: "asal_barang",
      key: "asal_barang",
      width: 130,
      sorter: true,
      responsive: ["md"],
    },
    {
      title: "Keadaan",
      dataIndex: "keadaan_barang",
      key: "keadaan_barang",
      width: 130,
      sorter: true,
      responsive: ["md"],
    },
    {
      title: "Satuan",
      dataIndex: "satuan_barang",
      key: "satuan_barang",
      width: 100,
      sorter: true,
      responsive: ["md"],
    },
    {
      title: "Lokasi",
      dataIndex: "lokasi_barang",
      key: "lokasi_barang",
      width: 140,
      sorter: true,
      responsive: ["md"],
    },
    {
      title: "Tahun",
      dataIndex: "tahun_perolehan",
      key: "tahun_perolehan",
      sorter: true,
      responsive: ["md"],
      width: 100,
      render: (value: number | null) => value ?? "-",
    },
    {
      title: "Jumlah",
      dataIndex: "jumlah_barang",
      key: "jumlah_barang",
      sorter: true,
      responsive: ["md"],
      width: 100,
    },
    {
      title: "Harga",
      dataIndex: "harga_barang",
      key: "harga_barang",
      sorter: true,
      responsive: ["md"],
      width: 150,
      render: (value: number) => `Rp ${value.toLocaleString("id-ID")}`,
    },
    {
      title: "Aksi",
      dataIndex: "action",
      key: "action",
      width: 100,
      fixed: isBelowMd ? undefined : "end",
      onCell: () => ({
        onClick: (event) => event.stopPropagation(),
        style: { cursor: "default" },
      }),
      render: (value, record) => (
        <div className="flex gap-2 items-center">
          <Link href={`/barang/${record.key}`}>
            <Button type="text" icon={<FormOutlined />}></Button>
          </Link>
          {role === "1" && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeleting(record.action)}
            ></Button>
          )}
        </div>
      ),
    },
  ];

  const handleTableChange: TableProps<productRow>["onChange"] = (
    paginationConfig,
    _filters,
    sorter,
  ) => {
    const currentParam = new URLSearchParams(Array.from(getParam.entries()));

    // --- pagination ---
    if (paginationConfig?.current) {
      currentParam.set("page", paginationConfig.current.toString());
    }
    if (paginationConfig?.pageSize) {
      currentParam.set("limit", paginationConfig.pageSize.toString());
    }

    // --- sorting ---
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    if (!singleSorter || !singleSorter.order) {
      currentParam.delete("sort");
    } else {
      const columnKey = singleSorter.columnKey ?? singleSorter.field;
      const apiField = sortField[columnKey as string] ?? columnKey;
      const direction = singleSorter.order === "ascend" ? "asc" : "desc";
      currentParam.set("sort", `${apiField}_${direction}`);
    }

    const newParam = currentParam.toString();
    const query = newParam ? `?${newParam}` : "";
    router.replace(`${pathname}${query}`);
  };

  return (
    <div className="mt-4">
      <Card classNames={{ body: "max-[575px]:p-2!" }}>
        <Table
          rowKey="key"
          dataSource={productData}
          columns={columnsData}
          scroll={{ x: "max-content" }}
          styles={{
            body: {
              cell: {
                borderTop: "2px solid #FAF9FA",
                borderBottom: "2px solid #FAF9FA",
                paddingBlock: 8,
              },
            },
            footer: {
              borderTop: "2px solid #FAF9FA",
            },
          }}
          pagination={{
            total: totalProduct,
            pageSize: limit,
            current: page,
          }}
          loading={loading}
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: () => router.push(`/barang/${record.key}`),
            style: { cursor: "pointer" },
          })}
        />
        {error && <div style={{ marginTop: 8 }}>{error}</div>}
      </Card>

      <DeleteProductModal
        open={deleting !== null}
        product={
          deleting ? { id: deleting.id, name: deleting.nama_barang } : null
        }
        onClose={() => setDeleting(null)}
        onDeleted={refetchAfterDelete}
      />
    </div>
  );
};

export default ProductTable;
