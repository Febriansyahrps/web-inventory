"use client";

import { useDashboardStore } from "@/store/useDashboardStore";
import { paletteFromPrimary } from "@/src/utils/color";
import { Card, theme } from "antd";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { useRouter } from "next/navigation";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register only what the pie chart uses.
ChartJS.register(ArcElement, Tooltip, Legend);

const OriginSourceChartSection = () => {
  const byAsal = useDashboardStore((state) => state.by_asal);
  const { token } = theme.useToken();
  const router = useRouter();

  const data: ChartData<"pie"> = {
    labels: byAsal.map((item) => item.name),
    datasets: [
      {
        label: "Jumlah Barang tercatat",
        data: byAsal.map((item) => item.count),
        backgroundColor: paletteFromPrimary(token.colorPrimary, byAsal.length),
        borderWidth: 1,
        borderColor: "#ffffff",
      },
    ],
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event, elements) => {
      if (!elements.length) return;
      const item = byAsal[elements[0].index];
      if (item?.id == null) return;
      router.push(`/barang?asal_barang=${item.id}`);
    },
    onHover: (event, elements) => {
      const target = event.native?.target as HTMLElement | null;
      if (target) target.style.cursor = elements.length ? "pointer" : "default";
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, usePointStyle: true },
      },
      datalabels: {
        color: "#ffffff",
        font: { weight: "bold", size: 12 },
        anchor: "center",
        align: "center",
        clamp: true,
      },
    },
  };

  return (
    <Card className="p-4 w-full h-full">
      <h3 className="">Asal Barang</h3>
      <div className="mt-4 h-64">
        <Pie data={data} options={options} plugins={[ChartDataLabels]} />
      </div>
    </Card>
  );
};

export default OriginSourceChartSection;
