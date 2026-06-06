import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Users } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function TotalEmployees({ total = 0, fulltime = 0 }) {
  const freelance = total - fulltime;
  const fulltimePercent = total > 0 ? (fulltime / total) * 100 : 0;
  const freelancePercent = total > 0 ? (freelance / total) * 100 : 0;

  const data = {
    labels: ["Fulltime", "Freelance"],
    datasets: [
      {
        data: [fulltimePercent, freelancePercent],
        backgroundColor: ["#6366F1", "#A5B4FC"],
        borderWidth: 0,
        cutout: "70%",
      },
    ],
  };

  const options = {
    rotation: -90,
    circumference: 180,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-600">
          Total Employees
        </h2>
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Users className="w-5 h-5 text-indigo-600" />
        </div>
      </div>

      <div className="relative w-44 h-44 flex justify-center mx-auto items-center mt-2">
        <Doughnut data={data} options={options} />
        <div className="absolute text-center top-1/2 transform -translate-y-1/4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-800">
            {fulltime}
            <span className="text-gray-400 text-lg">/{total}</span>
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
          <span className="text-xs text-gray-600">Fulltime</span>
          <span className="text-xs font-bold text-gray-800">
            {fulltimePercent.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-300"></span>
          <span className="text-xs text-gray-600">Freelance</span>
          <span className="text-xs font-bold text-gray-800">
            {freelancePercent.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
