package com.example.demo.entity.subtable;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "freelance_actual_penalty")
@IdClass(PayslipComponentId.class)
@Data
public class FreelanceActualPenalty {
    @Id
    @Column(name = "payslip_id")
    private Long payslipId;

    @Id
    @Column(name = "stt")
    private Integer stt;

    @Column(name = "name")
    private String name;

    @Column(name = "amount")
    private BigDecimal amount;
}