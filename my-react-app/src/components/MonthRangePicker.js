import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import dayjs from "dayjs";

export default function MonthRangePicker({ onChange, initialYear, initialMonth }) {
  const today = dayjs();

  const init = initialYear && initialMonth
    ? dayjs(`${initialYear}-${String(initialMonth).padStart(2, "0")}-01`)
    : today;

  const [current, setCurrent] = useState(init);

  useEffect(() => {
    if (onChange) onChange(current.year(), current.month() + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = current.startOf("month");
  const end = current.endOf("month");

  const formatRange = `${start.format("MMM D")} - ${end.format("MMM D YYYY")}`;

  const updateMonth = (newDate) => {
    setCurrent(newDate);
    if (onChange) onChange(newDate.year(), newDate.month() + 1);
  };

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase">
        DATE RANGE
      </label>

      <div className="flex items-center gap-2 mt-1">

        <div className="flex items-center border rounded-lg px-3 py-2 bg-white shadow-sm min-w-[250px] pr-8 relative">
          <span>{formatRange}</span>
          <FaCalendarAlt className="text-blue-500 absolute right-3" />
        </div>

        <button onClick={() => updateMonth(current.subtract(1, "month"))}
          className="p-2 border rounded-lg bg-white shadow-sm hover:bg-gray-100">
          <FaArrowLeft />
        </button>

        <button onClick={() => updateMonth(current.add(1, "month"))}
          className="p-2 border rounded-lg bg-white shadow-sm hover:bg-gray-100">
          <FaArrowRight />
        </button>

        <button onClick={() => updateMonth(today)}
          className="px-4 py-2 border rounded-lg bg-white shadow-sm hover:bg-gray-100">
          Today
        </button>
      </div>
    </div>
  );
}
