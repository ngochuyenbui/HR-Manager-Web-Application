import { UserCheck } from 'lucide-react';

export default function TodayPresent({ count = 0 }) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl shadow-sm border border-emerald-100 p-5 hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-600">
          Today Present
        </h2>
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-emerald-600" />
        </div>
      </div>
      <div className="mt-4">
        <h2 className="text-4xl font-bold text-gray-800">{count}</h2>
        <p className="text-xs text-emerald-600 mt-1 font-medium">employees checked in</p>
      </div>
    </div>
  );
}
