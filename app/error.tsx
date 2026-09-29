"use client";

import StatusResult from "@/src/molecules/StatusResult";
import { Button } from "antd";

// Route error boundary — renders for unexpected errors (the "500" case).
export default function Error({ reset }: { reset: () => void }) {
  return (
    <StatusResult
      status="500"
      extra={
        <Button type="primary" onClick={() => reset()}>
          Coba Lagi
        </Button>
      }
    />
  );
}
