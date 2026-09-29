"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { create } from "zustand";

// User row shape returned by /api/user
export interface User {
  id: number;
  username: string;
  fullname: string;
  role: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

interface UserQuery {
  page?: number;
  limit?: number;
  role?: number;
  search?: string;
  sort?: string;
}

interface UserResponse {
  data: User[];
  page: number;
  total_page: number;
  total_user: number;
  limit: number;
}

interface UserState {
  users: User[];
  page: number;
  totalPage: number;
  totalUser: number;
  limit: number;
  loading: boolean;
  error: string | null;

  fetchUsers: (query?: UserQuery) => Promise<void>;
  reset: () => void;
}

const initialState = {
  users: [],
  page: 1,
  totalPage: 1,
  totalUser: 0,
  limit: 20,
  loading: false,
  error: null,
};

export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  fetchUsers: async (query = {}) => {
    set({ loading: true, error: null });

    try {
      const token = Cookies.get("auth-token");

      const { data } = await axios.get<UserResponse>("/api/user", {
        params: {
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          role: query.role ?? undefined,
          search: query.search || undefined,
          sort: query.sort || undefined,
        },
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      set({
        users: data.data,
        page: data.page,
        totalPage: data.total_page,
        totalUser: data.total_user,
        limit: data.limit,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Failed to fetch users",
      });
    }
  },

  reset: () => set({ ...initialState }),
}));
