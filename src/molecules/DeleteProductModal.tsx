"use client";

import Notification from "@/src/molecules/Notification";
import { Modal } from "antd";
import axios from "axios";
import Cookies from "js-cookie";
import { useState } from "react";

interface DeleteProductModalProps {
  open: boolean;
  product: { id: number; name: string } | null;
  onClose: () => void;
  onDeleted?: () => void | Promise<void>;
}

const DeleteProductModal = ({
  open,
  product,
  onClose,
  onDeleted,
}: DeleteProductModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const token = Cookies.get("auth-token");
      const { data } = await axios.delete(`/api/delete-product/${product.id}`, {
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
        title: "Gagal Menghapus Barang",
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
      title="Konfirmasi Hapus Barang"
      okText="Hapus"
      cancelText="Batal"
      okButtonProps={{ danger: true }}
      confirmLoading={loading}
      onOk={handleDelete}
      onCancel={onClose}
    >
      {`Apakah anda ingin menghapus barang "${product?.name ?? ""}"?`}
    </Modal>
  );
};

export default DeleteProductModal;
