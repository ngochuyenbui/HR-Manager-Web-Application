import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FaSearch } from 'react-icons/fa';
import AddEmployeeModal from './AddEmployeeModal'; 

export default function FiltersBar({ 
  search, 
  onSearch, 
  filters, 
  onFilterChange, 
  onClear, 
  positions = [], 
  genders = [], 
  types = [], 
  statuses = [],
  onAddSuccess,
  showAdd = true,
  showFilters = true
}) {
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);
  const buttonRef = useRef(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  // normalize incoming option lists: ensure strings, unique and sorted
  const normalize = (arr) => {
    if (!arr || !Array.isArray(arr)) return [];
    const cleaned = arr.map((a) => {
        if (a == null) return '';
        if (typeof a === 'object') return String(a.name ?? a.value ?? '');
        return String(a);
      }).map((s) => s.trim()).filter((s) => s.length > 0);
    return Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  };

  const normPositions = useMemo(() => normalize(positions), [positions]);
  const normGenders = useMemo(() => normalize(genders), [genders]);
  const normTypes = useMemo(() => normalize(types), [types]);
  const normStatuses = useMemo(() => normalize(statuses), [statuses]);

  useEffect(() => {
    if (!showFilters) return;
    function onDocClick(e) {
      // if click is inside popup, ignore
      if (popupRef.current && popupRef.current.contains(e.target)) return;
      // if click is the filter button, ignore here (button toggles open)
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showFilters]);

  // compute popup position anchored to button
  useEffect(() => {
    function updatePos() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
    }
    if (open) {
      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
    }
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-white p-4 rounded-md shadow-sm flex flex-col md:flex-row md:items-center gap-3 overflow-visible relative z-50">
        
        <div className="flex items-center w-full md:w-1/3 bg-gray-100 rounded-md px-3 py-2 min-w-0">
          <FaSearch className="text-gray-400 mr-2 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
            className="bg-transparent flex-1 outline-none text-sm min-w-0"
            placeholder="Search by name, job title..."
            aria-label="Search employees"
          />
        </div>

        {/* Filter Button */}
        {showFilters && (
          <div className="relative ml-3">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setOpen((s) => !s)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded text-sm hover:shadow"
              aria-haspopup="dialog"
              aria-expanded={open}
            >
              Filters
            </button>

            {/* Filter Popup Portal */}
            {open && popupRef && createPortal(
              <div
                ref={popupRef}
                className="bg-white border rounded shadow-lg z-50 p-3"
                style={{ position: 'absolute', top: popupPos.top + 'px', left: popupPos.left + 'px', width: 320 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500">Position</label>
                    <select
                      value={filters.position || ''}
                      onChange={(e) => onFilterChange?.('position', e.target.value)}
                      className="border rounded px-3 py-2 text-sm w-full"
                    >
                      <option value="">All Positions</option>
                      {normPositions && normPositions.length > 0 ? (
                        normPositions.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))
                      ) : (
                        // fallback hard-coded examples when no positions provided
                        <>
                          <option>Staff</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500">Gender</label>
                    <select
                      value={filters.gender || ''}
                      onChange={(e) => onFilterChange?.('gender', e.target.value)}
                      className="border rounded px-3 py-2 text-sm w-full"
                    >
                      <option value="">All Genders</option>
                      {normGenders && normGenders.length > 0 ? (
                        normGenders.map((g) => <option key={g} value={g}>{g}</option>)
                      ) : (
                        <>
                          <option>Male</option>
                          <option>Female</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500">Type</label>
                    <select
                      value={filters.type || ''}
                      onChange={(e) => onFilterChange?.('type', e.target.value)}
                      className="border rounded px-3 py-2 text-sm w-full"
                    >
                      <option value="">All Types</option>
                      {normTypes && normTypes.length > 0 ? (
                        normTypes.map((t) => <option key={t} value={t}>{t}</option>)
                      ) : (
                        <>
                          <option>Fulltime</option>
                          <option>Freelance</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500">Status</label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => onFilterChange?.('status', e.target.value)}
                      className="border rounded px-3 py-2 text-sm w-full"
                    >
                      <option value="">All Statuses</option>
                      {normStatuses && normStatuses.length > 0 ? (
                        normStatuses.map((s) => <option key={s} value={s}>{s}</option>)
                      ) : (
                        <>
                          <option>Active</option>
                          <option>Inactive</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex justify-between items-center pt-2">
                    <button
                      onClick={() => { onClear?.(); setOpen(false); }}
                      className="text-sm text-gray-600 underline"
                    >
                      Clear filters
                    </button>
                    <button
                      onClick={() => setOpen(false)}
                      className="px-3 py-1 bg-orange-500 text-white rounded text-sm"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>,
              typeof document !== 'undefined' ? document.body : null
            )}
          </div>
        )}

        {showAdd && <AddEmployeeModal onSuccess={onAddSuccess} />}
        
      </div>
    </div>
  );
}