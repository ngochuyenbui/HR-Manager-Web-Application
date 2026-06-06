import React from "react";
import dayjs from "dayjs";

export default function TimesheetDetailModal({ isOpen, onClose, day, employee }) {
  if (!isOpen || !day || !employee) return null;

  const dayData = day.data;
  const dateObj = dayjs(day.date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{employee.employeeName}</h2>
            <p className="text-sm opacity-90">{dateObj.format("dddd, D MMMM YYYY")}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-light hover:text-gray-200"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning for incomplete logs */}
          {dayData.incomplete && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ Thiếu dữ liệu: Có lần check-in mà không có check-out tương ứng. Vui lòng bổ sung dữ liệu.
              </p>
            </div>
          )}

          {/* Summary */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 uppercase mb-1">First In</div>
              <div className="text-2xl font-bold text-blue-600">{dayData.firstIn}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 uppercase mb-1">Last Out</div>
              <div className="text-2xl font-bold text-blue-600">{dayData.lastOut}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 uppercase mb-1">Total Hours (Shift)</div>
              <div className="text-2xl font-bold text-green-600">
                {dayData.logs
                  ? dayData.logs.reduce((sum, log) => sum + log.hours, 0).toFixed(2)
                  : "0.00"} h
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 uppercase mb-1">OT Hours</div>
              <div className="text-2xl font-bold text-orange-600">
                {dayData.logs
                  ? dayData.logs.reduce((sum, log) => sum + (log.otHours || 0), 0).toFixed(2)
                  : "0.00"} h
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 uppercase mb-1">Work Days</div>
              <div className="text-2xl font-bold text-purple-600">
                {dayData.workDays !== undefined ? dayData.workDays.toFixed(2) : "0.00"}
              </div>
              {dayData.status && (
                <div className="mt-2">
                  {dayData.status === 'FULL' && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">✓ Full Day</span>
                  )}
                  {dayData.status === 'LATE' && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">⚠ Late/Early</span>
                  )}
                  {dayData.status === 'HALF_DAY' && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">◐ Half Day</span>
                  )}
                  {dayData.status === 'ABSENT' && (
                    <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">✗ Absent</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Logs Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Check-in/Check-out Log (Áp dụng Shift Trimming 8h-12h, 13h-17h)</h3>
            {dayData.logs && dayData.logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">Session</th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">Check In</th>
                      <th className="px-4 py-2 text-left text-gray-600 font-medium">Check Out</th>
                      <th className="px-4 py-2 text-center text-gray-600 font-medium">Hours (Shift)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayData.logs.map((log, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">Session {idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-green-50 text-green-700 rounded px-3 py-1 font-medium">
                            {log.checkIn}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-red-50 text-red-700 rounded px-3 py-1 font-medium">
                            {log.checkOut}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-blue-600">
                          {log.hours.toFixed(2)}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No check-in/check-out records</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
