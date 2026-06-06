import { AlertTriangle } from "lucide-react";

export default function LateCheckinRanking({ employees = [] }) {
  const getRankStyle = (index) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-red-400 to-rose-500";
      case 1:
        return "bg-gradient-to-r from-orange-400 to-amber-500";
      case 2:
        return "bg-gradient-to-r from-yellow-400 to-amber-400";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-600">Late Check-ins</h2>
          <p className="text-xs text-gray-400 mt-0.5">This month's record</p>
        </div>
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
      </div>

      <div className="space-y-2">
        {employees.length > 0 ? (
          employees.map((emp, index) => (
            <div
              key={index}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 ${index === 0
                  ? 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-100'
                  : 'bg-gray-50 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white ${getRankStyle(index)}`}
                >
                  {index + 1}
                </div>
                <span className={`font-medium text-sm ${index === 0 ? 'text-gray-800' : 'text-gray-600'}`}>
                  {emp.name}
                </span>
              </div>
              <span className={`text-sm font-semibold ${index === 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                {emp.times} times
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No late check-ins recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}
