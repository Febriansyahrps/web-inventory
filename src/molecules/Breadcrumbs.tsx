"use client";

import { LeftCircleFilled } from "@ant-design/icons";
import { Breadcrumb, Button, ConfigProvider } from "antd";
import type { BreadcrumbProps } from "antd";
import { useRouter } from "next/navigation";
import React from "react";

export type BreadcrumbItem = NonNullable<BreadcrumbProps["items"]>[number];

const Breadcrumbs = ({ items, ...rest }: BreadcrumbProps) => {
  const router = useRouter();
  return (
    <ConfigProvider
      theme={{
        components: {},
      }}
    >
      <div className="flex gap-2 items-center">
        <Button
          type="text"
          icon={<LeftCircleFilled />}
          className="px-2!"
          onClick={() => router.back()}
        >
          Kembali
        </Button>
        <Breadcrumb items={items} {...rest} />
      </div>
    </ConfigProvider>
  );
};

export default Breadcrumbs;
