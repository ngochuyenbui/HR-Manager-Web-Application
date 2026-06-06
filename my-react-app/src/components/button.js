import React, { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { FaDownload, FaCheck, FaTimes } from "react-icons/fa";

// Nút chính (Primary)
export const PrimaryButton = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200"
  >
    {text}
  </button>
);

// Nút phụ (Secondary)
export const SecondaryButton = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-sm transition duration-200"
  >
    {text}
  </button>
);

// Nút có icon (IconButton)
export const IconButton = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-md transition duration-200"
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </button>
);

// Nút Dropdown (DropdownButton)
export const DropdownButton = ({ label, options }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-md transition duration-200"
      >
        {label}
        <FaChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.onClick();
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

//Button cho page Time Tracking
export default function TrackingButtons() {
  return (
    <div className="flex gap-2">
      {/* Download Button */}
      <button
        className="flex items-center rounded-sm gap-2 px-4 w-[131px] h-[44px] bg-orange-100 text-orange-600 
                   text-[16px] font-medium rounded-lg hover:bg-orange-100 
                   transition-all"
      >
        <FaDownload className="text-sm" />
        Download
      </button>

      {/* Reject Button */}
      <button className="flex items-center gap-2 px-4 w-[106px] h-[44] rounded-sm bg-red-600 text-white font-medium hover:bg-red-700 transition-all">
        <FaTimes className="text-sm" />
        Reject
      </button>

      {/* Approve Button */}
      <button className="flex items-center gap-2 px-4 rounded-sm bg-green-500 text-white font-medium hover:bg-green-600 transition-all">
        <FaCheck className="text-sm" />
        Approve
      </button>
    </div>
  );
};

