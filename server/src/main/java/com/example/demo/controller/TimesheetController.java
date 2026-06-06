package com.example.demo.controller;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import lombok.RequiredArgsConstructor;
import java.util.List;
import com.example.demo.service.TimesheetService;
import com.example.demo.dto.TimesheetMonthViewDTO;

@RestController
@RequestMapping("/api/timesheets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TimesheetController {

    private final TimesheetService timesheetService;

    @GetMapping("/month-view")
    public List<TimesheetMonthViewDTO> getMonthView(
            @RequestParam int year,
            @RequestParam int month
    ) {
        return timesheetService.getMonthView(year, month);
    }
}
