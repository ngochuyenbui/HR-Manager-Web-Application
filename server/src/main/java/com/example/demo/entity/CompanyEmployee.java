package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "company_employee")
@Data
public class CompanyEmployee {

    @Id
    @Column(name = "ID")
    private String id;

    @Column(name = "FName")
    private String firstName;

    @Column(name = "LName")
    private String lastName;

    @Column(name = "Email")
    private String email;

    @Column(name = "Phone")
    private String phone;
}
