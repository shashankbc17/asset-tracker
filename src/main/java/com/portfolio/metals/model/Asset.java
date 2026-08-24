package com.portfolio.metals.model;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Unified JPA Entity representing an asset holding across any asset class.
 */
@Entity
@Table(name = "portfolio_assets")
public class Asset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetType assetType;

    @Column(nullable = false)
    private String name; // e.g. "22K Gold Bangles", "TCS Shares", "3BHK Whitefield Flat", "HDFC Tax-Saver FD"

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "invested_amount", nullable = false)
    private double investedAmount;

    @Column(name = "user_id")
    private String userId = "default_user";

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(length = 1000)
    private String notes;

    // --- Precious Metals Specific Attributes ---
    @Enumerated(EnumType.STRING)
    private MetalType metalType; // GOLD, SILVER

    @Enumerated(EnumType.STRING)
    private CategoryType categoryType; // JEWELRY, COIN_BAR

    private Double grams;
    private Double rateBought;
    private Double deduction; // percentage (e.g. 4.0 for 4%)

    // --- Equities & Mutual Funds Specific Attributes ---
    private String ticker; // e.g. "TCS.NS", "NIFTYBEES"
    private Double quantity; // Number of shares / units
    private Double buyPrice; // Buy price per share
    private Double currentPrice; // Current market price per share

    // --- Real Estate Specific Attributes ---
    private String location; // e.g. "Bengaluru, Indiranagar"
    private Double areaSqFt; // e.g. 1850.0
    private Double estimatedMarketValue; // Current appraised value
    private Double monthlyRentalIncome; // Monthly rental earnings

    // --- Cash & Fixed Deposits Specific Attributes ---
    private String bankName; // e.g. "HDFC Bank", "SBI"
    private Double interestRatePct; // Annual interest rate (e.g. 7.1%)
    private LocalDate maturityDate;

    // --- Provident Fund (EPF / PPF / VPF) Specific Attributes ---
    private String pfSchemeType; // EPF, PPF, VPF
    private String uanOrAccountId; // UAN number or Account ID
    private Boolean isActiveContribution; // true = Active job with monthly deduction, false = Dormant/no job
    private Double monthlyContribution; // Monthly employee + employer deduction (₹)
    private Double pfInterestRate; // Govt annual interest rate % (e.g. 8.25%)

    public Asset() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDate getPurchaseDate() {
        return purchaseDate;
    }

    public void setPurchaseDate(LocalDate purchaseDate) {
        this.purchaseDate = purchaseDate;
    }

    public double getInvestedAmount() {
        return investedAmount;
    }

    public void setInvestedAmount(double investedAmount) {
        this.investedAmount = investedAmount;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public MetalType getMetalType() {
        return metalType;
    }

    public void setMetalType(MetalType metalType) {
        this.metalType = metalType;
    }

    public CategoryType getCategoryType() {
        return categoryType;
    }

    public void setCategoryType(CategoryType categoryType) {
        this.categoryType = categoryType;
    }

    public Double getGrams() {
        return grams;
    }

    public void setGrams(Double grams) {
        this.grams = grams;
    }

    public Double getRateBought() {
        return rateBought;
    }

    public void setRateBought(Double rateBought) {
        this.rateBought = rateBought;
    }

    public Double getDeduction() {
        return deduction;
    }

    public void setDeduction(Double deduction) {
        this.deduction = deduction;
    }

    public String getTicker() {
        return ticker;
    }

    public void setTicker(String ticker) {
        this.ticker = ticker;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public Double getBuyPrice() {
        return buyPrice;
    }

    public void setBuyPrice(Double buyPrice) {
        this.buyPrice = buyPrice;
    }

    public Double getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(Double currentPrice) {
        this.currentPrice = currentPrice;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getAreaSqFt() {
        return areaSqFt;
    }

    public void setAreaSqFt(Double areaSqFt) {
        this.areaSqFt = areaSqFt;
    }

    public Double getEstimatedMarketValue() {
        return estimatedMarketValue;
    }

    public void setEstimatedMarketValue(Double estimatedMarketValue) {
        this.estimatedMarketValue = estimatedMarketValue;
    }

    public Double getMonthlyRentalIncome() {
        return monthlyRentalIncome;
    }

    public void setMonthlyRentalIncome(Double monthlyRentalIncome) {
        this.monthlyRentalIncome = monthlyRentalIncome;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public Double getInterestRatePct() {
        return interestRatePct;
    }

    public void setInterestRatePct(Double interestRatePct) {
        this.interestRatePct = interestRatePct;
    }

    public LocalDate getMaturityDate() {
        return maturityDate;
    }

    public void setMaturityDate(LocalDate maturityDate) {
        this.maturityDate = maturityDate;
    }

    public String getPfSchemeType() {
        return pfSchemeType;
    }

    public void setPfSchemeType(String pfSchemeType) {
        this.pfSchemeType = pfSchemeType;
    }

    public String getUanOrAccountId() {
        return uanOrAccountId;
    }

    public void setUanOrAccountId(String uanOrAccountId) {
        this.uanOrAccountId = uanOrAccountId;
    }

    public Boolean getIsActiveContribution() {
        return isActiveContribution;
    }

    public void setIsActiveContribution(Boolean isActiveContribution) {
        this.isActiveContribution = isActiveContribution;
    }

    public Double getMonthlyContribution() {
        return monthlyContribution;
    }

    public void setMonthlyContribution(Double monthlyContribution) {
        this.monthlyContribution = monthlyContribution;
    }

    public Double getPfInterestRate() {
        return pfInterestRate;
    }

    public void setPfInterestRate(Double pfInterestRate) {
        this.pfInterestRate = pfInterestRate;
    }
}
