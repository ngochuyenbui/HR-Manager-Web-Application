import { UserMinus } from 'lucide-react';

export default function TodayLeave({ count = 0 }) {
    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-100 p-5 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-600">
                    On Leave
                </h2>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <UserMinus className="w-5 h-5 text-amber-600" />
                </div>
            </div>
            <div className="mt-4">
                <h2 className="text-4xl font-bold text-gray-800">{count}</h2>
                <p className="text-xs text-amber-600 mt-1 font-medium">approved leaves today</p>
            </div>
        </div>
    );
}
