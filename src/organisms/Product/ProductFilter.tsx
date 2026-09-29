"use client";

import { useAsalStore } from "@/store/useAsalStore";
import { useKategoryStore } from "@/store/useKategoryStore";
import { useLokasiStore } from "@/store/useLokasiStore";
import { useKeadaanStore } from "@/store/UseKeadaanStore";
import { useSatuanStore } from "@/store/useSatuanStore";
import ProductFilterDrawer from "@/src/molecules/ProductFilterDrawer";
import { normalizePrice } from "@/src/utils/number";
import { FilterOutlined } from "@ant-design/icons";
import { Badge, Button, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

/** Parse a comma-separated id list from the URL. */
const csv = (value: string | null): number[] =>
  (value || "")
    .split(",")
    .map(Number)
    .filter((n) => n > 0);

const ProductFilter = () => {
  const getParam = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [drawer, setDrawer] = useState(false);

  // Lookup options are read once from the URL on each render (single source of truth).
  const kategoriVal = csv(getParam.get("kategori"));
  const lokasiVal = csv(getParam.get("lokasi"));
  const asalVal = csv(getParam.get("asal_barang"));
  const keadaanVal = csv(getParam.get("keadaan"));
  const satuanVal = csv(getParam.get("satuan"));
  const lowPriceVal = normalizePrice(getParam.get("low_price"));
  const highPriceVal = normalizePrice(getParam.get("high_price"));
  const searchVal = getParam.get("search") || "";
  const rangeDateVal = getParam.get("range_date") || undefined;
  const startDateVal = getParam.get("start_date");
  const endDateVal = getParam.get("end_date");
  const customRange: [Dayjs | null, Dayjs | null] | null =
    startDateVal && endDateVal
      ? [dayjs(startDateVal), dayjs(endDateVal)]
      : null;

  // Number of active filter groups, shown as the badge count on the button
  const activeFilterCount = [
    searchVal !== "",
    kategoriVal.length > 0,
    lokasiVal.length > 0,
    asalVal.length > 0,
    keadaanVal.length > 0,
    satuanVal.length > 0,
    lowPriceVal !== "",
    highPriceVal !== "",
    rangeDateVal !== undefined,
  ].filter(Boolean).length;

  // Local display state for price inputs (formatted "Rp …"), debounced to the URL.
  const [lowPriceDraft, setLowPriceDraft] = useState<string>(lowPriceVal);
  const [highPriceDraft, setHighPriceDraft] = useState<string>(highPriceVal);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Debounced write of a raw numeric price param into the URL. */
  const debouncedUpdatePrice = (
    key: "low_price" | "high_price",
    rawValue: string | undefined,
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ [key]: normalizePrice(rawValue) || undefined });
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchKategori = useKategoryStore((state) => state.fetchKategori);
  const listKategori = useKategoryStore((state) => state.list);
  const fetchLokasi = useLokasiStore((state) => state.fetchLokasi);
  const listLokasi = useLokasiStore((state) => state.list);
  const fetchAsal = useAsalStore((state) => state.fetchAsal);
  const listAsal = useAsalStore((state) => state.list);
  const fetchKeadaan = useKeadaanStore((state) => state.fetchKeadaan);
  const listKeadaan = useKeadaanStore((state) => state.list);
  const fetchSatuan = useSatuanStore((state) => state.fetchSatuan);
  const listSatuan = useSatuanStore((state) => state.list);
  const fetchRef = useRef(false);

  useEffect(() => {
    if (!fetchRef.current) {
      if (listAsal.length < 1) {
        fetchAsal();
      }
      if (listKategori.length < 1) {
        fetchKategori();
      }
      if (listLokasi.length < 1) {
        fetchLokasi();
      }
      if (listKeadaan.length < 1) {
        fetchKeadaan();
      }
      if (listSatuan.length < 1) {
        fetchSatuan();
      }
      fetchRef.current = true;
    }
  }, [
    fetchAsal,
    fetchKategori,
    fetchLokasi,
    fetchKeadaan,
    fetchSatuan,
    listAsal.length,
    listKategori.length,
    listLokasi.length,
    listKeadaan.length,
    listSatuan.length,
  ]);

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

  const handleReset = () => {
    const currentParam = new URLSearchParams(Array.from(getParam.entries()));
    [
      "search",
      "kategori",
      "lokasi",
      "asal_barang",
      "keadaan",
      "satuan",
      "low_price",
      "high_price",
      "range_date",
      "start_date",
      "end_date",
    ].forEach((key) => currentParam.delete(key));
    currentParam.delete("page");
    const newParam = currentParam.toString();
    const query = newParam ? `?${newParam}` : "";
    router.replace(`${pathname}${query}`);

    // Clear local price drafts too (they mirror the URL)
    setLowPriceDraft("");
    setHighPriceDraft("");
  };

  /** Remove a single id from a comma-separated lookup param. */
  const removeLookupValue = (key: string, id: number) => {
    const remaining = csv(getParam.get(key)).filter((n) => n !== id);
    updateParams({ [key]: remaining.length ? remaining.join(",") : undefined });
  };

  const nameOf = (list: { id: number; name: string }[], id: number) =>
    list.find((item) => item.id === id)?.name ?? String(id);

  const rangeDateLabel: Record<string, string> = {
    week: "Minggu ini",
    month: "Bulan ini",
    year: "Tahun ini",
    custom:
      customRange && customRange[0] && customRange[1]
        ? `${customRange[0].format("DD MMM YYYY")} - ${customRange[1].format("DD MMM YYYY")}`
        : "Kustom",
  };

  // One chip per active filter value, each removable from the URL.
  const activeFilterList: {
    key: string;
    label: string;
    onClose: () => void;
  }[] = [
    ...(searchVal !== ""
      ? [
          {
            key: "search",
            label: `Cari: ${searchVal}`,
            onClose: () => updateParams({ search: undefined }),
          },
        ]
      : []),
    ...kategoriVal.map((id) => ({
      key: `kategori-${id}`,
      label: `Kategori: ${nameOf(listKategori, id)}`,
      onClose: () => removeLookupValue("kategori", id),
    })),
    ...lokasiVal.map((id) => ({
      key: `lokasi-${id}`,
      label: `Lokasi: ${nameOf(listLokasi, id)}`,
      onClose: () => removeLookupValue("lokasi", id),
    })),
    ...asalVal.map((id) => ({
      key: `asal-${id}`,
      label: `Asal: ${nameOf(listAsal, id)}`,
      onClose: () => removeLookupValue("asal_barang", id),
    })),
    ...keadaanVal.map((id) => ({
      key: `keadaan-${id}`,
      label: `Keadaan: ${nameOf(listKeadaan, id)}`,
      onClose: () => removeLookupValue("keadaan", id),
    })),
    ...satuanVal.map((id) => ({
      key: `satuan-${id}`,
      label: `Satuan: ${nameOf(listSatuan, id)}`,
      onClose: () => removeLookupValue("satuan", id),
    })),
    ...(lowPriceVal !== ""
      ? [
          {
            key: "low_price",
            label: `Harga min: Rp ${Number(lowPriceVal).toLocaleString("id-ID")}`,
            onClose: () => {
              setLowPriceDraft("");
              updateParams({ low_price: undefined });
            },
          },
        ]
      : []),
    ...(highPriceVal !== ""
      ? [
          {
            key: "high_price",
            label: `Harga maks: Rp ${Number(highPriceVal).toLocaleString("id-ID")}`,
            onClose: () => {
              setHighPriceDraft("");
              updateParams({ high_price: undefined });
            },
          },
        ]
      : []),
    ...(rangeDateVal
      ? [
          {
            key: "range_date",
            label: `Tanggal: ${rangeDateLabel[rangeDateVal] ?? rangeDateVal}`,
            onClose: () =>
              updateParams({
                range_date: undefined,
                start_date: undefined,
                end_date: undefined,
              }),
          },
        ]
      : []),
  ];

  return (
    <div>
      <ProductFilterDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        activeFilterCount={activeFilterCount}
        onReset={handleReset}
        updateParams={updateParams}
        filters={{
          kategori: kategoriVal,
          lokasi: lokasiVal,
          asal: asalVal,
          keadaan: keadaanVal,
          satuan: satuanVal,
          rangeDate: rangeDateVal,
          startDate: startDateVal,
          endDate: endDateVal,
        }}
        price={{
          lowDraft: lowPriceDraft,
          highDraft: highPriceDraft,
          onLowDraftChange: setLowPriceDraft,
          onHighDraftChange: setHighPriceDraft,
          onChange: debouncedUpdatePrice,
        }}
        lookup={{
          kategori: listKategori,
          lokasi: listLokasi,
          asal: listAsal,
          keadaan: listKeadaan,
          satuan: listSatuan,
        }}
      />

      <div className="flex items-center justify-between gap-4 ">
        <div>
          <h1 className="text-2xl font-semibold ">Daftar Barang</h1>
        </div>
        <div>
          <Badge count={activeFilterCount} color={"red"}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setDrawer(!drawer)}
            >
              Filter Barang
            </Button>
          </Badge>
        </div>
      </div>
      {activeFilterList.length > 0 && (
        <div className="mb-4 mt-2 flex flex-wrap items-center gap-2">
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
  );
};

export default ProductFilter;
