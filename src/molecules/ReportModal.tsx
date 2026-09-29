"use client";

import Notification from "@/src/molecules/Notification";
import { DatePicker, Divider, Form, Modal, Select } from "antd";
import axios from "axios";
import Cookies from "js-cookie";
import dayjs, { Dayjs } from "dayjs";
import React, { useState } from "react";

interface ReportFormValues {
  range_date: string;
  date?: [Dayjs | null, Dayjs | null] | null;
  file: "pdf" | "xlsx";
}

// Preset values match the /api/generate-report contract. "custom" is handled
// by omitting range_date and sending the explicit window instead.
const RANGE_OPTIONS = [
  { value: "this_week", label: "Minggu ini" },
  { value: "this_month", label: "Bulan ini" },
  { value: "this_year", label: "Tahun ini" },
  { value: "custom", label: "Kustom" },
];

const FILE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "xlsx", label: "XLSX (Excel)" },
];

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

const ReportModal = ({
  reportModal,
  setReportModal,
}: {
  reportModal: boolean;
  setReportModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { RangePicker } = DatePicker;
  const [form] = Form.useForm<ReportFormValues>();
  const [loading, setLoading] = useState(false);
  const rangeDate = Form.useWatch("range_date", form);
  const isCustom = rangeDate === "custom";

  const handleSubmit = async () => {
    let values: ReportFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return; // antd renders the field errors
    }

    const payload: Record<string, string> = { file: values.file };
    if (values.range_date === "custom") {
      payload.start_date = values.date?.[0]?.format("YYYY-MM-DD") ?? "";
      payload.end_date = values.date?.[1]?.format("YYYY-MM-DD") ?? "";
    } else {
      payload.range_date = values.range_date;
    }

    setLoading(true);
    try {
      const token = Cookies.get("auth-token");
      const response = await axios.post("/api/generate-report", payload, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        responseType: "blob",
      });

      const filename =
        filenameFromHeader(response.headers["content-disposition"]) ??
        `laporan-barang-masuk.${values.file}`;
      saveBlob(response.data as Blob, filename);

      Notification({
        type: "success",
        title: "Laporan Berhasil Dibuat",
        description: `${filename} sedang diunduh.`,
      });

      setReportModal(false);
      form.resetFields();
    } catch (err) {
      Notification({
        type: "error",
        title: "Gagal Membuat Laporan",
        description: await errorMessage(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={reportModal}
      onCancel={() => setReportModal(false)}
      onOk={handleSubmit}
      confirmLoading={loading}
      centered
      closeIcon
      okText="Buat Laporan"
      title={<h2 className="text-lg font-medium">Laporan Inventaris Barang</h2>}
    >
      <Divider className="my-4!" />
      <div className="px-2">
        <Form
          form={form}
          layout="vertical"
          size="large"
          requiredMark={false}
          styles={{ label: { height: "auto" } }}
        >
          <Form.Item
            name="range_date"
            label="Tanggal"
            rules={[{ required: true, message: "Mohon pilih tanggal!" }]}
          >
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Pilih rentang tanggal"
              options={RANGE_OPTIONS}
              onChange={(value) => {
                // Drop a stale custom range so it can't be submitted.
                if (value !== "custom") form.setFieldValue("date", undefined);
              }}
            />
          </Form.Item>

          {isCustom && (
            <Form.Item
              name="date"
              label="Rentang Waktu"
              rules={[
                { required: true, message: "Mohon pilih rentang waktu!" },
              ]}
            >
              <RangePicker
                className="w-full!"
                format="DD-MM-YYYY"
                disabledDate={(current) =>
                  current && current > dayjs().endOf("day")
                }
              />
            </Form.Item>
          )}

          <Form.Item
            name="file"
            label="Format File"
            rules={[{ required: true, message: "Mohon pilih file!" }]}
          >
            <Select
              allowClear
              style={{ width: "100%" }}
              placeholder="Pilih format file"
              options={FILE_OPTIONS}
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default ReportModal;
