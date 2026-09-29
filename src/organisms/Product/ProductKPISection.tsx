"use client";

import AnimatedNumber from "@/src/molecules/AnimatedNumber";
import { useProductStore } from "@/store/useProductStore";
import { Card, Col, Row } from "antd";

const ProductKPISection = () => {
  const totalProduct = useProductStore((state) => state.totalProduct);
  const totalStock = useProductStore((state) => state.totalStock);
  const totalAssetValue = useProductStore((state) => state.totalAssetValue);

  return (
    <Row
      gutter={[
        { lg: 16, md: 8, sm: 8, xs: 8 },
        { lg: 16, md: 8, sm: 8, xs: 8 },
      ]}
      className="mt-6 max-[575px]:mt-4! h-full "
    >
      <Col lg={8} md={7} xs={8}>
        <Card
          className=" w-full h-full"
          classNames={{ body: "xl:p-4! py-2! px-3!" }}
        >
          <div>
            <h3 className="xl:text-[14px] text-[12px]">
              Total Barang Tercatat
            </h3>
            <p className="xl:text-3xl xl:mt-1 text-[16px] font-medium">
              <AnimatedNumber value={totalProduct} />
            </p>
          </div>
        </Card>
      </Col>
      <Col lg={8} md={7} xs={8}>
        <Card
          className=" w-full h-full"
          classNames={{ body: "xl:p-4! py-2! px-3!" }}
        >
          <div>
            <h3 className="xl:text-[14px] text-[12px]">Total Stok Barang</h3>
            <p className="xl:text-3xl text-[16px] xl:mt-1 font-medium">
              <AnimatedNumber value={totalStock} />
            </p>
          </div>
        </Card>
      </Col>
      <Col lg={8} md={10} xs={8}>
        <Card
          className="w-full h-full"
          classNames={{ body: "xl:p-4! py-2! px-3!" }}
        >
          <div className="h-full">
            <h3 className="xl:text-[14px] text-[12px]">Total Nilai Aset</h3>
            <p className="xl:text-2xl text-[16px] xl:mt-1 font-medium">
              Rp <AnimatedNumber value={totalAssetValue} />
            </p>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default ProductKPISection;
