import React from 'react';

function Pagination({
  totalItems = 0,
  pageSize = 10,
  currentPage = 1,
  onPageChange = () => {},
  onPageSizeChange = () => {},
  pageSizeOptions = [5, 10, 20, 50],
  showRange = true,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const goTo = (page) => {
    const p = Math.max(1, Math.min(totalPages, page));
    onPageChange(p);
  };

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="flex items-center justify-between text-gray-700 text-sm p-3 border-t">
      

      <div className="flex items-center gap-3">
        {showRange && <div className="text-sm">Showing {startIndex} - {endIndex} of {totalItems}</div>}
        <label className="flex items-center gap-2">
          <span className="text-sm">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => { onPageSizeChange(Number(e.target.value)); }}
            className="border rounded px-2 py-1"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <button
          className="px-2 py-1 mr-2 bg-white border rounded disabled:opacity-50"
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => {
          const pageNum = i + 1;
          return (
            <button
              key={pageNum}
              onClick={() => goTo(pageNum)}
              className={`px-2 py-1 mx-1 rounded ${pageNum === currentPage ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          className="px-2 py-1 ml-2 bg-white border rounded disabled:opacity-50"
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
