package com.example.demo.controller;

import com.example.demo.dto.LeaveRequestDTO;
import com.example.demo.dto.CreateLeaveRequestDTO;
import com.example.demo.service.LeaveRequestServiceV2;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestServiceV2 leaveRequestServiceV2;

    @GetMapping
    public List<LeaveRequestDTO> list(@RequestParam(value = "status", required = false) String status) {
        return leaveRequestServiceV2.getAll(status);
    }

    @PostMapping("/{id}/approve")
    public LeaveRequestDTO approve(@PathVariable("id") Long id) {
        return leaveRequestServiceV2.updateApproval(id, Boolean.TRUE);
    }

    @PostMapping("/{id}/reject")
    public LeaveRequestDTO reject(@PathVariable("id") Long id) {
        return leaveRequestServiceV2.updateApproval(id, Boolean.FALSE);
    }

    @PostMapping
    public LeaveRequestDTO create(@RequestBody CreateLeaveRequestDTO createDTO) {
        return leaveRequestServiceV2.create(createDTO);
    }
}
