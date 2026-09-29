"use client";

import { useUserStore } from "@/store/useUserStore";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Select, Tag } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import UserSearch from "@/src/molecules/UserSearch";

// Role options (role ids: 1 = ADMIN, 2 = VIEWER)
const ROLE_OPTIONS = [
  { value: 1, label: "ADMIN" },
  { value: 2, label: "VIEWER" },
];

const UserFilter = () => {
  const totalUser = useUserStore((state) => state.totalUser);

  const getParam = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Role filter is a single id read from the URL (single source of truth).
  const roleVal = Number(getParam.get("role")) || undefined;
  const searchVal = getParam.get("search") ?? "";

  /** Merge params into the URL query, dropping empties, resetting to page 1. */
  const updateParams = (patch: Record<string, string | undefined>) => {
    const currentParam = new URLSearchParams(Array.from(getParam.entries()));

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") {
        currentParam.delete(key);
      } else {
        currentParam.set(key, value);
      }
    }

    // Changing filters resets to page 1
    currentParam.delete("page");

    const newParam = currentParam.toString();
    const query = newParam ? `?${newParam}` : "";
    router.replace(`${pathname}${query}`);
  };

  const roleName =
    ROLE_OPTIONS.find((r) => r.value === roleVal)?.label ?? String(roleVal);

  // One chip per active filter value, each removable from the URL.
  const activeFilterList = [
    ...(searchVal !== ""
      ? [
          {
            key: "search",
            label: `Cari: ${searchVal}`,
            onClose: () => updateParams({ search: undefined }),
          },
        ]
      : []),
    ...(roleVal !== undefined
      ? [
          {
            key: "role",
            label: `Role: ${roleName}`,
            onClose: () => updateParams({ role: undefined }),
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="mb-4 flex max-[650px]:flex-col! max-[650px]:items-start! justify-between gap-4 ">
        <div>
          <div className="mb-2 ">
            <h1 className="text-2xl font-semibold ">Daftar Akun</h1>
            <p className="mt-1">{totalUser} total akun</p>
          </div>
          {activeFilterList.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {activeFilterList.map((filter) => (
                <Tag
                  key={filter.key}
                  closable
                  onClose={(e) => {
                    e.preventDefault();
                    filter.onClose();
                  }}
                  classNames={{
                    root: "text-[14px]! flex! items-center gap-1 py-1! px-3! rounded!",
                    close: "text-[12px]!",
                  }}
                >
                  {filter.label}
                </Tag>
              ))}
            </div>
          )}
        </div>
        <div className="max-[650px]:w-full! max-[650px]:flex! max-[650px]:flex-col-reverse! max-[650px]:gap-3">
          <div className="flex max-[650px]:flex-col-reverse! max-[650px]:w-full! gap-4 max-[650px]:gap-3 items-center">
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Pilih role akun"
              options={ROLE_OPTIONS}
              value={roleVal}
              className="py-1.75! min-w-40! max-[650px]:w-full!"
              onChange={(value) =>
                updateParams({ role: value ? String(value) : undefined })
              }
            />
            <div className="hidden max-[650]:flex! w-full">
              <UserSearch />
            </div>
            <Link href={"/akun/tambah"} className="max-[650px]:w-full!">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="max-[650px]:w-full!"
              >
                Tambah Akun
              </Button>
            </Link>
          </div>
          <div className="flex justify-end pt-3 max-[650]:hidden!">
            <UserSearch />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserFilter;
