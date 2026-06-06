import { Trophy } from "lucide-react";

export default function RankTimeWorking({ employees = [] }) {
  const sampleData = [
    { name: "No data available", hours: 0 },
  ];

  const data = employees.length > 0 ? employees : sampleData;
  const sorted = [...data].sort((a, b) => b.hours - a.hours).slice(0, 5);

  const getRankStyle = (index) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-400 to-amber-500 shadow-amber-200";
      case 1:
        return "bg-gradient-to-r from-gray-300 to-gray-400 shadow-gray-200";
      case 2:
        return "bg-gradient-to-r from-amber-600 to-orange-700 shadow-orange-200";
      default:
        return "bg-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-600">Top Workers</h2>
          <p className="text-xs text-gray-400 mt-0.5">This month's hours</p>
        </div>
        <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
          <Trophy className="text-yellow-500 w-5 h-5" />
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((emp, index) => (
          <div
            key={index}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 ${index === 0
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100'
                : 'bg-gray-50 hover:bg-gray-100'
              }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${getRankStyle(index)}`}
              >
                {index + 1}
              </span>
              <span className={`font-medium ${index === 0 ? 'text-gray-800' : 'text-gray-600'} text-sm`}>
                {emp.name}
              </span>
            </div>
            <div className={`text-sm font-semibold ${index === 0 ? 'text-amber-600' : 'text-gray-500'}`}>
              {emp.hours} hrs
            </div>
          </div>
        ))}

        {employees.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">
            No timesheet data available
          </p>
        )}
      </div>
    </div>
  );
}
