package com.example.demo.service;

import com.example.demo.dto.LeaveRequestDTO;
import com.example.demo.dto.CreateLeaveRequestDTO;
import com.example.demo.entity.Employee;
import com.example.demo.entity.LeaveRequest;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class LeaveRequestServiceV2 {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH);

    public List<LeaveRequestDTO> getAll(String statusFilter) {
        List<LeaveRequest> all = leaveRequestRepository.findAll();
        List<LeaveRequest> raw = new ArrayList<>();

        if (statusFilter == null || statusFilter.isBlank()) {
            raw = all;
        } else {
            String sf = statusFilter.toLowerCase();
            for (LeaveRequest lr : all) {
                String s = lr.getIsApproved() == null ? "pending" : (lr.getIsApproved() ? "approved" : "rejected");
                if (sf.equals(s)) raw.add(lr);
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

    public LeaveRequestDTO updateApproval(Long id, Boolean approved) {
        var opt = leaveRequestRepository.findById(id);
        if (opt.isEmpty()) return null;
        LeaveRequest lr = opt.get();
        lr.setIsApproved(approved);
        leaveRequestRepository.save(lr);

        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setId(lr.getId());

        var emp = lr.getEmployeeCreate() != null ? employeeRepository.findById(lr.getEmployeeCreate()).orElse(null) : null;
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

        return dto;
    }

    public LeaveRequestDTO create(CreateLeaveRequestDTO createDTO) {
        LeaveRequest lr = new LeaveRequest();
        lr.setStartDate(LocalDate.parse(createDTO.getStartDate()));
        lr.setEndDate(LocalDate.parse(createDTO.getEndDate()));
        lr.setLeaveType(createDTO.getLeaveType());
        lr.setReason(createDTO.getReason());
        lr.setEmployeeCreate(createDTO.getEmployeeCreate());
        lr.setIsApproved(null); // Pending by default
        lr.setCreatedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(lr);

        LeaveRequestDTO dto = new LeaveRequestDTO();
        dto.setId(saved.getId());

        var emp = saved.getEmployeeCreate() != null ? employeeRepository.findById(saved.getEmployeeCreate()).orElse(null) : null;
        String fullName = emp != null ? emp.getFName() + (emp.getMName() != null ? " " + emp.getMName() : "") + " " + emp.getLName() : "Unknown";
        dto.setName(fullName);
        dto.setRole(emp != null ? emp.getType() : "Employee");
        dto.setAvatar("https://i.pravatar.cc/100?u=" + (emp != null ? emp.getId() : saved.getId()));

        if (saved.getStartDate() != null && saved.getEndDate() != null) {
            long days = ChronoUnit.DAYS.between(saved.getStartDate(), saved.getEndDate()) + 1;
            dto.setDuration(days + " days");
            String dateRange = saved.getStartDate().format(DATE_FMT) + " – " + saved.getEndDate().format(DATE_FMT);
            dto.setDate(dateRange);
        } else if (saved.getStartDate() != null) {
            dto.setDuration("1 day");
            dto.setDate(saved.getStartDate().format(DATE_FMT));
        }

        dto.setType(saved.getLeaveType());
        dto.setReason(saved.getReason());
        dto.setStatus("pending");

        return dto;
    }
}
