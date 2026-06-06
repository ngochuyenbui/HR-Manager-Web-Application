import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { TrendingUp } from "lucide-react";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

export default function PayrollCost({ data: monthlyData = [] }) {
  // Format currency for Vietnam Dong
  const formatCurrency = (value) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const labels = monthlyData.length > 0
    ? monthlyData.map(d => d.label)
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  const grossData = monthlyData.length > 0
    ? monthlyData.map(d => d.gross / 1000000) // Convert to millions
    : [0, 0, 0, 0, 0, 0];

  const netData = monthlyData.length > 0
    ? monthlyData.map(d => d.net / 1000000) // Convert to millions
    : [0, 0, 0, 0, 0, 0];

  // Calculate totals for current month
  const currentMonthGross = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.gross || 0 : 0;
  const currentMonthNet = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1]?.net || 0 : 0;

  const chartData = {
    labels,
    datasets: [
      {
        label: "Gross Salary",
        data: grossData,
        fill: true,
        borderColor: "#6366F1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        pointBackgroundColor: "#6366F1",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Net Salary",
        data: netData,
        fill: true,
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          padding: 20,
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12 }
        },
      },
      tooltip: {
        backgroundColor: "#1F2937",
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}M VND`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          color: '#9CA3AF'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `${value}M`,
          font: { size: 11 },
          color: '#9CA3AF'
        },
        grid: {
          color: "#F3F4F6",
          drawBorder: false,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Payroll Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Monthly salary distribution</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">This Month Gross</p>
            <p className="text-lg font-bold text-indigo-600">{formatCurrency(currentMonthGross)} ₫</p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
