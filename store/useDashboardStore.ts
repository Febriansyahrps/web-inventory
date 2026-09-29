"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";

// One group of a breakdown (by_category / by_asal / by_keadaan).
// `id` is null for rows whose lookup FK is missing (labelled "Tidak diketahui").
export interface DashboardBreakdown {
  id: number | null;
  name: string;
  count: number;
}

// A row of the `recent` list from /api/dashboard-data.
export interface DashboardRecentProduct {
  id: number;
  kode_barang: string;
  nama_barang: string;
  kategori_barang: { id: number; name: string } | null;
  jumlah_barang: number;
  created_at: string;
}

interface DashboardResponse {
  total_product: number;
  total_stock: number;
  total_asset_value: number;
  by_category: DashboardBreakdown[];
  by_asal: DashboardBreakdown[];
  by_keadaan: DashboardBreakdown[];
  recent: DashboardRecentProduct[];
}

interface DashboardState extends DashboardResponse {
  loading: boolean;
  error: string | null;

  fetchDashboard: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  total_product: 0,
  total_stock: 0,
  total_asset_value: 0,
  by_category: [],
  by_asal: [],
  by_keadaan: [],
  recent: [],
  loading: false,
  error: null,
};

export const useDashboardStore = create<DashboardState>((set) => ({
  ...initialState,

  fetchDashboard: async () => {
    set({ loading: true, error: null });

    try {
      const token = Cookies.get("auth-token");

      const { data } = await axios.get<DashboardResponse>("/api/dashboard-data", {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      set({
        total_product: data.total_product,
        total_stock: data.total_stock,
        total_asset_value: data.total_asset_value,
        by_category: data.by_category,
        by_asal: data.by_asal,
        by_keadaan: data.by_keadaan,
        recent: data.recent,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Failed to fetch dashboard data",
      });
    }
  },

  reset: () => set({ ...initialState }),
}));
