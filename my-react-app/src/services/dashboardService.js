import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const DashboardService = {
    // Get all employees statistics
    getEmployeeStats: async () => {
        try {
            const response = await axios.get(`${API_BASE}/employees`);
            const employees = response.data || [];

            const total = employees.length;
            const fulltime = employees.filter(e => e.type?.toLowerCase() === 'fulltime').length;
            const freelance = employees.filter(e => e.type?.toLowerCase() === 'freelance').length;
            const active = employees.filter(e => e.status?.toLowerCase() === 'active').length;

            return { total, fulltime, freelance, active, employees };
        } catch (error) {
            console.error("Error fetching employee stats:", error);
            return { total: 0, fulltime: 0, freelance: 0, active: 0, employees: [] };
        }
    },

    // Get today's attendance data
    getTodayAttendance: async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            const [employeesRes, timesheetRes] = await Promise.all([
                axios.get(`${API_BASE}/employees`),
                axios.get(`${API_BASE}/timesheets/month-view`, { params: { year, month } })
            ]);

            const employees = employeesRes.data || [];
            const timesheets = timesheetRes.data || [];
            const totalActive = employees.filter(e => e.status?.toLowerCase() === 'active').length;

            // Count today's check-ins
            const todayStr = today.toISOString().split('T')[0];
            let present = 0;

            timesheets.forEach(ts => {
                if (ts.days) {
                    const todayData = ts.days.find(d => d.date === todayStr);
                    if (todayData && todayData.checkIn) {
                        present++;
                    }
                }
            });

            return {
                present,
                absent: Math.max(0, totalActive - present),
                total: totalActive
            };
        } catch (error) {
            console.error("Error fetching attendance:", error);
            return { present: 0, absent: 0, total: 0 };
        }
    },

    // Get leave requests (upcoming and today)
    getLeaveData: async () => {
        try {
            const response = await axios.get(`${API_BASE}/leave-requests`);
            const leaves = response.data || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcoming = leaves.filter(leave => {
                if (leave.status?.toLowerCase() !== 'approved') return false;
                const startDate = new Date(leave.startDate);
                return startDate >= today;
            }).slice(0, 5);

            const todayLeave = leaves.filter(leave => {
                if (leave.status?.toLowerCase() !== 'approved') return false;
                const startDate = new Date(leave.startDate);
                const endDate = new Date(leave.endDate);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                return today >= startDate && today <= endDate;
            });

            return { upcoming, todayCount: todayLeave.length };
        } catch (error) {
            console.error("Error fetching leave data:", error);
            return { upcoming: [], todayCount: 0 };
        }
    },

    // Get monthly payroll cost history
    getPayrollCostHistory: async () => {
        try {
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;

            const monthlyData = [];

            // Fetch last 6 months of payroll data
            for (let i = 5; i >= 0; i--) {
                let month = currentMonth - i;
                let year = currentYear;

                if (month <= 0) {
                    month += 12;
                    year -= 1;
                }

                try {
                    const response = await axios.get(`${API_BASE}/payroll`, {
                        params: { month, year }
                    });
                    const payrollList = response.data || [];

                    const totalGross = payrollList.reduce((sum, item) => sum + (item.grossPay || 0), 0);
                    const totalNet = payrollList.reduce((sum, item) => sum + (item.netPay || 0), 0);

                    monthlyData.push({
                        month,
                        year,
                        label: new Date(year, month - 1).toLocaleString('en', { month: 'short' }),
                        gross: totalGross,
                        net: totalNet
                    });
                } catch (err) {
                    monthlyData.push({
                        month,
                        year,
                        label: new Date(year, month - 1).toLocaleString('en', { month: 'short' }),
                        gross: 0,
                        net: 0
                    });
                }
            }

            return monthlyData;
        } catch (error) {
            console.error("Error fetching payroll history:", error);
            return [];
        }
    },

    // Get top workers (by hours worked this month)
    getTopWorkers: async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            const response = await axios.get(`${API_BASE}/timesheets/month-view`, {
                params: { year, month }
            });

            const timesheets = response.data || [];

            const workers = timesheets.map(ts => {
                let totalHours = 0;
                if (ts.days) {
                    ts.days.forEach(day => {
                        if (day.checkIn && day.checkOut) {
                            const checkIn = new Date(`2000-01-01T${day.checkIn}`);
                            const checkOut = new Date(`2000-01-01T${day.checkOut}`);
                            const hours = (checkOut - checkIn) / (1000 * 60 * 60);
                            if (hours > 0) totalHours += hours;
                        }
                    });
                }
                return {
                    name: ts.employeeName || 'Unknown',
                    hours: Math.round(totalHours)
                };
            }).filter(w => w.hours > 0)
                .sort((a, b) => b.hours - a.hours)
                .slice(0, 5);

            return workers;
        } catch (error) {
            console.error("Error fetching top workers:", error);
            return [];
        }
    },

    // Get late check-in ranking
    getLateCheckins: async () => {
        try {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            const response = await axios.get(`${API_BASE}/timesheets/month-view`, {
                params: { year, month }
            });

            const timesheets = response.data || [];
            const LATE_THRESHOLD = '09:00'; // Consider late after 9 AM

            const lateCount = {};

            timesheets.forEach(ts => {
                if (ts.days) {
                    let lateCount_ = 0;
                    ts.days.forEach(day => {
                        if (day.checkIn && day.checkIn > LATE_THRESHOLD) {
                            lateCount_++;
                        }
                    });
                    if (lateCount_ > 0) {
                        lateCount[ts.employeeName || 'Unknown'] = (lateCount[ts.employeeName] || 0) + lateCount_;
                    }
                }
            });

            const lateRanking = Object.entries(lateCount)
                .map(([name, times]) => ({ name, times }))
                .sort((a, b) => b.times - a.times)
                .slice(0, 5);

            return lateRanking;
        } catch (error) {
            console.error("Error fetching late check-ins:", error);
            return [];
        }
    }
};
