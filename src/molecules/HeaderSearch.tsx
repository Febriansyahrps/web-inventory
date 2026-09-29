import Search from "antd/es/input/Search";
import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const HeaderSearchInput = ({ styles }: { styles: typeof searchStyles }) => {
  const router = useRouter();
  const searchParam = useSearchParams().get("search") ?? "";
  const [value, setValue] = useState(searchParam);
  const [syncedParam, setSyncedParam] = useState(searchParam);

  // Adjust state during render (no effect) when the URL changes underneath,
  // so clearing the filter elsewhere empties this input.
  if (searchParam !== syncedParam) {
    setSyncedParam(searchParam);
    setValue(searchParam);
  }

  const onSearchHandler = (keyword: string) => {
    const trimmed = keyword.trim();
    // Nothing to search — clear the filter instead of pushing an empty query.
    if (!trimmed) {
      if (searchParam) router.replace("/barang");
      return;
    }
    router.push("/barang?search=" + trimmed);
  };

  const onclearHandler = () => {
    router.replace("/barang");
  };

  return (
    <Search
      placeholder="Pencarian Barang"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onSearch={onSearchHandler}
      enterButton
      allowClear
      onClear={onclearHandler}
      styles={styles}
    />
  );
};

const HeaderSearch = () => {
  const isMobile = useScreenDefine(575);

  const styles = {
    ...searchStyles,
    root: {
      ...searchStyles.root,
      width: isMobile ? "100%" : searchStyles.root.width,
    },
  };

  return (
    <Suspense
      fallback={<Search placeholder="Pencarian Barang" styles={styles} />}
    >
      <HeaderSearchInput styles={styles} />
    </Suspense>
  );
};

export default HeaderSearch;
