package com.example.demo.service;

import com.example.demo.dto.TimesheetMonthViewDTO;
import com.example.demo.entity.Timesheet;
import com.example.demo.entity.Employee;
import com.example.demo.repository.TimesheetRepository;
import com.example.demo.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TimesheetService {

    private static final Logger logger = LoggerFactory.getLogger(TimesheetService.class);
    
    // Shift constants
    private static final LocalTime SHIFT_MORNING_START = LocalTime.of(8, 0);
    private static final LocalTime SHIFT_MORNING_END = LocalTime.of(12, 0);
    private static final LocalTime SHIFT_AFTERNOON_START = LocalTime.of(13, 0);
    private static final LocalTime SHIFT_AFTERNOON_END = LocalTime.of(17, 0);
    
    private final TimesheetRepository timesheetRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Loại bỏ các log trùng (cùng loại check-in/check-out trong vòng 1 phút)
     */
    private List<Timesheet> removeDuplicateLogs(List<Timesheet> logs) {
        if (logs.isEmpty()) return logs;
        
        List<Timesheet> cleaned = new ArrayList<>();
        LocalDateTime lastTime = null;
        
        for (Timesheet log : logs) {
            LocalDateTime time = log.getCheckIn() != null ? log.getCheckIn() : log.getCheckOut();
            if (time == null) continue;
            
            if (lastTime == null || Duration.between(lastTime, time).toMinutes() >= 1) {
                cleaned.add(log);
                lastTime = time;
            } else {
                logger.info("Removed duplicate log at {}", time);
            }
        }
        return cleaned;
    }

    /**
     * Tạo cặp In-Out từ danh sách logs
     * Trả về danh sách cặp (Pair) với thông tin log lẻ
     */
    private List<TimePair> createTimePairs(List<Timesheet> logs) {
        List<TimePair> pairs = new ArrayList<>();
        
        for (Timesheet log : logs) {
            if (log.getCheckIn() != null && log.getCheckOut() != null) {
                pairs.add(new TimePair(log.getCheckIn(), log.getCheckOut(), false));
            } else if (log.getCheckIn() != null) {
                // Chỉ có check-in, thiếu check-out
                pairs.add(new TimePair(log.getCheckIn(), null, true));
            }
        }
        
        return pairs;
    }

    /**
     * Tính giờ làm việc với cắt gọt theo shift
     * CA SÁNG: 8h-12h, CA CHIỀU: 13h-17h
     */
    private WorkingHours calculateWorkingHours(LocalDateTime inTime, LocalDateTime outTime) {
        LocalTime in = inTime.toLocalTime();
        LocalTime out = outTime != null ? outTime.toLocalTime() : null;
        
        if (out == null) {
            return new WorkingHours(0, 0, true); // Thiếu dữ liệu
        }
        
        double workingMinutes = 0;
        double otMinutes = 0;
        
        // Morning shift: 8:00 - 12:00
        if (in.isBefore(SHIFT_MORNING_END) && out.isAfter(SHIFT_MORNING_START)) {
            LocalTime shiftIn = in.isBefore(SHIFT_MORNING_START) ? SHIFT_MORNING_START : in;
            LocalTime shiftOut = out.isAfter(SHIFT_MORNING_END) ? SHIFT_MORNING_END : out;
            if (shiftIn.isBefore(shiftOut)) {
                workingMinutes += Duration.between(shiftIn, shiftOut).toMinutes();
            }
        }
        
        // Afternoon shift: 13:00 - 17:00
        if (in.isBefore(SHIFT_AFTERNOON_END) && out.isAfter(SHIFT_AFTERNOON_START)) {
            LocalTime shiftIn = in.isBefore(SHIFT_AFTERNOON_START) ? SHIFT_AFTERNOON_START : in;
            LocalTime shiftOut = out.isAfter(SHIFT_AFTERNOON_END) ? SHIFT_AFTERNOON_END : out;
            if (shiftIn.isBefore(shiftOut)) {
                workingMinutes += Duration.between(shiftIn, shiftOut).toMinutes();
            }
        }
        
        // OT: chỉ tính sau 17:00
        if (out.isAfter(SHIFT_AFTERNOON_END) && in.isBefore(out)) {
            LocalTime otStart = in.isBefore(SHIFT_AFTERNOON_END) ? SHIFT_AFTERNOON_END : in;
            otMinutes += Duration.between(otStart, out).toMinutes();
        }

        double otHours = otMinutes / 60.0;
        // Nếu OT <= 0.5h thì không tính
        if (otHours <= 0.5) {
            otHours = 0;
        }
        
        return new WorkingHours(workingMinutes / 60.0, otHours, false);
    }

    /**
     * Class hỗ trợ lưu cặp In-Out
     */
    private static class TimePair {
        LocalDateTime inTime;
        LocalDateTime outTime;
        boolean incomplete; // true nếu thiếu Out
        
        TimePair(LocalDateTime in, LocalDateTime out, boolean incomplete) {
            this.inTime = in;
            this.outTime = out;
            this.incomplete = incomplete;
        }
    }

    /**
     * Class hỗ trợ lưu kết quả tính giờ
     */
    private static class WorkingHours {
        double workingHours;
        double otHours;
        boolean incomplete;
        
        WorkingHours(double working, double ot, boolean incomplete) {
            this.workingHours = working;
            this.otHours = ot;
            this.incomplete = incomplete;
        }
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public List<TimesheetMonthViewDTO> getMonthView(int year, int month) {
        try {
            LocalDate start = LocalDate.of(year, month, 1);
            LocalDate end = start.plusMonths(1).minusDays(1);
            
            logger.info("Fetching timesheets for year: {}, month: {}, date range: {} to {}", year, month, start, end);

            List<Timesheet> raw = timesheetRepository.findByDateBetween(start, end);
            logger.info("Found {} timesheets", raw.size());

            // Group by employee, then by date
            Map<Long, Map<LocalDate, List<Timesheet>>> grouped = new LinkedHashMap<>();
            for (Timesheet ts : raw) {
                grouped.computeIfAbsent(ts.getEmployeeId(), k -> new LinkedHashMap<>())
                       .computeIfAbsent(ts.getDate(), k -> new ArrayList<>())
                       .add(ts);
            }

            List<TimesheetMonthViewDTO> result = new ArrayList<>();

            for (Long empId : grouped.keySet()) {
                try {
                    Employee emp = employeeRepository.findById(empId).orElse(null);
                    if (emp == null) {
                        logger.warn("Employee not found with ID: {}", empId);
                        continue;
                    }

                    String fullName = emp.getFName() + " "
                            + (emp.getMName() != null ? emp.getMName() + " " : "")
                            + emp.getLName();
                    String type = emp.getType();

                    Map<String, TimesheetMonthViewDTO.TimesheetDayDTO> dayMap = new LinkedHashMap<>();
                    double totalHours = 0;
                    double totalOT = 0;
                    double totalWorkDays = 0;

                    Map<LocalDate, List<Timesheet>> employeeByDate = grouped.get(empId);

                    for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
                        List<Timesheet> daySheets = employeeByDate.getOrDefault(day, new ArrayList<>());

                        if (!daySheets.isEmpty()) {
                            // Step 1: Sắp xếp theo thời gian
                            daySheets.sort(Comparator.comparing(Timesheet::getCheckIn));
                            
                            // Step 2: Loại bỏ log trùng
                            daySheets = removeDuplicateLogs(daySheets);
                            
                            // Step 3: Tạo cặp In-Out
                            List<TimePair> pairs = createTimePairs(daySheets);
                            
                            if (!pairs.isEmpty()) {
                                var firstIn = pairs.get(0).inTime;
                                var lastOut = pairs.get(pairs.size() - 1).outTime;

                                if (firstIn != null && lastOut != null) {
                                    // Build log list với tính toán shift trimming
                                    List<TimesheetMonthViewDTO.TimesheetDayDTO.TimesheetLogDTO> logs = new ArrayList<>();
                                    double dayWorkingHours = 0;
                                    double dayOtHours = 0;
                                    boolean hasIncompleteLog = false;

                                    for (TimePair pair : pairs) {
                                        if (pair.incomplete) {
                                            hasIncompleteLog = true;
                                            logger.warn("Incomplete log (In without Out) on {} for employee {}", day, empId);
                                        } else {
                                            WorkingHours wh = calculateWorkingHours(pair.inTime, pair.outTime);
                                            
                                            dayWorkingHours += wh.workingHours;
                                            dayOtHours += wh.otHours;

                                            TimesheetMonthViewDTO.TimesheetDayDTO.TimesheetLogDTO log = 
                                                new TimesheetMonthViewDTO.TimesheetDayDTO.TimesheetLogDTO();
                                            log.setCheckIn(pair.inTime.toString().substring(11, 16));
                                            log.setCheckOut(pair.outTime.toString().substring(11, 16));
                                            
                                            // Chỉ hiển thị giờ làm việc trong shift, không cộng OT
                                            log.setHours(round2(wh.workingHours));
                                            log.setOtHours(round2(wh.otHours));
                                            logs.add(log);
                                        }
                                    }

                                    // Chỉ cộng OT nếu > 30 phút
                                    if (dayOtHours > 0.5) {
                                        totalOT += dayOtHours;
                                    }
                                    totalHours += dayWorkingHours;

                                    // Tính ngày công dựa trên giờ làm việc
                                    double workDays = 0;
                                    String status = "ABSENT";
                                    
                                    if (dayWorkingHours >= 7.75) {
                                        workDays = 1.0;
                                        status = "FULL";
                                    } else if (dayWorkingHours >= 5) {
                                        workDays = 1.0;
                                        status = "LATE";  // Đi muộn/về sớm
                                    } else if (dayWorkingHours >= 3.75) {
                                        workDays = 0.5;
                                        status = "HALF_DAY";
                                    } else {
                                        workDays = 0;
                                        status = "ABSENT";
                                    }
                                    
                                    totalWorkDays += workDays;

                                    // Create day DTO
                                    TimesheetMonthViewDTO.TimesheetDayDTO dayDTO = 
                                        new TimesheetMonthViewDTO.TimesheetDayDTO();
                                    dayDTO.setFirstIn(firstIn.toString().substring(11, 16));
                                    dayDTO.setLastOut(lastOut.toString().substring(11, 16));
                                    dayDTO.setLogs(logs);
                                    dayDTO.setIncomplete(hasIncompleteLog);
                                    dayDTO.setWorkDays(round2(workDays));
                                    dayDTO.setStatus(status);
                                    
                                    dayMap.put(day.toString(), dayDTO);
                                } else {
                                    dayMap.put(day.toString(), null);
                                }
                            } else {
                                dayMap.put(day.toString(), null);
                            }
                        } else {
                            dayMap.put(day.toString(), null);
                        }
                    }


                    TimesheetMonthViewDTO dto = new TimesheetMonthViewDTO();
                    dto.setEmployeeId(emp.getId().intValue());
                    dto.setEmployeeName(fullName);
                    dto.setEmployeeType(type);
                    dto.setTotalHours(round2(totalHours));
                    dto.setTotalOvertime(round2(totalOT));
                    dto.setTotalWorkDays(round2(totalWorkDays));
                    dto.setDays(dayMap);
                    result.add(dto);
                } catch (Exception e) {
                    logger.error("Error processing employee {}", empId, e);
                }
            }

            return result;
        } catch (Exception e) {
            logger.error("Error in getMonthView", e);
            throw e;
        }
    }
}
