package com.portfolio.metals.model;

import java.util.List;
import java.util.Map;

/**
 * Global Net Worth Summary and multi-asset analytics DTO.
 */
public class NetWorthSummary {
    private double totalNetWorth;
    private double totalInvested;
    private double totalProfitLoss;
    private double overallReturnPct;
    private boolean isNetProfitable;

    private MetalRates rates;
    private List<AssetAllocation> allocations;
    private List<AssetWithMetrics> items;

    public static class AssetWithMetrics {
        private Asset asset;
        private AssetMetrics metrics;

        public AssetWithMetrics(Asset asset, AssetMetrics metrics) {
            this.asset = asset;
            this.metrics = metrics;
        }

        public Asset getAsset() {
            return asset;
        }

        public void setAsset(Asset asset) {
            this.asset = asset;
        }

        public AssetMetrics getMetrics() {
            return metrics;
        }

        public void setMetrics(AssetMetrics metrics) {
            this.metrics = metrics;
        }
    }

    public NetWorthSummary() {
    }

    public double getTotalNetWorth() {
        return totalNetWorth;
    }

    public void setTotalNetWorth(double totalNetWorth) {
        this.totalNetWorth = totalNetWorth;
    }

    public double getTotalInvested() {
        return totalInvested;
    }

    public void setTotalInvested(double totalInvested) {
        this.totalInvested = totalInvested;
    }

    public double getTotalProfitLoss() {
        return totalProfitLoss;
    }

    public void setTotalProfitLoss(double totalProfitLoss) {
        this.totalProfitLoss = totalProfitLoss;
    }

    public double getOverallReturnPct() {
        return overallReturnPct;
    }

    public void setOverallReturnPct(double overallReturnPct) {
        this.overallReturnPct = overallReturnPct;
    }

    public boolean isNetProfitable() {
        return isNetProfitable;
    }

    public void setNetProfitable(boolean netProfitable) {
        isNetProfitable = netProfitable;
    }

    public MetalRates getRates() {
        return rates;
    }

    public void setRates(MetalRates rates) {
        this.rates = rates;
    }

    public List<AssetAllocation> getAllocations() {
        return allocations;
    }

    public void setAllocations(List<AssetAllocation> allocations) {
        this.allocations = allocations;
    }

    public List<AssetWithMetrics> getItems() {
        return items;
    }

    public void setItems(List<AssetWithMetrics> items) {
        this.items = items;
    }
}
