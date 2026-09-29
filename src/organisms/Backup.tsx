"use client";

import React from "react";
import { Card, Divider } from "antd";
import ExportBackup from "./Backup/ExportBackup";
import ImportBackup from "./Backup/ImportBackup";

const Backup = () => {
  return (
    <Card className="w-full! mt-4!">
      <ExportBackup />
      <Divider />
      <ImportBackup />
    </Card>
  );
};

export default Backup;
