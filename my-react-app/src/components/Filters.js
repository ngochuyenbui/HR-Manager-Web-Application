import React from "react";

export default function TimeTrackingFilters() {
  return (
    <div className="flex flex-wrap gap-3 justify-between items-center mb-5">
      <input
        type="text"
        placeholder="🔍 Search"
        className="border px-3 py-2 rounded-md w-64"
      />
      <div className="flex flex-wrap gap-3">
        {["All Offices", "All Departments", "All Status", "All Employment Type"].map((label) => (
          <select key={label} className="border px-3 py-2 rounded-md">
            <option>{label}</option>
          </select>
        ))}
      </div>
    </div>
  );
}
