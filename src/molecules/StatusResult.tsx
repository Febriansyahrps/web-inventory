"use client";

import { Button, Result } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";

export type StatusCode = "403" | "404" | "500";

interface StatusResultProps {
  status: StatusCode;
  title?: string;
  subTitle?: string;
  href?: string;
  actionLabel?: string;
  /** Replaces the default link/button action (e.g. a "try again" button). */
  extra?: ReactNode;
}

const DEFAULTS: Record<StatusCode, { subTitle: string; actionLabel: string }> = {
  "403": {
    subTitle: "Anda tidak memiliki izin untuk mengakses halaman ini.",
    actionLabel: "Kembali ke Dashboard",
  },
  "404": {
    subTitle: "Halaman yang anda cari tidak ditemukan.",
    actionLabel: "Kembali ke Dashboard",
  },
  "500": {
    subTitle: "Terjadi kesalahan pada server. Silakan coba lagi.",
    actionLabel: "Kembali ke Dashboard",
  },
};

const StatusResult = ({
  status,
  title,
  subTitle,
  href = "/",
  actionLabel,
  extra,
}: StatusResultProps) => {
  const defaults = DEFAULTS[status];

  return (
    <Result
      status={status}
      title={title ?? status}
      subTitle={subTitle ?? defaults.subTitle}
      extra={
        extra ?? (
          <Link href={href}>
            <Button type="primary">{actionLabel ?? defaults.actionLabel}</Button>
          </Link>
        )
      }
    />
  );
};

export default StatusResult;
