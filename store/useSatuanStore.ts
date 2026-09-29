"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";

export interface Satuan {
  id: number;
  name: string;
}

interface SatuanState {
  list: Satuan[];
  loading: boolean;
  error: string | null;

  fetchSatuan: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  list: [],
  loading: false,
  error: null,
};

export const useSatuanStore = create<SatuanState>((set) => ({
  ...initialState,

  fetchSatuan: async () => {
    set({ loading: true, error: null });

    try {
      const token = Cookies.get("auth-token");

      const { data } = await axios.get<{ data: Satuan[] }>("/api/satuan-barang", {
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
            : "Failed to fetch satuan",
      });
    }
  },

  reset: () => set({ ...initialState }),
}));
