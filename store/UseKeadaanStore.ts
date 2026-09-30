"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";

export interface Keadaan {
  id: number;
  name: string;
}

interface KeadaanState {
  list: Keadaan[];
  loading: boolean;
  error: string | null;

  fetchKeadaan: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  list: [],
  loading: false,
  error: null,
};

export const useKeadaanStore = create<KeadaanState>((set) => ({
  ...initialState,

  fetchKeadaan: async () => {
    set({ loading: true, error: null });

    try {
      const token = Cookies.get("auth-token");

      const { data } = await axios.get<{ data: Keadaan[] }>(
        "/api/keadaan-barang",
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
            : "Gagal memuat data keadaan barang",
      });
    }
  },

  reset: () => set({ ...initialState }),
}));
