"use client";

import type { LookupItem } from "@/src/utils/lookup";
import { normalizePrice, preventNonNumeric } from "@/src/utils/number";
import { Button, DatePicker, Divider, Drawer, InputNumber, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useScreenDefine } from "../utils/screenDefine";

interface ProductFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  activeFilterCount: number;
  onReset: () => void;
  updateParams: (patch: Record<string, string | undefined>) => void;
  filters: {
    kategori: number[];
    lokasi: number[];
    asal: number[];
    keadaan: number[];
    satuan: number[];
    rangeDate?: string;
    startDate: string | null;
    endDate: string | null;
  };
  price: {
    lowDraft: string;
    highDraft: string;
    onLowDraftChange: (value: string) => void;
    onHighDraftChange: (value: string) => void;
    onChange: (key: "low_price" | "high_price", raw?: string) => void;
  };
  lookup: {
    kategori: LookupItem[];
    lokasi: LookupItem[];
    asal: LookupItem[];
    keadaan: LookupItem[];
    satuan: LookupItem[];
  };
}

const ProductFilterDrawer = ({
  open,
  onClose,
  activeFilterCount,
  onReset,
  updateParams,
  filters,
  price,
  lookup,
}: ProductFilterDrawerProps) => {
  const { RangePicker } = DatePicker;
  const mobileScreen = useScreenDefine(575);

  const customRange: [Dayjs | null, Dayjs | null] | null =
    filters.startDate && filters.endDate
      ? [dayjs(filters.startDate), dayjs(filters.endDate)]
      : null;

  return (
    <Drawer
      placement={"right"}
      closable={true}
      onClose={onClose}
      open={open}
      closeIcon
      title={<h2 className="text-lg font-medium">Filter Barang</h2>}
      classNames={{
        header: "bg-[#F2EDE3] border-0",
      }}
      size={mobileScreen ? 300 : 375}
      footer={
        <div className="py-4">
          <Button
            type="primary"
            size="large"
            className="w-full"
            onClick={onClose}
          >
            Lihat Barang
          </Button>
          {activeFilterCount > 0 && (
            <Button
              type="text"
              size="large"
              className="w-full mt-2 border!"
              onClick={onReset}
            >
              Atur Ulang Filter
            </Button>
          )}
        </div>
      }
    >
      <div>
        <h3 className="text-[16px] font-medium">Kategori</h3>
        <Select
          mode="multiple"
          allowClear
          style={{ width: "100%" }}
          placeholder="Pilih kategori barang"
          options={lookup.kategori.map((state) => {
            return { value: state.id, label: state.name };
          })}
          className="mt-2!"
          value={filters.kategori}
          onChange={(value) => {
            updateParams({
              kategori: value.length ? value.join(",") : undefined,
            });
          }}
        />
      </div>
      <Divider className="mb-3! mt-4!" />
      <div>
        <h3 className="text-[16px] font-medium">Asal</h3>
        <Select
          mode="multiple"
          allowClear
          style={{ width: "100%" }}
          placeholder="Pilih asal Barang"
          options={lookup.asal.map((state) => {
            return { value: state.id, label: state.name };
          })}
          className="mt-2!"
          value={filters.asal}
          onChange={(value) => {
            updateParams({
              asal_barang: value.length ? value.join(",") : undefined,
            });
          }}
        />
      </div>
      <Divider className="mb-3! mt-4!" />
      <div>
        <h3 className="text-[16px] font-medium">Keadaan</h3>
        <Select
          mode="multiple"
          allowClear
          style={{ width: "100%" }}
          placeholder="Pilih keadaan barang"
          options={lookup.keadaan.map((state) => {
            return { value: state.id, label: state.name };
          })}
          className="mt-2!"
          value={filters.keadaan}
          onChange={(value) => {
            updateParams({
              keadaan: value.length ? value.join(",") : undefined,
            });
          }}
        />
      </div>
      <Divider className="mb-3! mt-4!" />
      <div>
        <h3 className="text-[16px] font-medium">Satuan</h3>
        <Select
          mode="multiple"
          allowClear
          style={{ width: "100%" }}
          placeholder="Pilih satuan barang"
          options={lookup.satuan.map((state) => {
            return { value: state.id, label: state.name };
          })}
          className="mt-2!"
          value={filters.satuan}
          onChange={(value) => {
            updateParams({
              satuan: value.length ? value.join(",") : undefined,
            });
          }}
        />
      </div>
      <Divider className="mb-3! mt-4!" />
      <div>
        <h3 className="text-[16px] font-medium">Lokasi</h3>
        <Select
          mode="multiple"
          allowClear
          style={{ width: "100%" }}
          placeholder="Pilih lokasi barang"
          options={lookup.lokasi.map((state) => {
            return { value: state.id, label: state.name };
          })}
          className="mt-2!"
          value={filters.lokasi}
          onChange={(value) => {
            updateParams({
              lokasi: value.length ? value.join(",") : undefined,
            });
          }}
        />
      </div>
      <Divider className="mb-3! mt-4!" />
      <div>
        <h3 className="text-[16px] font-medium">Harga</h3>
        <p className="mt-2">Terendah</p>
        <InputNumber
          className="mt-1! w-full!"
          placeholder="Masukan harga terendah"
          prefix="Rp"
          controls={false}
          value={price.lowDraft === "" ? null : Number(price.lowDraft)}
          onKeyDown={preventNonNumeric}
          formatter={(value) =>
            value === undefined || value === null
              ? ""
              : Number(value).toLocaleString("id-ID")
          }
          parser={(value) => Number(value?.replace(/\D/g, "") || 0)}
          onChange={(value) => {
            const raw = normalizePrice(
              value === null || value === undefined ? "" : String(value),
            );
            price.onLowDraftChange(raw);
            price.onChange("low_price", raw || undefined);
          }}
        />
        <p className="mt-2">Tertinggi</p>
        <InputNumber
          className="mt-1! w-full!"
          placeholder="Masukan harga tertinggi"
          prefix="Rp"
          controls={false}
          value={price.highDraft === "" ? null : Number(price.highDraft)}
          onKeyDown={preventNonNumeric}
          formatter={(value) =>
            value === undefined || value === null
              ? ""
              : Number(value).toLocaleString("id-ID")
          }
          parser={(value) => Number(value?.replace(/\D/g, "") || 0)}
          onChange={(value) => {
            const raw = normalizePrice(
              value === null || value === undefined ? "" : String(value),
            );
            price.onHighDraftChange(raw);
            price.onChange("high_price", raw || undefined);
          }}
        />
      </div>
      <Divider className="mb-3! mt-4!" />
      <div>
        <h3 className="text-[16px] font-medium">Tanggal</h3>
        <Select
          allowClear
          style={{ width: "100%" }}
          placeholder="Pilih rentang tanggal"
          options={[
            { value: "week", label: "Minggu ini" },
            { value: "month", label: "Bulan ini" },
            { value: "year", label: "Tahun ini" },
            { value: "custom", label: "Kustom" },
          ]}
          className="mt-2!"
          value={filters.rangeDate}
          onChange={(value) => {
            if (value === "custom") {
              updateParams({ range_date: "custom" });
            } else {
              updateParams({
                range_date: value || undefined,
                start_date: undefined,
                end_date: undefined,
              });
            }
          }}
        />
        {filters.rangeDate === "custom" && (
          <>
            <p className="mt-2">Rentang Waktu</p>
            <RangePicker
              className="mt-2! w-full!"
              value={customRange}
              onChange={(dates) => {
                updateParams({
                  range_date: "custom",
                  start_date: dates?.[0]?.format("YYYY-MM-DD"),
                  end_date: dates?.[1]?.format("YYYY-MM-DD"),
                });
              }}
            />
          </>
        )}
      </div>
    </Drawer>
  );
};

export default ProductFilterDrawer;
