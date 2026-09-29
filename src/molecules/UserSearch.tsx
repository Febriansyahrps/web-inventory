import Search from "antd/es/input/Search";
import React, { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useScreenDefine } from "@/src/utils/screenDefine";

const searchStyles = {
  root: {
    display: "flex",
    alignItems: "center",
    width: "350px",
  },
  input: {
    fontSize: 14,
    paddingInline: 8,
    paddingBlock: 4,
  },
  button: {
    root: {
      paddingInline: 16,
      paddingBlock: 19,
    },
  },
};

const UserSearchInput = ({ styles }: { styles: typeof searchStyles }) => {
  const router = useRouter();
  const pathname = usePathname();
  const getParam = useSearchParams();
  const searchParam = getParam.get("search") ?? "";
  const [value, setValue] = useState(searchParam);
  const [syncedParam, setSyncedParam] = useState(searchParam);

  // Adjust state during render (no effect) when the URL changes underneath,
  // so clearing the filter elsewhere empties this input.
  if (searchParam !== syncedParam) {
    setSyncedParam(searchParam);
    setValue(searchParam);
  }

  // Write the term into the URL, keeping the other filters and resetting
  // pagination; an empty term clears the search filter.
  const applySearch = (keyword: string) => {
    const currentParam = new URLSearchParams(Array.from(getParam.entries()));
    const trimmed = keyword.trim();

    if (trimmed) currentParam.set("search", trimmed);
    else currentParam.delete("search");
    currentParam.delete("page");

    const query = currentParam.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <Search
      placeholder="Pencarian Akun"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onSearch={applySearch}
      enterButton
      allowClear
      onClear={() => applySearch("")}
      styles={styles}
    />
  );
};

const UserSearch = () => {
  const isMobile = useScreenDefine(650);

  const styles = {
    ...searchStyles,
    root: {
      ...searchStyles.root,
      width: isMobile ? "100%" : searchStyles.root.width,
    },
  };

  return (
    <Suspense
      fallback={<Search placeholder="Pencarian Akun" styles={styles} />}
    >
      <UserSearchInput styles={styles} />
    </Suspense>
  );
};

export default UserSearch;
