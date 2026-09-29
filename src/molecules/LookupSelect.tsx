"use client";

import Notification from "@/src/molecules/Notification";
import {
  addLookup,
  deleteLookup,
  LOOKUP_LABEL,
  updateLookup,
  type LookupEntity,
  type LookupItem,
  type LookupResponse,
} from "@/src/utils/lookup";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Divider, Input, Modal, Select } from "antd";
import type { SelectProps } from "antd";
import axios from "axios";
import React, { useState } from "react";

type LookupSelectProps = Omit<SelectProps<number>, "options"> & {
  entity: LookupEntity;
  list: LookupItem[];
  onRefresh: () => void | Promise<void>;
};

const LookupSelect = ({
  entity,
  list,
  onRefresh,
  value,
  onChange,
  showSearch,
  ...rest
}: LookupSelectProps) => {
  const label = LOOKUP_LABEL[entity];

  // Search the visible name, not the numeric id. `optionFilterProp` is folded
  // into `showSearch` — the top-level prop is deprecated.
  const mergedShowSearch =
    showSearch === false
      ? false
      : {
          optionFilterProp: "label",
          ...(typeof showSearch === "object" ? showSearch : {}),
        };

  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<LookupItem | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<LookupItem | null>(null);
  const [saving, setSaving] = useState(false);

  const options = list.map((item) => ({ value: item.id, label: item.name }));

  const run = async (
    action: () => Promise<LookupResponse>,
    errorTitle: string,
    onSuccess?: () => void,
  ) => {
    setSaving(true);
    try {
      const data = await action();
      await onRefresh();
      onSuccess?.();
      Notification({
        type: "success",
        title: data.message ?? "Berhasil",
        description: data.description,
      });
    } catch (err) {
      Notification({
        type: "error",
        title: errorTitle,
        description:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Terjadi kesalahan, coba lagi",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name || saving) return;
    run(
      () => addLookup(entity, name),
      `Gagal Menambah ${label}`,
      () => setNewName(""),
    );
  };

  const handleUpdate = () => {
    if (!editing) return;
    const name = editName.trim();
    if (!name || saving) return;
    run(
      () => updateLookup(entity, editing.id, name),
      `Gagal Mengubah ${label}`,
      () => setEditing(null),
    );
  };

  const handleDelete = () => {
    if (!deleting || saving) return;
    const id = deleting.id;
    run(
      () => deleteLookup(entity, id),
      `Gagal Menghapus ${label}`,
      () => {
        setDeleting(null);
        // Drop the selection if the removed row was the one picked.
        if (value === id) onChange?.(undefined as unknown as number);
      },
    );
  };

  return (
    <>
      <Select<number>
        value={value}
        onChange={onChange}
        options={options}
        showSearch={mergedShowSearch}
        optionRender={(option) => {
          const item = list.find((entry) => entry.id === option.value);
          if (!item) return option.label;
          return (
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">{item.name}</span>
              <span className="flex items-center gap-1">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditName(item.name);
                    setEditing(item);
                  }}
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleting(item);
                  }}
                />
              </span>
            </div>
          );
        }}
        popupRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: "8px 0" }} />
            <div className="flex items-center gap-2 px-2 pb-1">
              <Input
                value={newName}
                placeholder={`Tambah ${label.toLowerCase()}`}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onPressEnter={handleAdd}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={saving}
                onClick={handleAdd}
              >
                Tambah
              </Button>
            </div>
          </>
        )}
        {...rest}
      />

      <Modal
        open={editing !== null}
        centered
        title={`Ubah ${label}`}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={saving}
        onOk={handleUpdate}
        onCancel={() => setEditing(null)}
      >
        <Input
          value={editName}
          placeholder={`Masukan ${label.toLowerCase()}`}
          onChange={(e) => setEditName(e.target.value)}
          onPressEnter={handleUpdate}
        />
      </Modal>

      <Modal
        open={deleting !== null}
        centered
        title={`Konfirmasi Hapus ${label}`}
        okText="Hapus"
        cancelText="Batal"
        okButtonProps={{ danger: true }}
        confirmLoading={saving}
        onOk={handleDelete}
        onCancel={() => setDeleting(null)}
      >
        {`Apakah anda ingin menghapus ${label.toLowerCase()} "${deleting?.name}"?`}
      </Modal>
    </>
  );
};

export default LookupSelect;
