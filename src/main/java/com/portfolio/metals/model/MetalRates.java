package com.portfolio.metals.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * Entity holding current market spot rates per gram (in INR ₹).
 */
@Entity
@Table(name = "metal_rates")
public class MetalRates {

    @Id
    private Long id = 1L;

    private double goldRate = 14900.0;
    private double silverRate = 240.0;
    private LocalDateTime lastUpdated = LocalDateTime.now();

    public MetalRates() {
    }

    public MetalRates(double goldRate, double silverRate) {
        this.goldRate = goldRate;
        this.silverRate = silverRate;
        this.lastUpdated = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public double getGoldRate() {
        return goldRate;
    }

    public void setGoldRate(double goldRate) {
        this.goldRate = goldRate;
    }

    public double getSilverRate() {
        return silverRate;
    }

    public void setSilverRate(double silverRate) {
        this.silverRate = silverRate;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
