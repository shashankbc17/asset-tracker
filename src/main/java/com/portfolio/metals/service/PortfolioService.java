package com.portfolio.metals.service;

import com.portfolio.metals.model.*;
import com.portfolio.metals.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Business service for managing transactions and calculating portfolio analytics.
 */
@Service
public class PortfolioService {

    private final TransactionRepository transactionRepository;
    private final PriceService priceService;

    public PortfolioService(TransactionRepository transactionRepository, PriceService priceService) {
        this.transactionRepository = transactionRepository;
        this.priceService = priceService;
    }

    public List<MetalTransaction> getAllTransactions(String userId) {
        return transactionRepository.findByUserIdOrderByDisplayOrderAscIdDesc(userId);
    }

    public Optional<MetalTransaction> getTransactionById(Long id) {
        return transactionRepository.findById(id);
    }

    public MetalTransaction saveTransaction(MetalTransaction transaction) {
        if (transaction.getUserId() == null || transaction.getUserId().trim().isEmpty()) {
            transaction.setUserId("default_user");
        }
        if (transaction.getDate() == null) {
            transaction.setDate(LocalDate.now());
        }
        return transactionRepository.save(transaction);
    }

    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }

    public void clearPortfolio(String userId) {
        transactionRepository.deleteByUserId(userId);
    }

    /**
     * Calculates financial metrics for a single holding.
     */
    public RecordMetrics calculateMetrics(MetalTransaction record, double currentRate, LocalDate referenceDate) {
        double grams = Math.max(0, record.getGrams());
        double rateBought = Math.max(0, record.getRateBought());
        double deduction = Math.max(0, record.getDeduction());

        double invested = grams * rateBought;
        double grossValue = grams * currentRate;
        double liquidValue = grossValue - (grossValue * (deduction / 100.0));

        double totalReturnPct = 0.0;
        boolean isProfitable = true;
        if (invested > 0) {
            totalReturnPct = ((liquidValue - invested) / invested) * 100.0;
            isProfitable = totalReturnPct >= 0;
        }

        // Calculate CAGR if held for >= 1 year
        Double cagr = null;
        String cagrDisplay = "(< 1 yr)";

        if (record.getDate() != null && invested > 0) {
            long daysHeld = ChronoUnit.DAYS.between(record.getDate(), referenceDate != null ? referenceDate : LocalDate.now());
            double yearsHeld = daysHeld / 365.25;

            if (yearsHeld >= 1.0) {
                if (liquidValue > 0) {
                    cagr = (Math.pow(liquidValue / invested, 1.0 / yearsHeld) - 1.0) * 100.0;
                    String sign = cagr >= 0 ? "+" : "";
                    cagrDisplay = String.format("%s%.2f%% p.a.", sign, cagr);
                } else {
                    cagr = -100.0;
                    cagrDisplay = "-100.00% p.a.";
                }
            }
        }

        RecordMetrics metrics = new RecordMetrics();
        metrics.setInvested(invested);
        metrics.setGrossValue(grossValue);
        metrics.setLiquidValue(liquidValue);
        metrics.setTotalReturnPct(totalReturnPct);
        metrics.setProfitable(isProfitable);
        metrics.setCagr(cagr);
        metrics.setCagrDisplay(cagrDisplay);

        return metrics;
    }

    /**
     * Computes complete portfolio summary and metrics for all holdings.
     */
    public PortfolioSummary getPortfolioSummary(String userId) {
        MetalRates rates = priceService.getCurrentRates();
        List<MetalTransaction> transactions = transactionRepository.findByUserIdOrderByDisplayOrderAscIdDesc(userId);

        double totalInvested = 0.0;
        double totalGross = 0.0;
        double totalLiquid = 0.0;
        double totalGoldGrams = 0.0;
        double totalSilverGrams = 0.0;
        double goldLiquidValue = 0.0;
        double silverLiquidValue = 0.0;

        List<PortfolioSummary.TransactionWithMetrics> items = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (MetalTransaction tx : transactions) {
            double currentRate = (tx.getMetal() == MetalType.GOLD) ? rates.getGoldRate() : rates.getSilverRate();
            RecordMetrics metrics = calculateMetrics(tx, currentRate, today);

            totalInvested += metrics.getInvested();
            totalGross += metrics.getGrossValue();
            totalLiquid += metrics.getLiquidValue();

            if (tx.getMetal() == MetalType.GOLD) {
                totalGoldGrams += tx.getGrams();
                goldLiquidValue += metrics.getLiquidValue();
            } else {
                totalSilverGrams += tx.getGrams();
                silverLiquidValue += metrics.getLiquidValue();
            }

            items.add(new PortfolioSummary.TransactionWithMetrics(tx, metrics));
        }

        double netProfit = totalLiquid - totalInvested;
        double netReturnPct = totalInvested > 0 ? ((totalLiquid - totalInvested) / totalInvested) * 100.0 : 0.0;

        PortfolioSummary summary = new PortfolioSummary();
        summary.setTotalInvested(totalInvested);
        summary.setTotalGross(totalGross);
        summary.setTotalLiquid(totalLiquid);
        summary.setNetProfit(netProfit);
        summary.setNetReturnPct(netReturnPct);
        summary.setNetProfitable(netProfit >= 0);
        summary.setTotalGoldGrams(totalGoldGrams);
        summary.setTotalSilverGrams(totalSilverGrams);
        summary.setGoldLiquidValue(goldLiquidValue);
        summary.setSilverLiquidValue(silverLiquidValue);
        summary.setRates(rates);
        summary.setItems(items);

        return summary;
    }
}
