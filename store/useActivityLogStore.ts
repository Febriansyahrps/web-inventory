"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";

// Activity log row shape returned by /api/activity-log
export interface ActivityLog {
  id: number;
  user: { id: number; username: string } | null;
  action: string;
  entity: string;
  entity_id: number | null;
  label: string;
  message: string;
  created_at: string;
}

interface ActivityLogQuery {
  page?: number;
  limit?: number;
}

interface ActivityLogResponse {
  data: ActivityLog[];
  page: number;
  total_page: number;
  total_log: number;
  limit: number;
}

interface ActivityLogState {
  logs: ActivityLog[];
  page: number;
  totalPage: number;
  totalLog: number;
  limit: number;
  loading: boolean;
  error: string | null;

  fetchLogs: (query?: ActivityLogQuery) => Promise<void>;
  reset: () => void;
}

const initialState = {
  logs: [],
  page: 1,
  totalPage: 1,
  totalLog: 0,
  limit: 20,
  loading: false,
  error: null,
};

export const useActivityLogStore = create<ActivityLogState>((set) => ({
  ...initialState,

  fetchLogs: async (query = {}) => {
    set({ loading: true, error: null });

    try {
      const token = Cookies.get("auth-token");

      const { data } = await axios.get<ActivityLogResponse>(
        "/api/activity-log",
        {
          params: {
            page: query.page ?? 1,
            limit: query.limit ?? 20,
          },
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        },
      );

      set({
        logs: data.data,
        page: data.page,
        totalPage: data.total_page,
        totalLog: data.total_log,
        limit: data.limit,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Gagal memuat data log aktivitas",
      });
    }
  },

  reset: () => set({ ...initialState }),
}));
