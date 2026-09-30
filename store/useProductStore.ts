"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";

// Product row shape returned by /api/product (see lib/serialize.ts)
export interface Product {
  id: number;
  kode_barang: string;
  no_register: string;
  nama_barang: string;
  merk_barang: string | null;
  no_sertifikat: string | null;
  bahan: string | null;
  tahun_perolehan: number | null;
  ukuran_barang: string | null;
  jumlah_barang: number;
  harga_barang: number;
  foto_barang: string | null;
  kategori_barang: { id: number; name: string } | null;
  lokasi_barang: { id: number; name: string } | null;
  asal_barang: { id: number; name: string } | null;
  keadaan_barang: { id: number; name: string } | null;
  satuan_barang: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  kategori?: number[];
  lokasi?: number[];
  asal_barang?: number[];
  keadaan?: number[];
  satuan?: number[];
  low_price?: number;
  high_price?: number;
  range_date?: string;
  start_date?: string;
  end_date?: string;
  sort?: string;
}

interface ProductResponse {
  data: Product[];
  page: number;
  total_page: number;
  total_product: number;
  total_asset_value: number;
  limit: number;
  total_stock: number;
}

interface ProductState {
  products: Product[];
  page: number;
  totalPage: number;
  totalProduct: number;
  totalStock: number;
  totalAssetValue: number;
  limit: number;
  loading: boolean;
  error: string | null;

  fetchProducts: (query?: ProductQuery) => Promise<void>;
  reset: () => void;
}

const initialState = {
  products: [],
  page: 1,
  totalPage: 1,
  totalProduct: 0,
  totalStock: 0,
  totalAssetValue: 0,
  limit: 20,
  loading: false,
  error: null,
};

export const useProductStore = create<ProductState>((set) => ({
  ...initialState,

  fetchProducts: async (query = {}) => {
    set({ loading: true, error: null });

    try {
      const token = Cookies.get("auth-token");

      const { data } = await axios.get<ProductResponse>("/api/product", {
        params: {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          search: query.search || undefined,
          kategori: query.kategori?.join(",") || undefined,
          lokasi: query.lokasi?.join(",") || undefined,
          asal_barang: query.asal_barang?.join(",") || undefined,
          keadaan: query.keadaan?.join(",") || undefined,
          satuan: query.satuan?.join(",") || undefined,
          low_price: query.low_price ?? undefined,
          high_price: query.high_price ?? undefined,
          range_date: query.range_date || undefined,
          start_date: query.start_date || undefined,
          end_date: query.end_date || undefined,
          sort: query.sort || undefined,
        },
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      set({
        products: data.data,
        page: data.page,
        totalPage: data.total_page,
        totalProduct: data.total_product,
        totalStock: data.total_stock,
        totalAssetValue: data.total_asset_value,
        limit: data.limit,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat data barang",
      });
    }
  },

  reset: () => set({ ...initialState }),
}));
