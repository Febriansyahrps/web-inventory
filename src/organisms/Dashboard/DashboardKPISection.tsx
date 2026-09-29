"use client";

import AnimatedNumber from "@/src/molecules/AnimatedNumber";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Card, Col, Row } from "antd";

const DashboardKPISection = () => {
  const totalProduct = useDashboardStore((state) => state.total_product);
  const totalStock = useDashboardStore((state) => state.total_stock);
  const totalAssetValue = useDashboardStore((state) => state.total_asset_value);

  return (
    <Row 
        gutter={[
          { sm: 16, xs: 12 },
          { sm: 16, xs: 12 },
        ]}className="mt-6 h-full">
      <Col lg={8} md={7} xs={12}>
        <Card className="p-4 w-full h-full">
          <div>
            <h3 className="">Total Barang Tercatat</h3>
            <p className="text-4xl mt-2  font-medium">
              <AnimatedNumber value={totalProduct} />
            </p>
          </div>
        </Card>
      </Col>
      <Col lg={8} md={7} xs={12}>
        <Card className="p-5 w-full h-full">
          <div>
            <h3 className="">Total Stok Barang</h3>
            <p className="text-4xl mt-2 font-medium">
              <AnimatedNumber value={totalStock} />
            </p>
          </div>
        </Card>
      </Col>
      <Col lg={8} md={10} xs={24}>
        <Card className="p-5 w-full h-full">
          <div className="h-full">
            <h3 className="">Total Nilai Aset</h3>
            <p className="text-3xl mt-2 font-medium">
              Rp <AnimatedNumber value={totalAssetValue} />
            </p>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardKPISection;
