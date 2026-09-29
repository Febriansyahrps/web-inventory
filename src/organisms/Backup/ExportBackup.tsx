"use client";

import Notification from "@/src/molecules/Notification";
import { backupFilename } from "@/src/utils/backupFilename";
import { DownloadOutlined } from "@ant-design/icons";
import { Button } from "antd";
import axios from "axios";
import Cookies from "js-cookie";
import React, { useState } from "react";

/** Pull the download name out of a Content-Disposition header. */
const filenameFromHeader = (header?: string): string | null => {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);
  return match ? decodeURIComponent(match[1].replace(/"/g, "")) : null;
};

/** Save a fetched blob to disk via a temporary object URL. */
const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/**
 * Axios error bodies are Blobs when responseType is "blob", so read the text
 * back out to surface the API's message instead of a generic one.
 */
const errorMessage = async (err: unknown): Promise<string> => {
  if (!axios.isAxiosError(err)) return "Terjadi kesalahan, coba lagi";

  const data: unknown = err.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (typeof parsed?.message === "string") return parsed.message;
    } catch {
      // fall through to the generic message
    }
  } else if (typeof data === "object" && data !== null && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  return "Terjadi kesalahan, coba lagi";
};

const ExportBackup = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("auth-token");
      const response = await axios.post("/api/export-backup", null, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        responseType: "blob",
      });

      const filename =
        filenameFromHeader(response.headers["content-disposition"]) ??
        backupFilename();
      saveBlob(response.data as Blob, filename);

      Notification({
        type: "success",
        title: "Backup Berhasil Diunduh",
        description: `${filename} sedang diunduh.`,
      });
    } catch (err) {
      Notification({
        type: "error",
        title: "Gagal Export Backup",
        description: await errorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-medium">Export Data</h2>
      <p className="mt-0.5">
        Kelola salinan data inventaris secara berkala untuk mencegah kehilangan
        data.
      </p>
      <div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          className="mt-4"
          loading={loading}
          onClick={handleExport}
        >
          Export Backup Data
        </Button>
      </div>
      {/* <p className="text-gray-400 mt-1">Terakhir Diunduh: </p> */}
    </div>
  );
};

export default ExportBackup;
