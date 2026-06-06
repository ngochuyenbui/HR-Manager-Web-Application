import { UserX } from 'lucide-react';

export default function TodayAbsent({ count = 0 }) {
    return (
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-sm border border-red-100 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-600">
                    Today Absent
                </h2>
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <UserX className="w-5 h-5 text-red-500" />
                </div>
            </div>
            <div className="mt-4">
                <h2 className="text-4xl font-bold text-gray-800">{count}</h2>
                <p className="text-xs text-red-500 mt-1 font-medium">not checked in yet</p>
            </div>
        </div>
    );
}
