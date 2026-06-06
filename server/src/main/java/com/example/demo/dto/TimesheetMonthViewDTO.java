package com.example.demo.dto;

import lombok.Data;
import java.util.Map;
import java.util.List;

@Data
public class TimesheetMonthViewDTO {
    private int employeeId;
    private String employeeName;
    private String employeeType;
    private double totalHours;
    private double totalOvertime;
    private double totalWorkDays;  // Tổng ngày công
    // Map từ date "2025-12-05" -> day info (first_in, last_out, chi tiết log)
    private Map<String, TimesheetDayDTO> days;

    @Data
    public static class TimesheetDayDTO {
        private String firstIn;      // "08:00" (giờ check-in đầu tiên)
        private String lastOut;      // "17:00" (giờ check-out cuối cùng)
        private List<TimesheetLogDTO> logs;  // danh sách chi tiết check-in/check-out
        private boolean incomplete;  // true nếu có log lẻ (In mà không có Out)
        private double workDays;     // Ngày công: 1, 0.5, hoặc 0
        private String status;       // "FULL", "LATE", "HALF_DAY", "ABSENT"

        @Data
        public static class TimesheetLogDTO {
            private String checkIn;   // "07:55"
            private String checkOut;  // "12:03"
            private double hours;     // số giờ làm việc của khung này
            private double otHours;   // số giờ OT của khung này
        }
    }
}
