"use client";

import Notification from "@/src/molecules/Notification";
import {
  FileOutlined,
  ImportOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, Form, Upload } from "antd";
import type { UploadFile } from "antd";
import axios from "axios";
import Cookies from "js-cookie";
import React, { useState } from "react";

interface ImportErrorItem {
  file: string;
  row: number;
  reason: string;
}

interface ImportResponse {
  message?: string;
  summary?: Record<string, { created: number; updated: number }>;
  errors?: ImportErrorItem[];
}

interface ImportFormValues {
  importFile?: UploadFile[];
}

/** antd Upload hands the event to getValueFromEvent; the form wants the file list. */
const normFile = (
  event: { fileList?: UploadFile[] } | UploadFile[],
): UploadFile[] => (Array.isArray(event) ? event : (event?.fileList ?? []));

/** Flatten the per-table summary into "X dibuat, Y diperbarui" totals. */
const summaryText = (summary?: ImportResponse["summary"]): string => {
  if (!summary) return "";
  let created = 0;
  let updated = 0;
  for (const counts of Object.values(summary)) {
    created += counts.created;
    updated += counts.updated;
  }
  return `${created} data dibuat, ${updated} data diperbarui.`;
};

/** Build a description from the API's message plus its per-row error list. */
const errorText = (
  data: ImportResponse | undefined,
  fallback: string,
): string => {
  const message = data?.message ?? fallback;
  if (!data?.errors?.length) return message;

  const shown = data.errors
    .slice(0, 5)
    .map((item) => `${item.file} baris ${item.row}: ${item.reason}`);
  const remaining = data.errors.length - shown.length;

  return [
    message,
    ...shown,
    remaining > 0 ? `+${remaining} kesalahan lainnya` : "",
  ]
    .filter(Boolean)
    .join(" • ");
};

const ImportBackup = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<ImportFormValues>();

  const handleImport = async (values: ImportFormValues) => {
    const file = values.importFile?.[0]?.originFileObj;
    if (!file) return;

    const body = new FormData();
    body.append("file", file);

    setLoading(true);
    try {
      const token = Cookies.get("auth-token");
      const { data } = await axios.post<ImportResponse>(
        "/api/import-backup",
        body,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        },
      );

      Notification({
        type: "success",
        title: "Import Berhasil",
        description: summaryText(data.summary) || data.message,
      });
      form.resetFields();
    } catch (err) {
      const data = axios.isAxiosError(err)
        ? (err.response?.data as ImportResponse | undefined)
        : undefined;
      Notification({
        type: "error",
        title: "Import Gagal",
        description: errorText(data, "Terjadi kesalahan, coba lagi"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-medium">Import Data</h2>
      <Form form={form} className="mt-4! " onFinish={handleImport}>
        <Form.Item
          name="importFile"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          rules={[{ required: true, message: "Mohon masukan file backup!" }]}
        >
          <Upload.Dragger
            maxCount={1}
            beforeUpload={() => false}
            accept=".zip, application/zip, application/x-zip-compressed"
          >
            <div className="py-4!">
              <FileOutlined />
              <p className="ant-upload-text mt-2!">
                Klik atau seret file backup ke kolom ini untuk mengunggah
              </p>
            </div>
          </Upload.Dragger>
        </Form.Item>
        <div className="flex justify-center">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<UploadOutlined />}
          >
            Import Backup Data
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ImportBackup;
