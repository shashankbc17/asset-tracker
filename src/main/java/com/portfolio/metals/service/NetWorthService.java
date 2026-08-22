package com.portfolio.metals.service;

import com.portfolio.metals.model.*;
import com.portfolio.metals.repository.AssetRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service to calculate valuations, returns, and allocations for all asset classes.
 */
@Service
public class NetWorthService {

    private final AssetRepository assetRepository;
    private final PriceService priceService;

    public NetWorthService(AssetRepository assetRepository, PriceService priceService) {
        this.assetRepository = assetRepository;
        this.priceService = priceService;
    }

    public List<Asset> getAllAssets(String userId) {
        return assetRepository.findByUserIdOrderByDisplayOrderAscIdDesc(userId);
    }

    public List<Asset> getAssetsByType(String userId, AssetType assetType) {
        return assetRepository.findByUserIdAndAssetTypeOrderByDisplayOrderAscIdDesc(userId, assetType);
    }

    public Optional<Asset> getAssetById(Long id) {
        return assetRepository.findById(id);
    }

    public Asset saveAsset(Asset asset) {
        if (asset.getUserId() == null || asset.getUserId().trim().isEmpty()) {
            asset.setUserId("default_user");
        }
        if (asset.getPurchaseDate() == null) {
            asset.setPurchaseDate(LocalDate.now());
        }

        // Auto-compute invested amount if specific parameters provided
        if (asset.getAssetType() == AssetType.PRECIOUS_METALS && asset.getGrams() != null && asset.getRateBought() != null) {
            asset.setInvestedAmount(asset.getGrams() * asset.getRateBought());
        } else if (asset.getAssetType() == AssetType.EQUITY && asset.getQuantity() != null && asset.getBuyPrice() != null) {
            asset.setInvestedAmount(asset.getQuantity() * asset.getBuyPrice());
        }

        return assetRepository.save(asset);
    }

    public void deleteAsset(Long id) {
        assetRepository.deleteById(id);
    }

    /**
     * Calculates financial metrics for an individual asset holding.
     */
    public AssetMetrics calculateAssetMetrics(Asset asset, MetalRates rates, LocalDate referenceDate) {
        double invested = Math.max(0, asset.getInvestedAmount());
        double grossValue = invested;
        double currentValue = invested;
        String imagePath = "/images/gold-bar.jpg";
        String categoryBadge = asset.getAssetType().getDisplayName();
        String keyMetricDisplay = "";

        LocalDate refDate = (referenceDate != null) ? referenceDate : LocalDate.now();
        double yearsHeld = 0.0;
        if (asset.getPurchaseDate() != null) {
            long daysHeld = ChronoUnit.DAYS.between(asset.getPurchaseDate(), refDate);
            yearsHeld = Math.max(0, daysHeld / 365.25);
        }

        switch (asset.getAssetType()) {
            case PRECIOUS_METALS: {
                double grams = (asset.getGrams() != null) ? asset.getGrams() : 0.0;
                double rateBought = (asset.getRateBought() != null) ? asset.getRateBought() : 0.0;
                double deduction = (asset.getDeduction() != null) ? asset.getDeduction() : 0.0;
                MetalType metal = (asset.getMetalType() != null) ? asset.getMetalType() : MetalType.GOLD;
                CategoryType cat = (asset.getCategoryType() != null) ? asset.getCategoryType() : CategoryType.COIN_BAR;

                invested = grams * rateBought;
                double currentSpot = (metal == MetalType.GOLD) ? rates.getGoldRate() : rates.getSilverRate();
                grossValue = grams * currentSpot;
                currentValue = grossValue - (grossValue * (deduction / 100.0));

                if (metal == MetalType.GOLD) {
                    imagePath = (cat == CategoryType.COIN_BAR) ? "/images/gold-bar.jpg" : "/images/gold-jewelry.jpg";
                } else {
                    imagePath = (cat == CategoryType.COIN_BAR) ? "/images/silver-bar.jpg" : "/images/silver-jewelry.jpg";
                }

                categoryBadge = metal.getDisplayName() + " • " + cat.getDisplayName();
                keyMetricDisplay = String.format("%.2f g @ ₹%,.0f/g", grams, rateBought);
                break;
            }

            case EQUITY: {
                double qty = (asset.getQuantity() != null) ? asset.getQuantity() : 0.0;
                double buyPrice = (asset.getBuyPrice() != null) ? asset.getBuyPrice() : 0.0;
                double curPrice = (asset.getCurrentPrice() != null && asset.getCurrentPrice() > 0) ? asset.getCurrentPrice() : buyPrice;

                invested = qty * buyPrice;
                grossValue = qty * curPrice;
                currentValue = grossValue;

                imagePath = "/images/equity.jpg";
                categoryBadge = (asset.getTicker() != null && !asset.getTicker().isEmpty()) ? asset.getTicker() : "Stock/ETF";
                keyMetricDisplay = String.format("%.0f Units @ ₹%,.0f (CMP: ₹%,.0f)", qty, buyPrice, curPrice);
                break;
            }

            case REAL_ESTATE: {
                invested = asset.getInvestedAmount();
                double appraisal = (asset.getEstimatedMarketValue() != null && asset.getEstimatedMarketValue() > 0) 
                        ? asset.getEstimatedMarketValue() 
                        : invested;
                grossValue = appraisal;
                currentValue = appraisal;

                imagePath = "/images/real-estate.jpg";
                categoryBadge = (asset.getLocation() != null && !asset.getLocation().isEmpty()) ? asset.getLocation() : "Property";
                String areaStr = (asset.getAreaSqFt() != null && asset.getAreaSqFt() > 0) ? String.format("%.0f sq ft", asset.getAreaSqFt()) : "Real Estate";
                String rentStr = (asset.getMonthlyRentalIncome() != null && asset.getMonthlyRentalIncome() > 0) ? String.format(" • Rent: ₹%,.0f/mo", asset.getMonthlyRentalIncome()) : "";
                keyMetricDisplay = areaStr + rentStr;
                break;
            }

            case CASH_SAVINGS: {
                invested = asset.getInvestedAmount();
                double rate = (asset.getInterestRatePct() != null) ? asset.getInterestRatePct() : 0.0;
                // Simple interest estimate over years held
                double accruedInterest = (rate > 0 && yearsHeld > 0) ? invested * (rate / 100.0) * yearsHeld : 0.0;
                grossValue = invested + accruedInterest;
                currentValue = grossValue;

                imagePath = "/images/cash.jpg";
                categoryBadge = (asset.getBankName() != null && !asset.getBankName().isEmpty()) ? asset.getBankName() : "Cash / FD";
                keyMetricDisplay = (rate > 0) ? String.format("%.2f%% p.a. Interest", rate) : "Liquid Balance";
                break;
            }
        }

        double profitLoss = currentValue - invested;
        double returnPct = (invested > 0) ? (profitLoss / invested) * 100.0 : 0.0;
        boolean isProfitable = profitLoss >= 0;

        Double cagr = null;
        String cagrDisplay = "(< 1 yr)";
        if (yearsHeld >= 1.0 && invested > 0) {
            if (currentValue > 0) {
                cagr = (Math.pow(currentValue / invested, 1.0 / yearsHeld) - 1.0) * 100.0;
                String sign = cagr >= 0 ? "+" : "";
                cagrDisplay = String.format("%s%.2f%% p.a.", sign, cagr);
            } else {
                cagr = -100.0;
                cagrDisplay = "-100.00% p.a.";
            }
        }

        AssetMetrics metrics = new AssetMetrics();
        metrics.setInvestedAmount(invested);
        metrics.setGrossValue(grossValue);
        metrics.setCurrentValue(currentValue);
        metrics.setProfitLoss(profitLoss);
        metrics.setReturnPct(returnPct);
        metrics.setProfitable(isProfitable);
        metrics.setCagr(cagr);
        metrics.setCagrDisplay(cagrDisplay);
        metrics.setImagePath(imagePath);
        metrics.setCategoryBadge(categoryBadge);
        metrics.setKeyMetricDisplay(keyMetricDisplay);

        return metrics;
    }

    /**
     * Calculates the entire personal Net Worth summary and allocation distribution.
     */
    public NetWorthSummary getNetWorthSummary(String userId) {
        MetalRates rates = priceService.getCurrentRates();
        List<Asset> assets = assetRepository.findByUserIdOrderByDisplayOrderAscIdDesc(userId);

        double totalNetWorth = 0.0;
        double totalInvested = 0.0;
        double totalProfitLoss = 0.0;

        Map<AssetType, AssetAllocation> allocMap = new EnumMap<>(AssetType.class);
        for (AssetType type : AssetType.values()) {
            allocMap.put(type, new AssetAllocation(type, type.getDisplayName(), type.getIcon()));
        }

        List<NetWorthSummary.AssetWithMetrics> items = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Asset asset : assets) {
            AssetMetrics metrics = calculateAssetMetrics(asset, rates, today);
            totalNetWorth += metrics.getCurrentValue();
            totalInvested += metrics.getInvestedAmount();
            totalProfitLoss += metrics.getProfitLoss();

            AssetAllocation alloc = allocMap.get(asset.getAssetType());
            if (alloc != null) {
                alloc.setInvestedAmount(alloc.getInvestedAmount() + metrics.getInvestedAmount());
                alloc.setCurrentValue(alloc.getCurrentValue() + metrics.getCurrentValue());
                alloc.setProfitLoss(alloc.getProfitLoss() + metrics.getProfitLoss());
                alloc.setCount(alloc.getCount() + 1);
            }

            items.add(new NetWorthSummary.AssetWithMetrics(asset, metrics));
        }

        // Calculate allocation percentages and returns
        List<AssetAllocation> allocations = new ArrayList<>();
        for (AssetAllocation alloc : allocMap.values()) {
            if (alloc.getInvestedAmount() > 0) {
                alloc.setReturnPct(((alloc.getCurrentValue() - alloc.getInvestedAmount()) / alloc.getInvestedAmount()) * 100.0);
            }
            if (totalNetWorth > 0) {
                alloc.setPercentageOfNetWorth((alloc.getCurrentValue() / totalNetWorth) * 100.0);
            }
            allocations.add(alloc);
        }

        double overallReturnPct = (totalInvested > 0) ? (totalProfitLoss / totalInvested) * 100.0 : 0.0;

        NetWorthSummary summary = new NetWorthSummary();
        summary.setTotalNetWorth(totalNetWorth);
        summary.setTotalInvested(totalInvested);
        summary.setTotalProfitLoss(totalProfitLoss);
        summary.setOverallReturnPct(overallReturnPct);
        summary.setNetProfitable(totalProfitLoss >= 0);
        summary.setRates(rates);
        summary.setAllocations(allocations);
        summary.setItems(items);

        return summary;
    }
}
