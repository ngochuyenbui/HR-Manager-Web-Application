// // import React from "react";
// // import TimeTrackingFilters from "../components/Filters";
// // import TimeTrackingTable from "../components/Table/TimeTrackingTable";
// // //import Pagination from "../components/Pagination";
// // //import TrackingButtons from "../components/button"
// // import WeekRangePicker from "../components/WeekRangePicker";
// // const sampleRows = [
// //   {
// //     id: 1,
// //     checked: true,
// //     initials: "RW",
// //     avatarColor: "bg-purple-500",
// //     name: "Ryan Walker",
// //     employeeType: "Full time",
// //     totalWork: "100h | 128h",
// //     overtime: "0h",
// //     status: "Approved",
// //     d11: "8h",
// //     d12: "7h",
// //     d13: "7h",
// //     d14: "8h"
// //   },
// //   // thêm nhiều row khác nếu muốn
// // ];


// // export default function TimeTracking() {
// //   return (
// //     <div className="p-6">
// //         {/* Row: Title + Center Tabs + Buttons */}
// //         <div className="relative flex items-center justify-between mb-8">

// //         {/* LEFT — Title */}
// //         <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">
// //             Time Tracking
// //         </h2>

// //         {/* CENTER — Tabs (absolute center) */}
// //         <div className="absolute left-1/2 -translate-x-1/2">
// //             <div className="flex items-center gap-6 text-sm font-medium">
// //             <button className="text-blue-600 border-b-2 border-blue-600 pb-1">
// //                 Time Tracking
// //             </button>

// //             <button className="text-gray-500 hover:text-gray-700 pb-1">
// //                 Time-off request
// //             </button>
// //             </div>
// //         </div>
// //     </div>
// //         {/* Week Filter */}
// //         <div className="px-3 mb-4">
// //         <WeekRangePicker />
// //         </div>


// //         {/* RIGHT — Action Buttons
// //         <div className="flex justify-end mb-4"> <TrackingButtons /> </div> */}

// //         {/*Clear All Filters */}
// //         <div className="flex justify-end items-center px-3">
// //             <button className="text-gray-500 text-sm hover:underline">Clear filters</button>
// //         </div>
        

// //         {/*Filter Bar*/}
// //         <div>
// //             <div className="px-3">
// //                 <TimeTrackingFilters />
// //             </div>
            
// //             <div className="px-3">
// //                 <TimeTrackingTable rows={sampleRows} />
// //             </div>
// //         </div>
// //     </div>
    
// //   );
// // }


// import React, { useEffect, useState } from "react";
// import TimeTrackingFilters from "../components/Filters";
// import TimeTrackingTable from "../components/Table/TimeTrackingTable";
// import WeekRangePicker from "../components/WeekRangePicker";

// export default function TimeTracking() {
//   const [rows, setRows] = useState([]);
//   const [days, setDays] = useState([]); // dùng để tạo cột động

//   useEffect(() => {
//     async function loadData() {
//       const year = 2025;
//       const month = 12;

//       const res = await fetch(
//         `http://localhost:8080/api/timesheets/month-view?year=${year}&month=${month}`
//       );

//       const data = await res.json();
//       console.log("DATA FROM API:", data);

//       // build danh sách các ngày từng cột
//       if (data.length > 0) {
//         const first = data[0];
//         const dayKeys = Object.keys(first.days);
//         setDays(dayKeys);
//       }

//       setRows(Array.isArray(data) ? data : [data]);

//     }

//     loadData();
//   }, []);

//   return (
//     <div className="p-6">
//       {/* HEADER */}
//       <div className="relative flex items-center justify-between mb-8">
//         <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">
//           Time Tracking
//         </h2>

//         {/* Tabs */}
//         <div className="absolute left-1/2 -translate-x-1/2">
//           <div className="flex items-center gap-6 text-sm font-medium">
//             <button className="text-blue-600 border-b-2 border-blue-600 pb-1">
//               Time Tracking
//             </button>
//             <button className="text-gray-500 hover:text-gray-700 pb-1">
//               Time-off request
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* WEEK PICKER */}
//       <div className="px-3 mb-4">
//         <WeekRangePicker />
//       </div>

//       {/* CLEAR FILTERS */}
//       <div className="flex justify-end items-center px-3">
//         <button className="text-gray-500 text-sm hover:underline">
//           Clear filters
//         </button>
//       </div>

//       {/* TABLE */}
//       <div className="px-3">
//         <TimeTrackingTable rows={rows} days={days} />
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FaSearch } from 'react-icons/fa';
// import TimeTrackingFilters from "../components/Filters";
import TimeTrackingTable from "../components/Table/TimeTrackingTable";
import WeekRangePicker from "../components/MonthRangePicker";
import TimeOffTable from "../components/Table/TimeOffTable"; // ⭐ thêm mới

export default function TimeTracking() {
  const [activeTab, setActiveTab] = useState("tracking"); // ⭐ tab hiện tại
  const [rows, setRows] = useState([]);
  const [days, setDays] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  // default to Nov 2025 as requested
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(11);

  useEffect(() => {
    if (activeTab !== "tracking") return; // only load when tracking tab active

    async function loadData(year, month) {
      // build full month day keys from selected year/month so table columns match filter
      const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
      const end = start.endOf('month');
      const keys = [];
      let d = start;
      while (d.isBefore(end) || d.isSame(end, 'day')) {
        keys.push(d.format('YYYY-MM-DD'));
        d = d.add(1, 'day');
      }

      // set days up-front so table shows columns even when API fails
      setDays(keys);

      try {
        const res = await fetch(
          `http://localhost:5000/api/timesheets/month-view?year=${year}&month=${month}`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        console.log("DATA FROM API:", data);

        setRows(Array.isArray(data) ? data : (data ? [data] : []));
      } catch (e) {
        console.error('Failed to load timesheet data', e);
        setRows([]);
      }
    }      loadData(selectedYear, selectedMonth);
  }, [activeTab, selectedYear, selectedMonth]); // reload when tab or selected month change

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="relative flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-900 whitespace-nowrap">
          Time Tracking
        </h2>

        {/* Tabs */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-6 text-sm font-medium">
            <button
              className={
                activeTab === "tracking"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : "text-gray-500 hover:text-gray-700 pb-1"
              }
              onClick={() => setActiveTab("tracking")}
            >
              Time Tracking
            </button>

            <button
              className={
                activeTab === "timeoff"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : "text-gray-500 hover:text-gray-700 pb-1"
              }
              onClick={() => setActiveTab("timeoff")}
            >
              Time-off request
            </button>
          </div>
        </div>
      </div>

      {/* WEEK PICKER - chỉ hiển thị trong Time Tracking */}
      {activeTab === "tracking" && (
        <>
          <div className="px-3 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <WeekRangePicker
                  initialYear={selectedYear}
                  initialMonth={selectedMonth}
                  onChange={(year, month) => {
                    setSelectedYear(year);
                    setSelectedMonth(month);
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search employee name"
                    className="border rounded-lg pl-10 pr-3 py-2 shadow-sm w-full text-sm"
                  />
                </div>

                <button
                  onClick={() => { setSearchTerm(""); }}
                  className="text-gray-500 text-sm hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Time Tracking Table */}
          <div className="px-3">
            {
              // apply client-side search filter (case-insensitive)
            }
            <TimeTrackingTable
              rows={rows.filter(r => !searchTerm || (r.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()))}
              days={days}
            />
          </div>
        </>
      )}

      {/* TIME OFF REQUEST VIEW */}
      {activeTab === "timeoff" && (
        <div className="px-3">
          <TimeOffTable />
        </div>
      )}
    </div>
  );
}
