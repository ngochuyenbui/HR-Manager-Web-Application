import React, { useState } from "react";
import dayjs from "dayjs";
import TimesheetDetailModal from "../TimesheetDetailModal";

export default function TimeTrackingTable({ rows, days }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDayClick = (employee, day) => {
    const dayData = employee.days[day];
    if (dayData) {
      setSelectedDay({ date: day, data: dayData });
      setSelectedEmployee(employee);
      setIsModalOpen(true);
    }
  };

  // Helper function to format time display
  // Handles both old format (string "HH:MM-HH:MM") and new format (object with firstIn/lastOut)
  const getTimeDisplay = (dayData) => {
    if (!dayData) return "-";
    
    // New format: object with firstIn/lastOut
    if (dayData.firstIn && dayData.lastOut) {
      return `${dayData.firstIn} - ${dayData.lastOut}`;
    }
    
    // Old format: string "HH:MM-HH:MM"
    if (typeof dayData === 'string') {
      return dayData;
    }
    
    return "-";
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-scroll">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-500 text-xs uppercase">
              <th className="p-3 text-left">Employee Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Total Hours</th>
              <th className="p-3 text-left">Overtime</th>
              <th className="p-3 text-left">Work Days</th>

              {days.map((d) => (
                <th key={d} className="p-3 text-center">
                  {dayjs(d).format("D MMM")}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 font-medium">{row.employeeName}</td>
                <td className="p-3">
                  <span className="inline-block bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-xs font-medium">
                    {row.employeeType === 'Fulltime' ? 'Full time' : row.employeeType}
                  </span>
                </td>
                <td className="p-3">{row.totalHours ? row.totalHours.toFixed(2) : '0.00'} h</td>
                <td className="p-3">{row.totalOvertime ? row.totalOvertime.toFixed(2) : '0.00'} h</td>
                <td className="p-3 font-semibold text-green-600">
                  {row.totalWorkDays ? row.totalWorkDays.toFixed(2) : '0.00'} days
                </td>

                {days.map((d) => {
                  const dayData = row.days[d];
                  const timeDisplay = getTimeDisplay(dayData);
                  const isNewFormat = dayData && typeof dayData === 'object' && dayData.firstIn;
                  
                  return (
                    <td 
                      key={d} 
                      className="p-3 text-center"
                    >
                      {dayData ? (
                        <button
                          onClick={() => isNewFormat && handleDayClick(row, d)}
                          className={isNewFormat ? "text-blue-600 hover:text-blue-800 hover:underline cursor-pointer" : "text-gray-600 cursor-default"}
                          title={isNewFormat ? "Click để xem chi tiết" : ""}
                        >
                          {timeDisplay}
                        </button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Timesheet Detail Modal */}
      <TimesheetDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        day={selectedDay}
        employee={selectedEmployee}
      />
    </>
  );
}
