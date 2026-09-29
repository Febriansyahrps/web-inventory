"use client";

import { useDashboardStore } from "@/store/useDashboardStore";
import { paletteFromPrimary } from "@/src/utils/color";
import { Card, theme } from "antd";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { useRouter } from "next/navigation";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

// Register only what this chart uses so the rest of Chart.js stays tree-shaken.
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const ConditionChartSection = () => {
  const byKeadaan = useDashboardStore((state) => state.by_keadaan);
  const { token } = theme.useToken();
  const router = useRouter();

  const colors = paletteFromPrimary(token.colorPrimary, byKeadaan.length);

  // One bar, stacked: each kondisi is a segment summing to the total barang.
  const data: ChartData<"bar"> = {
    labels: ["Kondisi"],
    datasets: byKeadaan.map((item, i) => ({
      label: item.name,
      data: [item.count],
      backgroundColor: colors[i],
      maxBarThickness: 150,
    })),
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event, elements) => {
      if (!elements.length) return;
      const item = byKeadaan[elements[0].datasetIndex];
      if (item?.id == null) return;
      router.push(`/barang?keadaan=${item.id}`);
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
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  return (
    <Card className="p-4 w-full h-full">
      <h3 className="">Kondisi Barang</h3>
      <div className="mt-4 h-64">
        <Bar data={data} options={options} plugins={[ChartDataLabels]} />
      </div>
    </Card>
  );
};

export default ConditionChartSection;
