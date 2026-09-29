"use client";

import React, { useState } from "react";
import { Drawer, Layout } from "antd";
import Sidebar from "../organisms/Sidebar";
import Header from "../organisms/Header";
import Footer from "../organisms/Footer";
import { useScreenDefine } from "@/src/utils/screenDefine";

const { Header: HeaderLayout, Sider, Content } = Layout;

const MainLayout = ({ children }: React.PropsWithChildren) => {
  const tabScreen = useScreenDefine(1200);
  const mobileScreen = useScreenDefine(575);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prevTabScreen, setPrevTabScreen] = useState(tabScreen);
  const [prevMobileScreen, setPrevMobileScreen] = useState(mobileScreen);

  if (tabScreen !== prevTabScreen) {
    setPrevTabScreen(tabScreen);
    if (!tabScreen) setCollapsed(false);
  }

  if (mobileScreen !== prevMobileScreen) {
    setPrevMobileScreen(mobileScreen);
    if (!mobileScreen) setDrawerOpen(false);
  }

  const isCollapsed = tabScreen || collapsed;

  const handleMenuClick = () => {
    if (mobileScreen) setDrawerOpen(true);
    else setCollapsed(!collapsed);
  };

  return (
    <Layout>
      <Sider
        style={{
          overflow: "auto",
          height: "100vh",
          position: "sticky",
          insetInlineStart: 0,
          top: 0,
          scrollbarWidth: "thin",
          scrollbarGutter: "stable",
          background: "#fff",
          zIndex: 100,
          borderRight: "2px solid #F2EDE3",
          display: mobileScreen ? "none" : "block",
        }}
        trigger={null}
        collapsible
        collapsed={isCollapsed}
        breakpoint="md"
        width={250}
      >
        <Sidebar collapsed={isCollapsed} />
      </Sider>
      <Layout>
        <HeaderLayout
          style={{
            position: "sticky",
            top: 0,
            width: "100%",
            display: "flex",
            alignItems: "center",
            background: "transparent",
            padding: 0,
            zIndex: 100,
            height: "auto",
          }}
        >
          <Header collapsed={isCollapsed} onMenuClick={handleMenuClick} />
        </HeaderLayout>
        <Content className="p-4 max-[575px]:p-3!">{children}</Content>
        <Footer />
      </Layout>
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closable={false}
        size={250}
        styles={{ body: { padding: 0 } }}
      >
        <Sidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
    </Layout>
  );
};
export default MainLayout;
