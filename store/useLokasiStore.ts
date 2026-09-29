"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";

export interface Lokasi {
  id: number;
  name: string;
}

interface LokasiState {
  list: Lokasi[];
  loading: boolean;
  error: string | null;

  fetchLokasi: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  list: [],
  loading: false,
  error: null,
};

export const useLokasiStore = create<LokasiState>((set) => ({
  ...initialState,

  fetchLokasi: async () => {
    set({ loading: true, error: null });

    try {
      const token = Cookies.get("auth-token");

      const { data } = await axios.get<{ data: Lokasi[] }>("/api/lokasi-barang", {
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
            : "Failed to fetch lokasi",
      });
    }
  },

  reset: () => set({ ...initialState }),
}));
