package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.demo.entity.Timesheet;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimesheetRepository extends JpaRepository<Timesheet, Long> {

    /**
     * Tính tổng số GIỜ làm việc thực tế trong tháng.
     * Logic: Sử dụng shift-based calculation giống TimesheetService.
     * CA SÁNG: 8:00-12:00, CA CHIỀU: 13:00-17:00
     */
    @Query(value = """
                SELECT COALESCE(SUM(
                    GREATEST(0, LEAST(
                        EXTRACT(EPOCH FROM (LEAST(CAST(checkout_time AS time), TIME '12:00:00') - GREATEST(CAST(checkin_time AS time), TIME '08:00:00')))/3600,
                        4
                    )) +
                    GREATEST(0, LEAST(
                        EXTRACT(EPOCH FROM (LEAST(CAST(checkout_time AS time), TIME '17:00:00') - GREATEST(CAST(checkin_time AS time), TIME '13:00:00')))/3600,
                        4
                    ))
                ), 0)
                FROM timesheet
                WHERE employee_id = :empId
                AND EXTRACT(MONTH FROM date) = :month
                AND EXTRACT(YEAR FROM date) = :year
                AND checkout_time IS NOT NULL
            """, nativeQuery = true)
    Double calculateTotalWorkedHours(@Param("empId") Long empId,
            @Param("month") int month,
            @Param("year") int year);

    List<Timesheet> findByDateBetween(LocalDate start, LocalDate end);

    /**
     * Tính tổng số giờ OT trong tháng.
     * Logic: Chỉ tính thời gian sau 17:00.
     * OT < 0.5h mỗi ngày thì không tính.
     */
    @Query(value = """
                SELECT COALESCE(SUM(
                    CASE
                        WHEN EXTRACT(EPOCH FROM (CAST(checkout_time AS time) - TIME '17:00:00'))/3600 > 0.5
                        THEN EXTRACT(EPOCH FROM (CAST(checkout_time AS time) - TIME '17:00:00'))/3600
                        ELSE 0
                    END
                ), 0)
                FROM timesheet
                WHERE employee_id = :empId
                AND EXTRACT(MONTH FROM date) = :month
                AND EXTRACT(YEAR FROM date) = :year
                AND checkout_time IS NOT NULL
                AND CAST(checkout_time AS time) > TIME '17:00:00'
            """, nativeQuery = true)
    Double calculateTotalOvertimeHours(@Param("empId") Long empId,
            @Param("month") int month,
            @Param("year") int year);
}
