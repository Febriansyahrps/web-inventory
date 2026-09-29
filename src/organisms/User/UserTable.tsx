"use client";

import DeleteAccountModal from "@/src/molecules/DeleteAccountModal";
import { useUserStore, User } from "@/store/useUserStore";
import { DeleteOutlined, FormOutlined } from "@ant-design/icons";
import { Button, Card, Table, TableColumnsType, TableProps } from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCookie } from "@/src/utils/useCookie";
import { useScreenDefine } from "@/src/utils/screenDefine";
import React, { useCallback, useEffect, useState } from "react";

type userRow = {
  key: number;
  created_at: string;
  username: string;
  fullname: string;
  role: string;
  action: User;
};

// API sortable columns (see /api/user SORT_COLUMNS)
const sortField: Record<string, string> = {
  created_at: "created_at",
  username: "username",
  fullname: "fullname",
  role: "role",
};

const UserTable = () => {
  const getParam = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const users = useUserStore((state) => state.users);
  const totalUser = useUserStore((state) => state.totalUser);
  const limit = useUserStore((state) => state.limit);
  const page = useUserStore((state) => state.page);
  const loading = useUserStore((state) => state.loading);
  const error = useUserStore((state) => state.error);

  const isBelowMd = useScreenDefine(767);
  const [deleting, setDeleting] = useState<User | null>(null);

  const role = useCookie("role");
  // Signed-in user's id (set at login) — used to hide deleting your own account.
  const currentUserId = Number(useCookie("user-id"));

  // Build the API query from the current URL params. Used both by the sync
  // effect below and to refetch after a delete (which doesn't change the URL).
  const buildQuery = useCallback(() => {
    return {
      page: Number(getParam.get("page")) || 1,
      limit: Number(getParam.get("limit")) || 20,
      role: Number(getParam.get("role")) || undefined,
      search: getParam.get("search") || undefined,
      sort: getParam.get("sort") || undefined,
    };
  }, [getParam]);

  // Sync URL params (?page / ?limit / ?sort / filter) to the API. Re-runs
  // whenever the search params change, so table pagination/sort/filter
  // triggers a refetch.
  useEffect(() => {
    fetchUsers(buildQuery());
  }, [fetchUsers, buildQuery]);

  // After a delete the current page may no longer exist (it held the only
  // remaining row), so step back until a page with data is found and sync the
  // URL so the pagination control matches.
  const refetchAfterDelete = async () => {
    const query = buildQuery();
    const originalPage = query.page ?? 1;
    let target = originalPage;

    await fetchUsers({ ...query, page: target });
    while (target > 1 && useUserStore.getState().users.length === 0) {
      target -= 1;
      await fetchUsers({ ...query, page: target });
    }

    if (target !== originalPage) {
      const params = new URLSearchParams(Array.from(getParam.entries()));
      params.set("page", String(target));
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const userData: userRow[] = users.map((state) => ({
    key: state.id,
    created_at: state.createdAt,
    username: state.username,
    fullname: state.fullname,
    role: state.role?.name ?? "-",
    action: state,
  }));

  const columnsData: TableColumnsType<userRow> = [
    {
      title: "Tanggal",
      dataIndex: "created_at",
      key: "created_at",
      sorter: true,
      responsive: ["md"],
      width: 120,
      render: (value: string) => dayjs(value).format("DD-MM-YYYY"),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: true,
      width: 180,
      fixed: isBelowMd ? undefined : "start",
    },
    {
      title: "Nama Lengkap",
      dataIndex: "fullname",
      key: "fullname",
      sorter: true,
      width: 220,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      sorter: true,
      responsive: ["md"],
      width: 140,
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
          <Link href={`/akun/${record.key}`}>
            <Button type="text" icon={<FormOutlined />}></Button>
          </Link>
          {role === "1" && record.key !== currentUserId && (
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

  const handleTableChange: TableProps<userRow>["onChange"] = (
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
    <>
      <Card classNames={{ body: "max-[575px]:p-2!" }}>
        <Table
          rowKey="key"
          dataSource={userData}
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
            total: totalUser,
            pageSize: limit,
            current: page,
          }}
          loading={loading}
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: () => router.push(`/akun/${record.key}`),
            style: { cursor: "pointer" },
          })}
        />
        {error && <div style={{ marginTop: 8 }}>{error}</div>}
      </Card>

      <DeleteAccountModal
        open={deleting !== null}
        account={deleting ? { id: deleting.id, name: deleting.username } : null}
        onClose={() => setDeleting(null)}
        onDeleted={refetchAfterDelete}
      />
    </>
  );
};

export default UserTable;
