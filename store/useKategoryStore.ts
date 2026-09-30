"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";

export interface Kategori {
  id: number;
  name: string;
}

interface KategoriState {
  list: Kategori[];
  loading: boolean;
  error: string | null;

  fetchKategori: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  list: [],
  loading: false,
  error: null,
};

export const useKategoryStore = create<KategoriState>((set) => ({
  ...initialState,

  fetchKategori: async () => {
    set({ loading: true, error: null });

    try {
      const token = Cookies.get("auth-token");

      const { data } = await axios.get<{ data: Kategori[] }>(
        "/api/kategori-barang",
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        },
      );

      set({ list: data.data, loading: false });
    } catch (err) {
      set({
        loading: false,
        error:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat kategori barang",
      });
    }
  },

  reset: () => set({ ...initialState }),
}));
