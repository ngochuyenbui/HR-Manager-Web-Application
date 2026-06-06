package com.example.demo.entity.subtable;

import java.io.Serializable;
import java.util.Objects;

// Class này đại diện cho cặp khóa chính (payslip_id + stt)
public class PayslipComponentId implements Serializable {
    private Long payslipId;
    private Integer stt;

    public PayslipComponentId() {}

    public PayslipComponentId(Long payslipId, Integer stt) {
        this.payslipId = payslipId;
        this.stt = stt;
    }

    // Bắt buộc phải override equals và hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PayslipComponentId that = (PayslipComponentId) o;
        return Objects.equals(payslipId, that.payslipId) &&
               Objects.equals(stt, that.stt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(payslipId, stt);
    }
}