package com.portfolio.metals.model;

/**
 * Calculated financial metrics for an individual transaction record.
 */
public class RecordMetrics {
    private double invested;
    private double grossValue;
    private double liquidValue;
    private double totalReturnPct;
    private boolean isProfitable;
    private Double cagr;
    private String cagrDisplay;

    public RecordMetrics() {
    }

    public double getInvested() {
        return invested;
    }

    public void setInvested(double invested) {
        this.invested = invested;
    }

    public double getGrossValue() {
        return grossValue;
    }

    public void setGrossValue(double grossValue) {
        this.grossValue = grossValue;
    }

    public double getLiquidValue() {
        return liquidValue;
    }

    public void setLiquidValue(double liquidValue) {
        this.liquidValue = liquidValue;
    }

    public double getTotalReturnPct() {
        return totalReturnPct;
    }

    public void setTotalReturnPct(double totalReturnPct) {
        this.totalReturnPct = totalReturnPct;
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
}
