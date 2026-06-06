import { CalendarDays } from "lucide-react";

export default function UpcomingLeave({ leaves = [] }) {
  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (startDate === endDate) {
      return startStr;
    }
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-600">Upcoming Leaves</h2>
          <p className="text-xs text-gray-400 mt-0.5">Approved requests</p>
        </div>
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {leaves.length > 0 ? (
          leaves.map((leave, index) => (
            <div
              key={index}
              className="flex justify-between items-center bg-gray-50 hover:bg-blue-50 rounded-xl px-3 py-2.5 transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">
                    {(leave.employeeName || 'U')[0]}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {leave.employeeName || 'Unknown'}
                </span>
              </div>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-lg">
                {formatDateRange(leave.startDate, leave.endDate)}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No upcoming leaves</p>
          </div>
        )}
      </div>
    </div>
  );
}
