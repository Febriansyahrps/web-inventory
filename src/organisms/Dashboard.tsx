"use client";

import CategoryChartSection from "@/src/organisms/Dashboard/CategoryChartSection";
import ConditionChartSection from "@/src/organisms/Dashboard/ConditionChartSection";
import DashboardKPISection from "@/src/organisms/Dashboard/DashboardKPISection";
import OriginSourceChartSection from "@/src/organisms/Dashboard/OriginChartSection";
import RecentAddedSection from "@/src/organisms/Dashboard/RecentAddedSection";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Col, Row } from "antd";
import { useEffect } from "react";
import ProductReportSection from "./ProductReportSection";

const Dashboard = () => {
  const fetchDashboard = useDashboardStore((state) => state.fetchDashboard);

  // One fetch for the whole dashboard; the sections below just read the store.
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div>
      <div className="min-[860px]:hidden flex max-[575px]:flex-col-reverse! gap-4 max-[575px]:gap-3 pt-4 justify-end">
        <ProductReportSection isDashboard={true} />
      </div>
      <DashboardKPISection />
      <Row
        gutter={[
          { sm: 16, xs: 12 },
          { sm: 16, xs: 12 },
        ]}
        className="mt-4"
      >
        <Col md={12} xs={24}>
          <CategoryChartSection />
        </Col>
        <Col md={12} xs={24}>
          <OriginSourceChartSection />
        </Col>
        <Col lg={8} md={10} xs={24}>
          <ConditionChartSection />
        </Col>
        <Col lg={16} md={14} xs={24}>
          <RecentAddedSection />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
