"use client";

import React, { useEffect } from "react";
import { App } from "antd";
import type { NotificationInstance } from "antd/es/notification/interface";

type NotificationType = "success" | "info" | "warning" | "error";

interface NotificationProps {
  type?: NotificationType;
  title: string;
  description?: string;
  placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}

let notificationApi: NotificationInstance | null = null;

const Notification = ({
  type = "success",
  title,
  description,
  placement = "topRight",
}: NotificationProps) => {
  notificationApi?.[type]({
    title,
    description,
    placement,
  });
};

const NotificationBridge = ({ children }: React.PropsWithChildren) => {
  const { notification } = App.useApp();

  useEffect(() => {
    notificationApi = notification;
  }, [notification]);

  return <>{children}</>;
};

export const NotificationProvider = ({ children }: React.PropsWithChildren) => {
  return (
    <App>
      <NotificationBridge>{children}</NotificationBridge>
    </App>
  );
};

export default Notification;
