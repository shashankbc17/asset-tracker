package com.portfolio.metals.controller;

import com.portfolio.metals.model.MetalRates;
import com.portfolio.metals.model.MetalTransaction;
import com.portfolio.metals.model.PortfolioSummary;
import com.portfolio.metals.service.PortfolioService;
import com.portfolio.metals.service.PriceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for portfolio transactions, market rates, and analytics summary.
 */
@RestController
@RequestMapping("/api/portfolio")
@CrossOrigin(origins = "*")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final PriceService priceService;

    public PortfolioController(PortfolioService portfolioService, PriceService priceService) {
        this.portfolioService = portfolioService;
        this.priceService = priceService;
    }

    @GetMapping("/summary")
    public ResponseEntity<PortfolioSummary> getSummary(
            @RequestParam(defaultValue = "default_user") String userId) {
        PortfolioSummary summary = portfolioService.getPortfolioSummary(userId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<MetalTransaction>> getTransactions(
            @RequestParam(defaultValue = "default_user") String userId) {
        List<MetalTransaction> transactions = portfolioService.getAllTransactions(userId);
        return ResponseEntity.ok(transactions);
    }

    @PostMapping("/transactions")
    public ResponseEntity<MetalTransaction> addTransaction(@RequestBody MetalTransaction transaction) {
        MetalTransaction saved = portfolioService.saveTransaction(transaction);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/transactions/{id}")
    public ResponseEntity<MetalTransaction> updateTransaction(
            @PathVariable Long id,
            @RequestBody MetalTransaction transactionDetails) {
        return portfolioService.getTransactionById(id).map(existing -> {
            existing.setMetal(transactionDetails.getMetal());
            existing.setCategory(transactionDetails.getCategory());
            existing.setGrams(transactionDetails.getGrams());
            existing.setRateBought(transactionDetails.getRateBought());
            existing.setDeduction(transactionDetails.getDeduction());
            existing.setDate(transactionDetails.getDate());
            if (transactionDetails.getDisplayOrder() != null) {
                existing.setDisplayOrder(transactionDetails.getDisplayOrder());
            }
            MetalTransaction updated = portfolioService.saveTransaction(existing);
            return ResponseEntity.ok(updated);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Map<String, String>> deleteTransaction(@PathVariable Long id) {
        portfolioService.deleteTransaction(id);
        return ResponseEntity.ok(Map.of("message", "Transaction deleted successfully"));
    }

    @GetMapping("/rates")
    public ResponseEntity<MetalRates> getRates() {
        return ResponseEntity.ok(priceService.getCurrentRates());
    }

    public static class RateRequest {
        private double gold;
        private double silver;

        public RateRequest() {}

        public double getGold() { return gold; }
        public void setGold(double gold) { this.gold = gold; }
        public double getSilver() { return silver; }
        public void setSilver(double silver) { this.silver = silver; }
    }

    @PutMapping("/rates")
    public ResponseEntity<MetalRates> updateRates(@RequestBody RateRequest req) {
        MetalRates updated = priceService.updateRates(req.getGold(), req.getSilver());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/rates/sync")
    public ResponseEntity<MetalRates> syncLiveRates() {
        MetalRates updated = priceService.syncLiveBangaloreRates();
        return ResponseEntity.ok(updated);
    }
}
