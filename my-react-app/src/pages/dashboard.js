import React, { useState, useEffect } from 'react';
import TotalEmployees from '../components/Card/totalEmployees.js';
import TodayPresent from '../components/Card/todayPresent.js';
import TodayAbsent from '../components/Card/todayAbsent.js';
import TodayLeave from '../components/Card/todayLeave.js';
import PayrollCost from '../components/Card/payrollCost.js';
import RankTimeWorking from '../components/Card/rankTimeWorking.js';
import UpcomingLeave from '../components/Card/upcomingLeave.js';
import LateCheckinRanking from '../components/Card/lateChecking.js';
import { DashboardService } from '../services/dashboardService.js';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Employee stats
  const [employeeStats, setEmployeeStats] = useState({ total: 0, fulltime: 0, freelance: 0 });

  // Attendance data
  const [attendance, setAttendance] = useState({ present: 0, absent: 0, total: 0 });

  // Leave data
  const [leaveData, setLeaveData] = useState({ upcoming: [], todayCount: 0 });

  // Payroll history
  const [payrollHistory, setPayrollHistory] = useState([]);

  // Top workers
  const [topWorkers, setTopWorkers] = useState([]);

  // Late check-ins
  const [lateCheckins, setLateCheckins] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [empStats, attendanceData, leaves, payroll, workers, lates] = await Promise.all([
          DashboardService.getEmployeeStats(),
          DashboardService.getTodayAttendance(),
          DashboardService.getLeaveData(),
          DashboardService.getPayrollCostHistory(),
          DashboardService.getTopWorkers(),
          DashboardService.getLateCheckins()
        ]);

        setEmployeeStats(empStats);
        setAttendance(attendanceData);
        setLeaveData(leaves);
        setPayrollHistory(payroll);
        setTopWorkers(workers);
        setLateCheckins(lates);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Left Column - Attendance Cards + Payroll Chart */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Attendance Row */}
          <div className="grid grid-cols-3 gap-4">
            <TodayPresent count={attendance.present} />
            <TodayAbsent count={attendance.absent} />
            <TodayLeave count={leaveData.todayCount} />
          </div>

          {/* Payroll Cost Chart */}
          <PayrollCost data={payrollHistory} />
        </div>

        {/* Right Column - Employee Stats + Rankings */}
        <div className="flex flex-col gap-6">
          <TotalEmployees
            total={employeeStats.total}
            fulltime={employeeStats.fulltime}
          />
          <RankTimeWorking employees={topWorkers} />
        </div>

        {/* Far Right Column - Leave + Late Rankings */}
        <div className="flex flex-col gap-6">
          <UpcomingLeave leaves={leaveData.upcoming} />
          <LateCheckinRanking employees={lateCheckins} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
