"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";

export interface Asal {
  id: number;
  name: string;
}

interface AsalState {
  list: Asal[];
  loading: boolean;
  error: string | null;

  fetchAsal: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  list: [],
  loading: false,
  error: null,
};

export const useAsalStore = create<AsalState>((set) => ({
  ...initialState,

  fetchAsal: async () => {
    set({ loading: true, error: null });

    try {
      const token = Cookies.get("auth-token");

      const { data } = await axios.get<{ data: Asal[] }>("/api/asal-barang", {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      set({ list: data.data, loading: false });
    } catch (err) {
      set({
        loading: false,
        error:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat data asal barang",
      });
    }
  },

  reset: () => set({ ...initialState }),
}));
