"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const AUTH_COOKIES = ["auth-token", "user-id", "username", "fullname", "role"];

export function useLogout() {
  const router = useRouter();

  return () => {
    AUTH_COOKIES.forEach((name) => Cookies.remove(name));
    router.replace("/login");
    router.refresh();
  };
}
