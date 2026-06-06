import React, { useState, useMemo } from "react";
import Pagination from '../../components/pagination'
/**
 * Trang Payroll chính + Modal chi tiết payroll (toàn công ty)
 * - payrollList: danh sách payroll (month/period)
 * - khi click "View" (hoặc click ID) -> open modal with full payroll sheet
 *
 * Lưu ý: dữ liệu mẫu ở đây là mock. Sau này bạn thay bằng fetch từ API backend.
 */
const WORK_DAYS_STANDARD = 26;
const SELF_DEDUCTION = 11000000;
const TAX_RATE = 0.1; // 10%

function PayrollDetailModal({ open, onClose, payroll, employees }) {
  // tách dữ liệu employees thành fullTime và partTime
  const fullTime = employees.filter((e) => e.type === "fulltime");
  const partTime = employees.filter((e) => e.type === "parttime");

  // Công thức tính chi tiết cho full-time:
  const fullTimeWithCalc = useMemo(() => {
    return fullTime.map((e) => {
      // Phụ cấp
      const allowances = {
        responsibility: e.allowance?.responsibility || 0,
        living: e.allowance?.living || 0,
        travel: e.allowance?.travel || 0,
      };

      const totalTaxedAllowance =
        allowances.responsibility + allowances.living;
    
      // Thưởng
      const bonus = {
        holiday: e.bonus?.holiday || 0,
        other: e.bonus.other || 0,
      };

      const totalBonus =
        bonus.holiday + bonus.other;

      // Tổng thu nhập (Gross income)
      const totalIncome =
        ((e.basicSalary + totalTaxedAllowance + totalBonus) /
          WORK_DAYS_STANDARD) *
          e.workDays +
        0;

      // Khấu trừ
      const selfDeduction = SELF_DEDUCTION;
      const BHXH = e.basicSalary * 0.08;
      const BHYT = e.basicSalary * 0.015;
      const BHTN = e.basicSalary * 0.01;
      const totalDeduction = selfDeduction + BHXH + BHYT + BHTN + e.otherDeduction;

      // Thu nhập tính thuế
      const taxableIncome = Math.max(0, totalIncome - totalDeduction);

      // Thuế TNCN
      const tax = taxableIncome * TAX_RATE;

      // Lương thực nhận
      const netIncome =
        totalIncome - (BHXH + BHYT + BHTN) - tax + allowances.travel + e.ot;

      return {
        ...e,
        allowances,
        totalTaxedAllowance,
        bonus,
        totalBonus,
        totalIncome,
        selfDeduction,
        BHXH,
        BHYT,
        BHTN,
        totalDeduction,
        taxableIncome,
        tax,
        netIncome,
      };
    });
  }, [fullTime]);

  const totalsFull = useMemo(() => {
    return fullTimeWithCalc.reduce(
      (acc, e) => {
        acc.basicSalary += e.basicSalary;
        acc.responsibility += e.allowances.responsibility;
        acc.living += e.allowances.living;
        acc.travel += e.allowances.travel;
        acc.bonusHoliday += e.bonus.holiday;
        acc.bonusOther += e.bonus.other;
        acc.totalIncome += e.totalIncome;
        acc.selfDeduction += e.selfDeduction;
        acc.BHXH += e.BHXH;
        acc.BHYT += e.BHYT;
        acc.BHTN += e.BHTN;
        acc.otherDeduction += e.otherDeduction;
        acc.totalDeduction += e.totalDeduction;
        acc.taxableIncome += e.taxableIncome;
        acc.tax += e.tax;
        acc.ot += e.ot;
        acc.netIncome += e.netIncome;
        return acc;
      },
      {
        basicSalary: 0,
        responsibility: 0,
        living: 0,
        travel: 0,
        bonusHoliday: 0,
        bonusOther: 0,
        totalIncome: 0,
        selfDeduction: 0,
        BHXH: 0,
        BHYT: 0,
        BHTN: 0,
        otherDeduction: 0,
        totalDeduction: 0,
        taxableIncome: 0,
        tax: 0,
        ot: 0,
        netIncome: 0,
      }
    );
  }, [fullTimeWithCalc]);


  const partTimeWithCalc = useMemo(() => {
  return partTime.map(e => {
    const gross = e.hourlyRate * e.hoursWorked + (e.bonus || 0);
    const tax = gross * 0.1;
    const net = gross - tax - e.penalty;
    return { ...e, gross, tax, net };
    });
  }, [partTime]);

  const totalsPart = useMemo(() => {
    return partTimeWithCalc.reduce(
      (acc, e) => {
        acc.bonus += e.bonus;
        acc.gross += e.gross;
        acc.tax += e.tax;
        acc.penalty += e.penalty;
        acc.net += e.net;
        return acc;
      },
      { bonus: 0, gross: 0, tax: 0, penalty: 0, net: 0 }
    );
  }, [partTimeWithCalc]);


  if (!open || !payroll) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/40">
      <div className="bg-white w-full max-w-7xl rounded-xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-emerald-950 text-white px-6 py-3">
          <div>
            <div className="text-lg font-semibold">{payroll.id}</div>
            <div className="text-sm opacity-90">
              Ngày tạo: {payroll.createdDate} • Kỳ: {payroll.startDate} — {payroll.endDate}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="bg-white text-red-600 text-sm px-3 py-1 rounded-md hover:bg-gray-200"
            >
              X
            </button>
          </div>
        </div>

        {/* Body - scrollable */}
        <div className="p-4 overflow-auto flex-1">
          {/* Title */}
          <h3 className="text-center text-xl font-semibold mb-4 text-gray-700">
            {payroll.title || `Payroll Sheet — ${payroll.id}`}
          </h3>

          {/* Full-time table */}
          <div className="mb-8">
            <h4 className="font-semibold mb-2">Full-time Employees</h4>
            <div className="overflow-x-auto">
              <table className="min-w-[2300px] border-black text-sm text-center">
                <thead className="bg-emerald-900 text-zinc-100">
                    <tr>
                        <th className="border w-[30px] px-1 py-2" rowSpan="2">STT</th>
                        <th className="border w-[40px] px-2 py-2" rowSpan="2">ID</th>
                        <th className="border w-[200px] px-3 py-2r" rowSpan="2">Họ tên</th>
                        <th className="border w-[140px] px-3 py-2" rowSpan="2">Vị trí</th>
                        <th className="border w-[100px] px-3 py-2" rowSpan="2">Lương cơ bản</th>
                        <th className="border w-[300px] px-3 py-2" colSpan="3">Phụ cấp</th>
                        <th className="border w-[180px] px-3 py-2" colSpan="2">Thưởng</th>
                        <th className="border w-[90px] py-2" rowSpan="2">Ngày công thực tế</th>
                        <th className="border w-[110px] py-2" rowSpan="2">Tổng thu nhập</th>
                        <th className="border px-3 py-2" colSpan="6">Giảm trừ khi tính thuế TNCN</th>
                        <th className="border w-[110px] px-3 py-2" rowSpan="2">Thu nhập tính thuế</th>
                        <th className="border w-[110px] px-3 py-2" rowSpan="2">Thuế TNCN</th>
                        <th className="border w-[110px] px-3 py-2" rowSpan="2">Tiền làm thêm giờ</th>
                        <th className="border w-[150px] px-3 py-2 " rowSpan="2">Lương thực nhận</th>
                    </tr>
                    {/* Hàng 2: các cột con của phụ cấp */}
                    <tr>
                        <th className="border w-[100px] px-2 py-2 text-center">Trách nhiệm</th>
                        <th className="border w-[100px] px-2 py-2 text-center">Sinh hoạt</th>
                        <th className="border w-[100px] px-2 py-2 text-center">Công tác*</th>
                        <th className="border w-[90px] px-2 py-2 text-center">Lễ Tết</th>
                        <th className="border w-[90px] px-2 py-2 text-center">Khác</th>
                        <th className="border w-[100px] px-2 py-2 text-center">Bản thân</th>
                        <th className="border w-[90px] px-2 py-2 text-center">BHXH</th>
                        <th className="border w-[90px] px-2 py-2 text-center">BHYT</th>
                        <th className="border w-[90px] px-2 py-2 text-center">BHTN</th>
                        <th className="border w-[140px] px-1 py-2 text-center">Giảm trừ gia cảnh và giảm trừ khác</th>
                        <th className="border w-[100px] px-1 py-2 text-center">Tổng</th>
                    </tr>
                </thead>
                <tbody>
                  {fullTimeWithCalc.map((e, i) => (
                    <tr
                      key={e.id}
                      className={`${
                        i % 2 === 0 ? "bg-zinc-50" : "bg-white"
                      } hover:bg-zinc-200`}
                    >
                      <td className="border py-2 text-center">{i + 1}</td>
                      <td className="border px-2">{e.id}</td>
                      <td className="border px-2 text-left">{e.name}</td>
                      <td className="border px-2 ">{e.position}</td>
                      <td className="border px-2 text-right">
                        {e.basicSalary.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.allowances.responsibility.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.allowances.living.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.allowances.travel.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.bonus.holiday.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.bonus.other.toLocaleString()}
                      </td>
                      <td className="border text-center">{e.workDays}</td>
                      <td className="border px-2 text-right">
                        {Math.round(e.totalIncome).toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.selfDeduction.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.BHXH.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.BHYT.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.BHTN.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.otherDeduction.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.totalDeduction.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {Math.round(e.taxableIncome).toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {Math.round(e.tax).toLocaleString()}
                      </td>
                      <td className="border px-2 text-right">
                        {e.ot.toLocaleString()}
                      </td>
                      <td className="border px-2 text-right font-semibold">
                        {Math.round(e.netIncome).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-green-900 font-semibold text-zinc-100 text-sm">
                    <td className="border py-2 text-center" colSpan={4}>Tổng cộng </td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.basicSalary).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.responsibility).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.living).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.travel).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.bonusHoliday).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.bonusOther).toLocaleString()}</td>
                    <td className="border px-2 text-center">—</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.totalIncome).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.selfDeduction).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.BHXH).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.BHYT).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.BHTN).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.otherDeduction).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.totalDeduction).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.taxableIncome).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.tax).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.ot).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsFull.netIncome).toLocaleString()}</td>
                    </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Part-time table */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Part-time Employees</h4>
            <div className="overflow-x-auto">
              <table className="min-w-[1250px] border-black text-sm text-center">
                <thead className="bg-emerald-900 text-zinc-100">
                  <tr>
                    <th className="border w-[30px] px-1 py-2">STT</th>
                    <th className="border w-[40px] px-2 py-2">ID</th>
                    <th className="border w-[200px] px-2 py-2r">Họ tên</th>
                    <th className="border w-[140px] px-2 py-2">Vị trí</th>
                    <th className="border w-[140px] px-2 py-2">Mức lương/giờ</th>
                    <th className="border w-[70px] px-2 py-2">Giờ làm</th>
                    <th className="border w-[90px] px-2 py-2">Thưởng</th>
                    <th className="border w-[120px] px-2 py-2">Tổng tiền công</th>
                    <th className="border w-[120px] px-2 py-2">Thuế TNCN</th>
                    <th className="border w-[100px] px-2 py-2">Tiền phạt</th>
                    <th className="border w-[140px] px-2 py-2">Lương thực nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {partTimeWithCalc.map((e, idx) => (
                      <tr key={e.id} className={`${idx % 2 === 0 ? "bg-zinc-50" : "bg-white"} hover:bg-zinc-200`}>
                        <td className="border px-2 py-2 text-center">{idx + 1}</td>
                        <td className="border px-2 py-2">{e.id}</td>
                        <td className="border px-2 py-2 text-left">{e.name}</td>
                        <td className="border px-2 py-2">{e.position}</td>
                        <td className="border px-2 py-2 text-right">{e.hourlyRate.toLocaleString()}</td>
                        <td className="border px-2 py-2 text-center">{e.hoursWorked.toLocaleString()}</td>
                        <td className="border px-2 py-2 text-right">{e.bonus.toLocaleString()}</td>
                        <td className="border px-2 py-2 text-right">{(e.gross || 0).toLocaleString()}</td>
                        <td className="border px-2 py-2 text-right">{(e.tax || 0).toLocaleString()}</td>
                        <td className="border px-2 py-2 text-right">{e.penalty.toLocaleString()}</td>
                        <td className="border px-2 py-2 text-right font-semibold">{(e.net || 0).toLocaleString()}</td>
                      </tr>
                ))}

                  {/* Tổng */}
                  <tr className="bg-green-900 font-semibold text-zinc-100 text-sm">
                    <td className="border px-2 py-2 text-center" colSpan={6}>Tổng cộng </td>
                    <td className="border px-2 text-right">{Math.round(totalsPart.bonus).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsPart.gross).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsPart.tax).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsPart.penalty).toLocaleString()}</td>
                    <td className="border px-2 text-right">{Math.round(totalsPart.net).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer: tổng chi phí lương công ty */}
        <div className="flex items-center justify-between px-6 py-3 border-t">
          <div className="text-sm text-gray-700">Generated by HR System</div>
          <div className="font-semibold">
            Tổng chi phí lương: <span className="text-blue-600">{(totalsFull.netIncome + totalsPart.net).toLocaleString()} VND</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  // sample payroll list
  const payrollList = [
    { id: "PR-2025-09", title: "Bảng lương tháng 09/2025", createdDate: "2025-10-01", startDate: "2025-09-01", endDate: "2025-09-30", status: "Draft" },
    { id: "PR-2025-08", title: "Bảng lương tháng 08/2025", createdDate: "2025-09-01", startDate: "2025-08-01", endDate: "2025-08-31", status: "Final" },
    { id: "PR-2025-07", title: "Bảng lương tháng 07/2025", createdDate: "2025-08-01", startDate: "2025-07-01", endDate: "2025-07-31", status: "Final" },
  ];

  const sampleEmployees = [
    {
      id: "FT001",
      name: "John Pham Quoc",
      position: "Software Engineer",
      type: "fulltime",
      basicSalary: 15000000,
      workDays: 26,
      allowance: { responsibility: 1000000, living: 500000, travel: 500000 },
      bonus: { holiday: 0, other: 500000},
      ot: 500000,
      otherDeduction: 4200000,
    },
    {
      id: "FT002",
      name: "Lisa Le My",
      position: "UI/UX Designer",
      type: "fulltime",
      basicSalary: 14000000,
      workDays: 26,
      allowance: { responsibility: 800000, living: 400000, travel: 200000 },
      bonus: { holiday: 0, other: 1500000},
      ot: 400000,
      otherDeduction: 0,
    },
    {
      id: "FT003",
      name: "Khanh Nguyen",
      position: "Accountant",
      type: "fulltime",
      basicSalary: 12000000,
      workDays: 25,
      allowance: { responsibility: 600000, living: 300000, travel: 0 },
      bonus: { holiday: 0, other: 0},
      ot: 0,
      otherDeduction: 4200000,
    },
    {
      id: "PT001",
      name: "Tom Bui",
      position: "Part-time Support",
      type: "parttime",
      hourlyRate: 80000,
      hoursWorked: 80,
      bonus: 200000,
      penalty: 0,
    },
  ];

  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [open, setOpen] = useState(false);
  const [employeesByPayroll] = useState({ // mock mapping payrollId -> employees; in real: fetch
    "PR-2025-09": sampleEmployees,
    "PR-2025-08": sampleEmployees,
    "PR-2025-07": sampleEmployees,
  });

  const handleOpen = (p) => {
    setSelectedPayroll(p);
    setOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-6 text-gray-800 text-center">Danh sách bảng lương</h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b-2 text-xl text-left text-gray-700">
            <tr>
              <th className="w-[100px] px-4 py-4">#</th>
              <th className="w-[160px] px-4 py-3">ID</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3">Kỳ tính lương</th>
              <th className="px-4 py-3">Ngào tạo</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {payrollList.map((p, i) => (
              <tr key={p.id} className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50`}>
                <td className="px-4 py-4 font-semibold text-[15px] border-b-2 text-left">{i + 1}</td>
                {/* <td
                  className="px-4 py-2 border text-blue-600 cursor-pointer hover:underline"
                  onClick={() => handleOpen(p)}
                >
                  {p.id}
                </td> */}
                <td className="px-4 py-2 font-semibold text-[15px] border-b-2">{p.id}</td>
                <td className="px-4 py-2 font-semibold text-[15px] border-b-2">{p.title}</td>
                <td className="px-4 py-2 font-semibold text-[15px] border-b-2">{p.startDate} — {p.endDate}</td>
                <td className="px-4 py-2 font-semibold text-[15px] border-b-2">{p.createdDate}</td>
                <td className="px-4 py-2 text-[15px] border-b-2">
                {p.status === 'Draft' ? (
                    // Giao diện cho "Draft"
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100">
                        <span className="text-sm font-medium text-yellow-800">Draft</span>
                    </div>
                ) : (
                    // Giao diện cho "Final"
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100">
                        <span className="text-sm font-medium text-green-800">Final</span>
                    </div>
                )}
                </td>
                <td className="px-4 py-2 border-b-2">
                  <button className="text-blue-600 hover:underline font-semibold text-[15px] text-center" onClick={() => handleOpen(p)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <PayrollDetailModal
        open={open}
        onClose={() => setOpen(false)}
        payroll={selectedPayroll}
        employees={selectedPayroll ? employeesByPayroll[selectedPayroll.id] || [] : []}
      />

    </div>

  );
}
