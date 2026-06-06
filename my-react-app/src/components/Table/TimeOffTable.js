import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import AddLeaveRequestModal from "../AddLeaveRequestModal";

export default function TimeOffTable() {
  const [activeTab, setActiveTab] = useState("pending");
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [processing, setProcessing] = useState(new Set());

  async function load(status) {
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`http://localhost:5000/api/leave-requests${qs}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRows(data);
      setFilteredRows(data);
      setSearchName("");

      // also fetch full counts by retrieving all and counting locally
      const allRes = await fetch(`http://localhost:5000/api/leave-requests`);
      if (allRes.ok) {
        const all = await allRes.json();
        const c = { pending: 0, approved: 0, rejected: 0 };
        all.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
        setCounts(c);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Filter rows by employee name
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchName(e.target.value);
    const filtered = rows.filter((row) =>
      row.name.toLowerCase().includes(value)
    );
    setFilteredRows(filtered);
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  async function decide(id, approve) {
    try {
      setProcessing(prev => new Set(prev).add(id));
      const url = `http://localhost:5000/api/leave-requests/${id}/${approve ? 'approve' : 'reject'}`;
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Decision failed');
      // refresh current tab
      await load(activeTab);
    } catch (e) {
      console.error(e);
      alert('Operation failed');
    } finally {
      setProcessing(prev => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{filteredRows.length} Request</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="ml-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md flex items-center gap-2" 
          aria-label="Add new time off"
        >
          <span className="text-xl">+</span> Add new
        </button>
      </div>

      {/* Modal */}
      <AddLeaveRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => load(activeTab)}
      />

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b pb-2 mb-4">
        { ["pending", "approved", "rejected"].map((tab) => (
          <button
            key={tab}
            className={`pb-1 font-medium ${
              activeTab === tab
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}{' '}
            <span className="ml-1 bg-gray-200 px-2 py-0.5 rounded-full text-xs">
              {counts[tab] || 0}
            </span>
          </button>
        )) }
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search employee name"
          value={searchName}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-gray-500 text-xs uppercase bg-gray-50">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Duration</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Approval</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-gray-50">
                {/* NAME */}
                <td className="p-3 flex items-center gap-3">
                  <img
                    src={row.avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="text-gray-500 text-xs">{row.role}</div>
                  </div>
                </td>

                {/* DURATION */}
                <td className="p-3">{row.duration}</td>

                {/* DATE */}
                <td className="p-3">{row.date}</td>

                {/* TYPE */}
                <td className="p-3">{row.type}</td>

                {/* REASON */}
                <td className="p-3">{row.reason || "-"}</td>

                {/* APPROVAL STATUS */}
                <td className="p-3">
                  {row.status === "approved" && (
                    <span className="text-green-600 font-medium"> Approved</span>
                  )}
                  {row.status === "pending" && (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm">Pending</span>
                    </div>
                  )}
                  {row.status === "rejected" && (
                    <span className="text-red-600 font-medium"> Rejected</span>
                  )}
                </td>

                {/* ACTION BUTTON */}
                <td className="p-3 text-right">
                  {row.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => decide(row.id, true)}
                        disabled={processing.has(row.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => decide(row.id, false)}
                        disabled={processing.has(row.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400"></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
