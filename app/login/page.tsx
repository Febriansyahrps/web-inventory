"use client";

import Notification from "@/src/molecules/Notification";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input } from "antd";
import type { FormProps } from "antd";
import Password from "antd/es/input/Password";
import axios from "axios";
import { useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const GOLD = "#A2850F";

type FieldType = {
  username?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinishHandler: FormProps<FieldType>["onFinish"] = async (values) => {
    setLoading(true);
    await axios
      .post("api/login", {
        username: values.username,
        password: values.password,
      })
      .then((response) => {
        if (response.status === 200) {
          Notification({
            type: "success",
            title: "Login Berhasil",
            description: response.data.message,
          });
        }
        Cookies.set("auth-token", response.data.token, { expires: 1 });
        Cookies.set("user-id", response.data.user.id, { expires: 1 });
        Cookies.set("username", response.data.user.username, { expires: 1 });
        Cookies.set("fullname", response.data.user.fullname, { expires: 1 });
        Cookies.set("role", response.data.user.role.id, { expires: 1 });
        router.replace("/");
      })
      .catch((err) => {
        console.log("error", err);
        Notification({
          type: "error",
          title: "Login Gagal",
          description: err.response?.data?.message,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card
        className="w-full max-w-md rounded-2xl shadow-lg"
        styles={{ body: { padding: 40 } }}
      >
        <div className="flex flex-col items-start gap-4 text-start">
          <div className="flex flex-col gap-1 items-start">
            <h1 className="text-2xl font-bold text-gray-900">Selamat Datang</h1>
            <p className="text-sm text-gray-500">
              Sistem Inventaris SMK Tamansiswa Banjarnegara
            </p>
          </div>
        </div>

        <Form onFinish={onFinishHandler}>
          <div className="mt-8 flex flex-col ">
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Mohon masukan username!" }]}
            >
              <Input
                size="large"
                placeholder="Username"
                autoCapitalize="none"
                prefix={<UserOutlined style={{ color: "#9ca3af" }} />}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: "Mohon masukan password!" }]}
            >
              <Password
                size="large"
                placeholder="Password"
                autoCapitalize="none"
                prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
              />
            </Form.Item>
            <Button
              htmlType="submit"
              type="primary"
              size="large"
              className="mt-3 w-full"
              loading={loading}
              style={{ backgroundColor: GOLD, fontWeight: 500 }}
            >
              Masuk
            </Button>
          </div>
        </Form>
      </Card>
    </main>
  );
}
