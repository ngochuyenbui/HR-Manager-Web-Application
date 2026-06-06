import React from "react";

export default function StatusBadge({ status }) {
  let colorClass = "";

  switch (status) {
    case "Approved":
      colorClass = "bg-green-100 text-green-800";
      break;
    case "Pending":
      colorClass = "bg-yellow-100 text-yellow-800";
      break;
    case "Rejected":
      colorClass = "bg-red-100 text-red-800";
      break;
    default:
      colorClass = "bg-gray-100 text-gray-800";
  }

  return (
    <span
      className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${colorClass}`}
    >
      {status}
    </span>
  );
}
