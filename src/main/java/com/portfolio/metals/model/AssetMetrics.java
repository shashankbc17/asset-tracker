package com.portfolio.metals.model;

/**
 * Calculated financial metrics for an individual asset.
 */
public class AssetMetrics {
    private double investedAmount;
    private double grossValue;
    private double currentValue; // Liquid/Appraised value
    private double profitLoss;
    private double returnPct;
    private boolean isProfitable;
    private Double cagr;
    private String cagrDisplay;
    private String imagePath;
    private String categoryBadge;
    private String keyMetricDisplay; // e.g. "10.00g @ ₹12,499/g", "50 Shares @ ₹3,800", "1,850 sq ft", "7.10% p.a."

    public AssetMetrics() {
    }

    public double getInvestedAmount() {
        return investedAmount;
    }

    public void setInvestedAmount(double investedAmount) {
        this.investedAmount = investedAmount;
    }

    public double getGrossValue() {
        return grossValue;
    }

    public void setGrossValue(double grossValue) {
        this.grossValue = grossValue;
    }

    public double getCurrentValue() {
        return currentValue;
    }

    public void setCurrentValue(double currentValue) {
        this.currentValue = currentValue;
    }

    public double getProfitLoss() {
        return profitLoss;
    }

    public void setProfitLoss(double profitLoss) {
        this.profitLoss = profitLoss;
    }

    public double getReturnPct() {
        return returnPct;
    }

    public void setReturnPct(double returnPct) {
        this.returnPct = returnPct;
    }

    public boolean isProfitable() {
        return isProfitable;
    }

    public void setProfitable(boolean profitable) {
        isProfitable = profitable;
    }

    public Double getCagr() {
        return cagr;
    }

    public void setCagr(Double cagr) {
        this.cagr = cagr;
    }

    public String getCagrDisplay() {
        return cagrDisplay;
    }

    public void setCagrDisplay(String cagrDisplay) {
        this.cagrDisplay = cagrDisplay;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public String getCategoryBadge() {
        return categoryBadge;
    }

    public void setCategoryBadge(String categoryBadge) {
        this.categoryBadge = categoryBadge;
    }

    public String getKeyMetricDisplay() {
        return keyMetricDisplay;
    }

    public void setKeyMetricDisplay(String keyMetricDisplay) {
        this.keyMetricDisplay = keyMetricDisplay;
    }
}
