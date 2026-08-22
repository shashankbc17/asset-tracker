package com.portfolio.metals;

import com.portfolio.metals.model.*;
import com.portfolio.metals.repository.AssetRepository;
import com.portfolio.metals.repository.MetalRatesRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDate;
import java.util.List;

/**
 * Main Spring Boot Application Entrypoint with Multi-Asset seed data.
 */
@SpringBootApplication
public class PreciousMetalsApplication {

    public static void main(String[] args) {
        SpringApplication.run(PreciousMetalsApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(AssetRepository assetRepository, MetalRatesRepository ratesRepository) {
        return args -> {
            // Initialize default rates if empty
            if (ratesRepository.count() == 0) {
                ratesRepository.save(new MetalRates(14900.0, 240.0));
            }

            // Seed initial diverse multi-asset portfolio if empty
            if (assetRepository.count() == 0) {
                List<Asset> sampleAssets = List.of(
                    // 1. Precious Metals Holdings
                    createMetalAsset("24K Gold Bar", MetalType.GOLD, CategoryType.COIN_BAR, 10.0, 12499.0, 0.0, LocalDate.of(2025, 12, 23), 1),
                    createMetalAsset("999 Silver Bar", MetalType.SILVER, CategoryType.COIN_BAR, 500.0, 230.0, 0.0, LocalDate.of(2025, 12, 23), 2),
                    createMetalAsset("22K Bridal Gold Necklace", MetalType.GOLD, CategoryType.JEWELRY, 80.2, 11865.0, 4.0, LocalDate.of(2025, 11, 2), 3),
                    createMetalAsset("Silver Ingot Bullion", MetalType.SILVER, CategoryType.COIN_BAR, 2000.0, 213.0, 0.0, LocalDate.of(2025, 11, 2), 4),
                    createMetalAsset("Silver Puja Coins", MetalType.SILVER, CategoryType.COIN_BAR, 1000.0, 190.0, 0.0, LocalDate.of(2025, 11, 2), 5),
                    createMetalAsset("Gold Minted Coin", MetalType.GOLD, CategoryType.COIN_BAR, 1.0, 10190.0, 0.0, LocalDate.of(2025, 9, 14), 6),
                    createMetalAsset("22K Gold Bangles", MetalType.GOLD, CategoryType.JEWELRY, 41.0, 8755.0, 4.0, LocalDate.of(2025, 5, 3), 7),

                    // 2. Equities & Mutual Funds
                    createEquityAsset("TCS (Tata Consultancy Services)", "TCS", 100.0, 3450.0, 4120.0, LocalDate.of(2024, 6, 15), 8),
                    createEquityAsset("Nifty 50 Index ETF", "NIFTYBEES", 500.0, 215.0, 268.0, LocalDate.of(2024, 3, 10), 9),

                    // 3. Real Estate
                    createRealEstateAsset("Indiranagar Luxury 3BHK", "Bengaluru, Indiranagar", 1850.0, 12500000.0, 16000000.0, 65000.0, LocalDate.of(2023, 1, 15), 10),
                    createRealEstateAsset("North Bangalore Villa Plot", "Devanahalli, Bengaluru", 2400.0, 4500000.0, 6800000.0, 0.0, LocalDate.of(2022, 8, 20), 11),

                    // 4. Cash & Fixed Deposits
                    createCashAsset("HDFC High Yield 1-Yr FD", "HDFC Bank", 1000000.0, 7.25, LocalDate.of(2025, 4, 1), LocalDate.of(2026, 4, 1), 12),
                    createCashAsset("SBI Emergency Liquid Reserve", "State Bank of India", 500000.0, 3.50, LocalDate.of(2025, 1, 1), null, 13)
                );

                assetRepository.saveAll(sampleAssets);
                System.out.println(">>> Successfully seeded " + sampleAssets.size() + " Multi-Asset records (Metals, Stocks, Real Estate, FDs) into the database!");
            }
        };
    }

    private Asset createMetalAsset(String name, MetalType metal, CategoryType category, double grams, double buyRate, double deduction, LocalDate date, int order) {
        Asset asset = new Asset();
        asset.setName(name);
        asset.setAssetType(AssetType.PRECIOUS_METALS);
        asset.setMetalType(metal);
        asset.setCategoryType(category);
        asset.setGrams(grams);
        asset.setRateBought(buyRate);
        asset.setDeduction(deduction);
        asset.setInvestedAmount(grams * buyRate);
        asset.setPurchaseDate(date);
        asset.setDisplayOrder(order);
        return asset;
    }

    private Asset createEquityAsset(String name, String ticker, double qty, double buyPrice, double curPrice, LocalDate date, int order) {
        Asset asset = new Asset();
        asset.setName(name);
        asset.setAssetType(AssetType.EQUITY);
        asset.setTicker(ticker);
        asset.setQuantity(qty);
        asset.setBuyPrice(buyPrice);
        asset.setCurrentPrice(curPrice);
        asset.setInvestedAmount(qty * buyPrice);
        asset.setPurchaseDate(date);
        asset.setDisplayOrder(order);
        return asset;
    }

    private Asset createRealEstateAsset(String name, String location, double areaSqFt, double purchasePrice, double currentVal, double monthlyRent, LocalDate date, int order) {
        Asset asset = new Asset();
        asset.setName(name);
        asset.setAssetType(AssetType.REAL_ESTATE);
        asset.setLocation(location);
        asset.setAreaSqFt(areaSqFt);
        asset.setInvestedAmount(purchasePrice);
        asset.setEstimatedMarketValue(currentVal);
        asset.setMonthlyRentalIncome(monthlyRent);
        asset.setPurchaseDate(date);
        asset.setDisplayOrder(order);
        return asset;
    }

    private Asset createCashAsset(String name, String bankName, double depositAmount, double interestRate, LocalDate date, LocalDate maturityDate, int order) {
        Asset asset = new Asset();
        asset.setName(name);
        asset.setAssetType(AssetType.CASH_SAVINGS);
        asset.setBankName(bankName);
        asset.setInvestedAmount(depositAmount);
        asset.setInterestRatePct(interestRate);
        asset.setPurchaseDate(date);
        asset.setMaturityDate(maturityDate);
        asset.setDisplayOrder(order);
        return asset;
    }
}
