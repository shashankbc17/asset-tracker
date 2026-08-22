package com.portfolio.metals.model;

/**
 * Breakdown analytics for a specific asset class.
 */
public class AssetAllocation {
    private AssetType assetType;
    private String name;
    private String icon;
    private double investedAmount;
    private double currentValue;
    private double profitLoss;
    private double returnPct;
    private double percentageOfNetWorth;
    private int count;

    public AssetAllocation() {
    }

    public AssetAllocation(AssetType assetType, String name, String icon) {
        this.assetType = assetType;
        this.name = name;
        this.icon = icon;
    }

    public AssetType getAssetType() {
        return assetType;
    }

    public void setAssetType(AssetType assetType) {
        this.assetType = assetType;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public double getInvestedAmount() {
        return investedAmount;
    }

    public void setInvestedAmount(double investedAmount) {
        this.investedAmount = investedAmount;
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

    public double getPercentageOfNetWorth() {
        return percentageOfNetWorth;
    }

    public void setPercentageOfNetWorth(double percentageOfNetWorth) {
        this.percentageOfNetWorth = percentageOfNetWorth;
    }

    public int getCount() {
        return count;
    }

    public void setCount(int count) {
        this.count = count;
    }
}
