package com.portfolio.metals.model;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * JPA Entity representing a single metal purchase or holding.
 */
@Entity
@Table(name = "metal_transactions")
public class MetalTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MetalType metal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoryType category;

    @Column(nullable = false)
    private double grams;

    @Column(name = "rate_bought", nullable = false)
    private double rateBought;

    @Column(nullable = false)
    private double deduction; // e.g. 4.0 for 4%

    @Column(name = "buy_date", nullable = false)
    private LocalDate date;

    @Column(name = "user_id")
    private String userId = "default_user"; // Multi-user partition identifier

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    public MetalTransaction() {
    }

    public MetalTransaction(MetalType metal, CategoryType category, double grams, double rateBought, double deduction, LocalDate date) {
        this.metal = metal;
        this.category = category;
        this.grams = grams;
        this.rateBought = rateBought;
        this.deduction = deduction;
        this.date = date;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public MetalType getMetal() {
        return metal;
    }

    public void setMetal(MetalType metal) {
        this.metal = metal;
    }

    public CategoryType getCategory() {
        return category;
    }

    public void setCategory(CategoryType category) {
        this.category = category;
    }

    public double getGrams() {
        return grams;
    }

    public void setGrams(double grams) {
        this.grams = grams;
    }

    public double getRateBought() {
        return rateBought;
    }

    public void setRateBought(double rateBought) {
        this.rateBought = rateBought;
    }

    public double getDeduction() {
        return deduction;
    }

    public void setDeduction(double deduction) {
        this.deduction = deduction;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
