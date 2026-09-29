"use client";

import { useActivityLogStore } from "@/store/useActivityLogStore";
import { Card, Table, TableColumnsType, TableProps, Tag } from "antd";
import dayjs from "dayjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect } from "react";
import { useScreenDefine } from "@/src/utils/screenDefine";

type activityRow = {
  key: number;
  created_at: string;
  user: string;
  action: string;
  message: string;
};

// action code -> label + tag colour.
const ACTION_META: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Tambah", color: "green" },
  UPDATE: { label: "Ubah", color: "blue" },
  DELETE: { label: "Hapus", color: "red" },
  DOWNLOAD: { label: "Download", color: "purple" },
  EMAIL: { label: "Kirim", color: "geekblue" },
};

const ActivityLogTable = () => {
  const getParam = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fetchLogs = useActivityLogStore((state) => state.fetchLogs);
  const logs = useActivityLogStore((state) => state.logs);
  const totalLog = useActivityLogStore((state) => state.totalLog);
  const limit = useActivityLogStore((state) => state.limit);
  const page = useActivityLogStore((state) => state.page);
  const loading = useActivityLogStore((state) => state.loading);
  const error = useActivityLogStore((state) => state.error);

  const isBelowMd = useScreenDefine(767);

  // Build the API query from the current URL params (?page / ?limit).
  const buildQuery = useCallback(
    () => ({
      page: Number(getParam.get("page")) || 1,
      limit: Number(getParam.get("limit")) || 20,
    }),
    [getParam],
  );

  // Sync URL params to the API; pagination changes refetch via the URL.
  useEffect(() => {
    fetchLogs(buildQuery());
  }, [fetchLogs, buildQuery]);

  const logData: activityRow[] = logs.map((state) => ({
    key: state.id,
    created_at: state.created_at,
    user: state.user?.username ?? "Pengguna dihapus",
    action: state.action,
    message: state.message,
  }));

  const columnsData: TableColumnsType<activityRow> = [
    {
      title: "Tanggal",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (value: string) => dayjs(value).format("DD-MM-YYYY HH:mm:ss"),
    },
    {
      title: "Pengguna",
      dataIndex: "user",
      key: "user",
      responsive: ["md"],
      width: 160,
    },
    {
      title: "Aksi",
      dataIndex: "action",
      key: "action",
      responsive: ["md"],
      width: 130,
      render: (value: string) => {
        const meta = ACTION_META[value];
        return <Tag color={meta?.color}>{meta?.label ?? value}</Tag>;
      },
    },
    {
      title: "Keterangan",
      dataIndex: "message",
      key: "message",
      render: (value: string, record) =>
        isBelowMd ? `${record.user} ${record.message}` : value,
    },
  ];

  const handleTableChange: TableProps<activityRow>["onChange"] = (
    paginationConfig,
  ) => {
    const currentParam = new URLSearchParams(Array.from(getParam.entries()));

    if (paginationConfig?.current) {
      currentParam.set("page", paginationConfig.current.toString());
    }
    if (paginationConfig?.pageSize) {
      currentParam.set("limit", paginationConfig.pageSize.toString());
    }

    const newParam = currentParam.toString();
    const query = newParam ? `?${newParam}` : "";
    router.replace(`${pathname}${query}`);
  };

  return (
    <>
      <p className="mt-1">{totalLog} total aktivitas</p>
      <Card className="mt-4!" classNames={{ body: "max-[575px]:p-2!" }}>
        <Table
          rowKey="key"
          dataSource={logData}
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
            total: totalLog,
            pageSize: limit,
            current: page,
          }}
          loading={loading}
          onChange={handleTableChange}
        />
        {error && <div style={{ marginTop: 8 }}>{error}</div>}
      </Card>
    </>
  );
};

export default ActivityLogTable;
