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

const CategoryChartSection = () => {
  const byCategory = useDashboardStore((state) => state.by_category);
  const { token } = theme.useToken();
  const router = useRouter();

  const data: ChartData<"bar"> = {
    labels: byCategory.map((item) => item.name),
    datasets: [
      {
        label: "Jumlah Barang tercatat",
        data: byCategory.map((item) => item.count),
        backgroundColor: paletteFromPrimary(
          token.colorPrimary,
          byCategory.length,
        ),
        borderRadius: 4,
        maxBarThickness: 100,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event, elements) => {
      if (!elements.length) return;
      const item = byCategory[elements[0].index];
      if (item?.id == null) return;
      router.push(`/barang?kategori=${item.id}`);
    },
    onHover: (event, elements) => {
      const target = event.native?.target as HTMLElement | null;
      if (target) target.style.cursor = elements.length ? "pointer" : "default";
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        color: "#ffffff",
        font: { weight: "bold", size: 12 },
        anchor: "center",
        align: "center",
        clamp: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <Card className="p-4 w-full h-full">
      <h3 className="">Kategori Barang</h3>
      <div className="mt-4 h-64">
        <Bar data={data} options={options} plugins={[ChartDataLabels]} />
      </div>
    </Card>
  );
};

export default CategoryChartSection;
