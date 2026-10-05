import { Divider, Image, Menu, Modal } from "antd";
import React, { useState } from "react";
import {
  DashboardOutlined,
  HistoryOutlined,
  LogoutOutlined,
  ProductOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useCookie } from "../utils/useCookie";
import { useLogout } from "../utils/useLogout";
import Link from "next/link";

const Sidebar = ({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const role = useCookie("role");
  const logout = useLogout();
  const [logoutModal, setLogoutModal] = useState(false);

  // Keep the active item in sync with the route, including sub-routes
  // (e.g. /barang/tambah → "/barang", /akun/34 → "/akun").
  const selectedKey =
    pathname === "/"
      ? "/"
      : (["/barang", "/akun", "/riwayat", "/backup"].find((key) =>
          pathname.startsWith(key),
        ) ?? "");

  const confirmLogout = () => {
    setLogoutModal(false);
    logout();
    onNavigate?.();
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="ps-3 pt-4 ">
        <Link href={"/"}>
          <div className="flex gap-2 items-center">
            <Image
              src="/assets/SMK Tamansiswa Banjarnegara.png"
              alt="SMK Tamansiswa Banjarnegara"
              width={50}
              preview={false}
            />
            {!collapsed && (
              <p className="font-medium text-black">
                SMK Tamansiswa Banjarnegara
              </p>
            )}
          </div>
        </Link>
      </div>
      <Divider className="my-3! " />
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={() => onNavigate?.()}
        styles={{ root: { border: 0 } }}
        className="pl-2!"
        items={[
          {
            key: "/",
            icon: <DashboardOutlined />,
            label: "Dashboard",
            onClick: () => {
              router.push("/");
            },
          },
          {
            key: "/barang",
            icon: <ProductOutlined />,
            label: "Barang",
            onClick: () => {
              router.push("/barang");
            },
          },
          {
            key: "/akun",
            icon: <UserOutlined />,
            label: "Kelola Akun",
            onClick: () => {
              router.push("/akun");
            },
          },
          {
            key: "/riwayat",
            icon: <HistoryOutlined />,
            label: "Riwayat Aktivitas",
            onClick: () => {
              router.push("/riwayat");
            },
            className: role === "1" ? "" : "hidden!",
          },
          {
            key: "/backup",
            icon: <SaveOutlined />,
            label: "Backup Data",
            onClick: () => {
              router.push("/backup");
            },
            className: role === "1" ? "" : "hidden!",
          },
        ]}
      />
      <div className="mt-auto pb-4">
        <Menu
          theme="light"
          mode="inline"
          selectable={false}
          styles={{ root: { border: 0 } }}
          className="pl-2!"
          items={[
            {
              key: "bantuan",
              icon: <QuestionCircleOutlined />,
              label: "Bantuan",
              onClick: () =>
                window.open(
                  role === "1"
                    ? "https://drive.google.com/file/d/1RrXeaHKVJAmOGltmnV5ZLp771iHW7zUL/view?usp=sharing"
                    : "https://drive.google.com/file/d/1Mnv-0EIYCIOPJhuxZe-cW-obL2dyc8h4/view?usp=sharing",
                  "_blank",
                ),
            },
            {
              key: "logout",
              icon: <LogoutOutlined />,
              label: "Logout",
              danger: true,
              onClick: () => setLogoutModal(true),
            },
          ]}
        />
      </div>
      <Modal
        open={logoutModal}
        centered
        title="Konfirmasi Logout"
        okText="Keluar"
        cancelText="Batal"
        okButtonProps={{ danger: true }}
        onOk={confirmLogout}
        onCancel={() => setLogoutModal(false)}
      >
        Apakah anda ingin keluar?
      </Modal>
    </div>
  );
};

export default Sidebar;
