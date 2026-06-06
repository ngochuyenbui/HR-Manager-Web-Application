package com.example.demo.service;

import com.example.demo.dto.LeaveRequestDTO;
import com.example.demo.entity.Employee;
import com.example.demo.entity.LeaveRequest;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    public List<LeaveRequestDTO> getAll(String statusFilter) {
        List<LeaveRequest> raw;
        if (statusFilter == null || statusFilter.isBlank()) {
            raw = leaveRequestRepository.findAll();
        } else {
            if ("pending".equalsIgnoreCase(statusFilter)) {
                raw = leaveRequestRepository.findByIsApproved(null);
            } else if ("approved".equalsIgnoreCase(statusFilter)) {
                raw = leaveRequestRepository.findByIsApproved(Boolean.TRUE);
            } else if ("rejected".equalsIgnoreCase(statusFilter)) {
                raw = leaveRequestRepository.findByIsApproved(Boolean.FALSE);
            } else {
                raw = leaveRequestRepository.findAll();
            }
        }

        List<LeaveRequestDTO> result = new ArrayList<>();

        for (LeaveRequest lr : raw) {
            LeaveRequestDTO dto = new LeaveRequestDTO();
            dto.setId(lr.getId());

            Employee emp = null;
            if (lr.getEmployeeCreate() != null) {
                emp = employeeRepository.findById(lr.getEmployeeCreate()).orElse(null);
            }

            String fullName = emp != null ? emp.getFName() + (emp.getMName() != null ? " " + emp.getMName() : "") + " " + emp.getLName() : "Unknown";
            dto.setName(fullName);
            dto.setRole(emp != null ? emp.getType() : "Employee");
            dto.setAvatar("https://i.pravatar.cc/100?u=" + (emp != null ? emp.getId() : lr.getId()));

            if (lr.getStartDate() != null && lr.getEndDate() != null) {
                long days = ChronoUnit.DAYS.between(lr.getStartDate(), lr.getEndDate()) + 1;
                dto.setDuration(days + " days");
                String dateRange = lr.getStartDate().format(DATE_FMT) + " – " + lr.getEndDate().format(DATE_FMT);
                dto.setDate(dateRange);
            } else if (lr.getStartDate() != null) {
                dto.setDuration("1 day");
                dto.setDate(lr.getStartDate().format(DATE_FMT));
            } else {
                dto.setDuration("");
                dto.setDate("");
            }

            dto.setType(lr.getLeaveType());
            dto.setReason(lr.getReason());

            String status;
            if (lr.getIsApproved() == null) status = "pending";
            else if (lr.getIsApproved()) status = "approved";
            else status = "rejected";
            dto.setStatus(status);

            result.add(dto);
        }

        return result;
    }
}
