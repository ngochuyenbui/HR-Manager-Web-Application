package com.example.demo.entity.subtable;

import lombok.Data;
import java.io.Serializable;

@Data
public class ContractComponentId implements Serializable {
    private Long contractId;
    private Integer stt;

    public ContractComponentId() {}

    public ContractComponentId(Long contractId, Integer stt) {
        this.contractId = contractId;
        this.stt = stt;
    }
}
