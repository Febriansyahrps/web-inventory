"use client";

import Notification from "@/src/molecules/Notification";
import { Modal } from "antd";
import axios from "axios";
import Cookies from "js-cookie";
import { useState } from "react";

interface DeleteAccountModalProps {
  open: boolean;
  account: { id: number; name: string } | null;
  onClose: () => void;
  onDeleted?: () => void | Promise<void>;
}

const DeleteAccountModal = ({
  open,
  account,
  onClose,
  onDeleted,
}: DeleteAccountModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!account) return;

    setLoading(true);
    try {
      const token = Cookies.get("auth-token");
      const { data } = await axios.delete(`/api/delete-user/${account.id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      Notification({
        type: "success",
        title: data.message,
        description: data.description,
      });

      await onDeleted?.();
      onClose();
    } catch (err) {
      Notification({
        type: "error",
        title: "Gagal Menghapus Akun",
        description:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Terjadi kesalahan, coba lagi",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      centered
      title="Konfirmasi Hapus Akun"
      okText="Hapus"
      cancelText="Batal"
      okButtonProps={{ danger: true }}
      confirmLoading={loading}
      onOk={handleDelete}
      onCancel={onClose}
    >
      {`Apakah anda ingin menghapus akun "${account?.name ?? ""}"?`}
    </Modal>
  );
};

export default DeleteAccountModal;
