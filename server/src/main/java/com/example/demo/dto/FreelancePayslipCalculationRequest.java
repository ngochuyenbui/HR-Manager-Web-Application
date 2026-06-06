package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class FreelancePayslipCalculationRequest {
    private Long employeeId;
    // Không bắt buộc truyền contractId từ FE nếu Service tự tìm contract active mới nhất
    // Nhưng nếu muốn chính xác thì giữ lại.
    private Long contractId; 
    
    private Integer month;
    private Integer year;

    // Danh sách tên các khoản thưởng trong hợp đồng được chọn (Select Box)
    // Ví dụ: ["Early Completion"]
    private List<String> selectedBonuses;

    // Danh sách tên các khoản phạt trong hợp đồng được chọn
    // Ví dụ: ["Late Delivery"]
    private List<String> selectedPenalties;
}