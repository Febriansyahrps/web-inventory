"use client";

import DeleteAccountModal from "@/src/molecules/DeleteAccountModal";
import Notification from "@/src/molecules/Notification";
import StatusResult from "@/src/molecules/StatusResult";
import type { User } from "@/store/useUserStore";
import { Button, Card, Col, Divider, Form, Input, Row, Select } from "antd";
import type { FormProps } from "antd";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useCookie } from "@/src/utils/useCookie";
import { useEffect, useState } from "react";
import { DeleteOutlined } from "@ant-design/icons";

interface UserFormValues {
  username: string;
  fullname: string;
  role: number;
  password?: string;
  repeat_password?: string;
}

interface UserFormProps {
  isAddUser?: boolean;
  userId?: number;
}

// Role options (role ids: 1 = ADMIN, 2 = VIEWER)
const ROLE_OPTIONS = [
  { value: 1, label: "ADMIN" },
  { value: 2, label: "VIEWER" },
];

const UserForm = ({ isAddUser = true, userId }: UserFormProps) => {
  const isAdd = isAddUser;
  const router = useRouter();
  // Role cookie holds the role id; "1" is ADMIN. Same gate as Header/UserTable.
  // Non-admins get a read-only view (the add/update routes reject them).
  const readOnly = useCookie("role") !== "1";
  const currentUserId = Number(useCookie("user-id"));
  const [form] = Form.useForm<UserFormValues>();
  const [loading, setLoading] = useState(false);
  // Starts true when editing so the detail fetch never setState synchronously.
  const [fetching, setFetching] = useState(!isAdd);
  const [deleteModal, setDeleteModal] = useState(false);
  // initialValues only apply when the Form mounts, so the fetched user is held
  // here and applied as the Form mounts (once `fetching` flips to false). Calling
  // form.setFieldsValue() before that would target an unconnected instance.
  const [initialValues, setInitialValues] = useState<Partial<UserFormValues>>();
  // Edit mode with a missing/invalid id → there is no item to show. API errors
  // (403/404/500) surface here too, as a full Result page.
  const [statusError, setStatusError] = useState<"403" | "404" | "500" | null>(
    null,
  );
  const itemMissing = !isAdd && !userId;

  // Edit mode: load the user and prefill the form.
  useEffect(() => {
    if (isAdd || !userId) return;

    let active = true;

    const fetchDetail = async () => {
      try {
        const token = Cookies.get("auth-token");
        const { data } = await axios.get<{ data: User }>(
          `/api/user/${userId}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          },
        );
        if (!active) return;

        const user = data.data;
        setInitialValues({
          username: user.username,
          fullname: user.fullname,
          role: user.role?.id,
        });
      } catch (err) {
        if (!active) return;
        const status = axios.isAxiosError(err)
          ? err.response?.status
          : undefined;
        setStatusError(status === 404 ? "404" : status === 403 ? "403" : "500");
      } finally {
        if (active) setFetching(false);
      }
    };

    fetchDetail();

    return () => {
      active = false;
    };
  }, [isAdd, userId]);

  const onFinishHandler: FormProps<UserFormValues>["onFinish"] = async (
    values,
  ) => {
    setLoading(true);

    try {
      const token = Cookies.get("auth-token");

      // Add sends every field; update omits the password pair when left blank
      // so the password only changes when a new one is typed.
      const payload: Record<string, string | number> = {
        username: values.username,
        fullname: values.fullname,
        role: values.role,
      };
      if (values.password) {
        payload.password = values.password;
        payload.repeat_password = values.repeat_password as string;
      }

      const config = {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      };

      const { data } = isAdd
        ? await axios.post("/api/add-user", payload, config)
        : await axios.patch(`/api/update-user/${userId}`, payload, config);

      Notification({
        type: "success",
        title: data.message,
      });

      if (isAdd) form.resetFields();
      router.push("/akun");
    } catch (err) {
      Notification({
        type: "error",
        title: isAdd ? "Gagal Menyimpan Akun" : "Gagal Mengubah Akun",
        description:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Terjadi kesalahan, coba lagi",
      });
    } finally {
      setLoading(false);
    }
  };

  if (itemMissing || statusError === "404") {
    return (
      <StatusResult
        status="404"
        subTitle="Data akun tidak ditemukan."
        href="/akun"
        actionLabel="Kembali ke Daftar Akun"
      />
    );
  }

  if (statusError === "403") {
    return (
      <StatusResult
        status="403"
        subTitle="Anda tidak memiliki izin untuk mengakses data akun."
        href="/akun"
        actionLabel="Kembali ke Daftar Akun"
      />
    );
  }

  if (statusError === "500") {
    return (
      <StatusResult
        status="500"
        href="/akun"
        actionLabel="Kembali ke Daftar Akun"
      />
    );
  }

  return (
    <Card
      loading={fetching}
      className="mt-6! max-[575px]:mt-4!"
      classNames={{ body: "max-[575px]:px-3! max-[575px]:py-4!" }}
    >
      <Form
        form={form}
        initialValues={initialValues}
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={onFinishHandler}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold ">
            {isAdd ? "Tambah Akun" : "Detail Akun"}
          </h1>
          {!isAdd && !readOnly && userId !== currentUserId && (
            <Button
              icon={<DeleteOutlined />}
              type="primary"
              danger
              ghost
              onClick={() => setDeleteModal(true)}
            >
              Hapus <span className="max-[575px]:hidden!">Akun</span>
            </Button>
          )}
        </div>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Mohon masukan username!" }]}
            >
              <Input
                size="large"
                disabled={readOnly}
                placeholder="Masukan username"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Nama Lengkap"
              name="fullname"
              rules={[
                { required: true, message: "Mohon masukan nama lengkap!" },
              ]}
            >
              <Input
                size="large"
                disabled={readOnly}
                placeholder="Masukan nama lengkap"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Role"
              name="role"
              rules={[{ required: true, message: "Mohon pilih role!" }]}
            >
              <Select
                size="large"
                placeholder="Pilih role akun"
                options={ROLE_OPTIONS}
                disabled={readOnly}
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Password"
              name="password"
              extra={
                isAdd
                  ? undefined
                  : "Kosongkan jika tidak ingin mengubah password"
              }
              rules={
                isAdd
                  ? [{ required: true, message: "Mohon masukan password!" }]
                  : []
              }
            >
              <Input.Password
                size="large"
                disabled={readOnly}
                placeholder="Masukan password"
                autoComplete="new-password"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Konfirmasi Password"
              name="repeat_password"
              dependencies={["password"]}
              rules={[
                ...(isAdd
                  ? [{ required: true, message: "Mohon ulangi password!" }]
                  : []),
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const password = getFieldValue("password");
                    if (!password && !value) return Promise.resolve();
                    if (!value) {
                      return Promise.reject(
                        new Error("Mohon ulangi password!"),
                      );
                    }
                    if (value !== password) {
                      return Promise.reject(new Error("Password tidak sama!"));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input.Password
                size="large"
                disabled={readOnly}
                placeholder="Ulangi password"
                autoComplete="new-password"
              />
            </Form.Item>
          </Col>
        </Row>

        {readOnly ? (
          <p className="text-sm text-gray-500">
            Hanya admin yang dapat mengubah data akun.
          </p>
        ) : (
          <div className="flex justify-end">
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
            >
              Simpan Akun
            </Button>
          </div>
        )}
      </Form>
      <DeleteAccountModal
        open={deleteModal}
        account={
          userId
            ? { id: userId, name: form.getFieldValue("username") ?? "" }
            : null
        }
        onClose={() => setDeleteModal(false)}
        onDeleted={() => router.push("/akun")}
      />
    </Card>
  );
};

export default UserForm;
