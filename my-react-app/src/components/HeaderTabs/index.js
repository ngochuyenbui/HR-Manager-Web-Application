import React from 'react';
import { FaPlus } from 'react-icons/fa';

export default function HeaderTabs({ title = 'Employee Management', active = 'team', onTabChange }) {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Mobile: title + add button on same row; Desktop (md+): use 3-column grid so tabs sit centered and can't be overlapped */}
        {/* Mobile header: title and compact Add button on same row */}
        <div className="md:hidden flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{title}</h1>
          <div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-sm text-sm"
              aria-label="Add new"
            >
              <FaPlus />
              <span className="hidden sm:inline">Add new</span>
            </button>
          </div>
        </div>

        {/* Desktop grid: left empty, center tabs, right add button. Mobile: tabs appear below the title/add row */}
        <div className="mt-3 md:mt-4">
          {/* Desktop layout */}
          <div className="hidden md:grid md:grid-cols-3 md:items-center">
            <div className="pl-2">
              <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
            </div>

            <div className="flex justify-center">
              <nav
                className="flex justify-center w-full space-x-6 text-sm text-gray-500"
                role="tablist"
                aria-label="Employee management tabs"
              >
                <button
                  role="tab"
                  aria-selected={active === 'team'}
                  className={`flex-none px-4 py-2 sm:px-6 sm:py-3 ${active === 'team' ? 'text-indigo-600 font-medium border-b-4 border-indigo-600' : 'hover:text-indigo-600'}`}
                  onClick={() => onTabChange?.('team')}
                >
                  Team members
                </button>

                <button
                  role="tab"
                  aria-selected={active === 'payroll'}
                  className={`flex-none px-4 py-2 sm:px-6 sm:py-3 ${active === 'payroll' ? 'text-indigo-600 font-medium border-b-4 border-indigo-600' : 'hover:text-indigo-600'}`}
                  onClick={() => onTabChange?.('payroll')}
                >
                  Payroll
                </button>
              </nav>
            </div>

  
          </div>

          {/* Mobile layout: tabs below title/add row (centered horizontally but full width) */}
          <div className="md:hidden">
            <nav
              className="flex justify-center w-full space-x-6 text-sm text-gray-500 overflow-x-auto"
              role="tablist"
              aria-label="Employee management tabs"
            >
              <button
                role="tab"
                aria-selected={active === 'team'}
                className={`flex-none px-4 py-2 ${active === 'team' ? 'text-indigo-600 font-medium border-b-4 border-indigo-600' : 'hover:text-indigo-600'}`}
                onClick={() => onTabChange?.('team')}
              >
                Team members
              </button>

              <button
                role="tab"
                aria-selected={active === 'payroll'}
                className={`flex-none px-4 py-2 ${active === 'payroll' ? 'text-indigo-600 font-medium border-b-4 border-indigo-600' : 'hover:text-indigo-600'}`}
                onClick={() => onTabChange?.('payroll')}
              >
                Payroll
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
 