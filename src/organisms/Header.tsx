import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Dropdown, Modal } from "antd";
import { useEffect, useState } from "react";
import { useCookie } from "../utils/useCookie";
import HeaderSearch from "../molecules/HeaderSearch";
import { useScreenDefine } from "../utils/screenDefine";
import { useLogout } from "../utils/useLogout";
import ProductReportSection from "./ProductReportSection";

const Header = ({
  collapsed,
  onMenuClick,
}: {
  collapsed: boolean;
  onMenuClick: () => void;
}) => {
  // Read auth cookies hydration-safely (server snapshot is undefined).
  const user = useCookie("fullname");
  const role = useCookie("role");
  const [scrollDown, setScrollDown] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const mobileScreen = useScreenDefine(575);
  const logout = useLogout();

  useEffect(() => {
    const handleScroll = () => {
      setScrollDown(window.scrollY > 4);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        className={`px-4 max-[575px]:gap-4 flex justify-between w-full transition-all duration-200 ease-in gap-2 max-[860px]:py-4! ${role === "1" ? "py-1!" : "py-4"} ${scrollDown ? "bg-[#ffffff]! shadow border-none!" : "shadow-none! border-b border-b-[#ffffff]"}`}
      >
        <div className="flex gap-4 w-full items-center">
          <Button
            icon={
              mobileScreen ? (
                <MenuOutlined />
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={onMenuClick}
            className={
              "hidden! max-[575px]:flex! max-[575px]:px-5! min-[1200px]:flex!"
            }
          />
          <HeaderSearch />
        </div>
        <div className="flex gap-4 items-center max-[575px]:hidden!">
          <div className={`flex gap-4 items-center max-[860px]:hidden!`}>
            <ProductReportSection />
          </div>

          <Dropdown
            menu={{
              title: user,
              items: [
                {
                  key: "logout",
                  label: "Logout",
                  icon: <LogoutOutlined />,
                  danger: true,
                },
              ],
              onClick: ({ key }) => {
                if (key === "logout") setLogoutModal(true);
              },
            }}
            trigger={["click"]}
            styles={{ root: { width: 200 } }}
            arrow
            placement="bottomRight"
          >
            <Avatar size="large" style={{ cursor: "pointer" }}>
              {user?.slice(0, 1) || ""}
            </Avatar>
          </Dropdown>
        </div>
      </div>
      <Modal
        open={logoutModal}
        centered
        title="Konfirmasi Logout"
        okText="Keluar"
        cancelText="Batal"
        okButtonProps={{ danger: true }}
        onOk={logout}
        onCancel={() => setLogoutModal(false)}
      >
        Apakah anda ingin keluar?
      </Modal>
    </>
  );
};

export default Header;
