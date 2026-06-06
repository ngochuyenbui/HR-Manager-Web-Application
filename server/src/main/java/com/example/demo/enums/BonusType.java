package com.example.demo.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum BonusType {
    
    // --- GROUP 1: MANUAL INPUT (Dùng để nhập liệu trong JSON) ---
    HOLIDAY("holiday", "Holiday Bonus"), // Thưởng lễ, tết (nhập tay)
    OTHER("other", "Other Bonus"),       // Thưởng nóng/khác (nhập tay)

    // --- GROUP 2: CONTRACT AUTOMATION (Tự động lấy từ hợp đồng, không nhập tay) ---
    PERFORMANCE("performance", "Performance Bonus"), // Thưởng hiệu suất (Monthly)
    QUARTERLY("quarterly", "Quarterly Bonus"),       // Thưởng quý (Cycle)
    YEARLY("yearly", "Yearly Bonus");                // Thưởng năm (Cycle)

    private final String key;
    private final String label;
}