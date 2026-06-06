import React from 'react';
import { FaPlus } from 'react-icons/fa';

export default function HeaderTabs({ title = 'Time Tracking', active = 'team', onTabChange }) {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
          <nav className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
            <button className={`pb-2 ${active === 'team' ? 'text-indigo-600 font-medium border-b-2 border-indigo-600' : ''}`} onClick={() => onTabChange?.('team')} aria-current={active === 'team' ? 'page' : undefined}>Time Tracking</button>
            <button className={`pb-2 ${active === 'payroll' ? 'text-indigo-600 font-medium border-b-2 border-indigo-600' : ''}`} onClick={() => onTabChange?.('payroll')} aria-current={active === 'payroll' ? 'page' : undefined}>Time-off request</button>
          </nav>
        </div>

        {/* <div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-sm">
            <FaPlus />
            <span>Add new</span>
          </button>
        </div> */}
      </div>
    </div>
  );
}