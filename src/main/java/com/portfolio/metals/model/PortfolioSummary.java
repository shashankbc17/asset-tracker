package com.portfolio.metals.model;

import java.util.List;

/**
 * Aggregated portfolio metrics and statistics DTO.
 */
public class PortfolioSummary {
    private double totalInvested;
    private double totalGross;
    private double totalLiquid;
    private double netProfit;
    private double netReturnPct;
    private boolean isNetProfitable;

    private double totalGoldGrams;
    private double totalSilverGrams;
    private double goldLiquidValue;
    private double silverLiquidValue;

    private MetalRates rates;
    private List<TransactionWithMetrics> items;

    public static class TransactionWithMetrics {
        private MetalTransaction transaction;
        private RecordMetrics metrics;

        public TransactionWithMetrics(MetalTransaction transaction, RecordMetrics metrics) {
            this.transaction = transaction;
            this.metrics = metrics;
        }

        public MetalTransaction getTransaction() {
            return transaction;
        }

        public void setTransaction(MetalTransaction transaction) {
            this.transaction = transaction;
        }

        public RecordMetrics getMetrics() {
            return metrics;
        }

        public void setMetrics(RecordMetrics metrics) {
            this.metrics = metrics;
        }
    }

    public PortfolioSummary() {
    }

    public double getTotalInvested() {
        return totalInvested;
    }

    public void setTotalInvested(double totalInvested) {
        this.totalInvested = totalInvested;
    }

    public double getTotalGross() {
        return totalGross;
    }

    public void setTotalGross(double totalGross) {
        this.totalGross = totalGross;
    }

    public double getTotalLiquid() {
        return totalLiquid;
    }

    public void setTotalLiquid(double totalLiquid) {
        this.totalLiquid = totalLiquid;
    }

    public double getNetProfit() {
        return netProfit;
    }

    public void setNetProfit(double netProfit) {
        this.netProfit = netProfit;
    }

    public double getNetReturnPct() {
        return netReturnPct;
    }

    public void setNetReturnPct(double netReturnPct) {
        this.netReturnPct = netReturnPct;
    }

    public boolean isNetProfitable() {
        return isNetProfitable;
    }

    public void setNetProfitable(boolean netProfitable) {
        isNetProfitable = netProfitable;
    }

    public double getTotalGoldGrams() {
        return totalGoldGrams;
    }

    public void setTotalGoldGrams(double totalGoldGrams) {
        this.totalGoldGrams = totalGoldGrams;
    }

    public double getTotalSilverGrams() {
        return totalSilverGrams;
    }

    public void setTotalSilverGrams(double totalSilverGrams) {
        this.totalSilverGrams = totalSilverGrams;
    }

    public double getGoldLiquidValue() {
        return goldLiquidValue;
    }

    public void setGoldLiquidValue(double goldLiquidValue) {
        this.goldLiquidValue = goldLiquidValue;
    }

    public double getSilverLiquidValue() {
        return silverLiquidValue;
    }

    public void setSilverLiquidValue(double silverLiquidValue) {
        this.silverLiquidValue = silverLiquidValue;
    }

    public MetalRates getRates() {
        return rates;
    }

    public void setRates(MetalRates rates) {
        this.rates = rates;
    }

    public List<TransactionWithMetrics> getItems() {
        return items;
    }

    public void setItems(List<TransactionWithMetrics> items) {
        this.items = items;
    }
}
