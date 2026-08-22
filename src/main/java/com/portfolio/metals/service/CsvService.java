package com.portfolio.metals.service;

import com.portfolio.metals.model.CategoryType;
import com.portfolio.metals.model.MetalTransaction;
import com.portfolio.metals.model.MetalType;
import com.portfolio.metals.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Core Java CSV service for generating templates, exporting data, and importing transactions.
 */
@Service
public class CsvService {

    private final TransactionRepository transactionRepository;

    public CsvService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * Generates a sample CSV template for users to populate.
     */
    public String generateTemplateCsv() {
        return "Metal,Category,Grams,BuyRate,Deduction,Date\n" +
               "Gold,Jewelry,10,12000,4,2026-01-01\n" +
               "Silver,Coin/Bar,500,220,0,2026-01-01\n";
    }

    /**
     * Exports all user holdings into a valid CSV string.
     */
    public String exportPortfolioCsv(String userId) {
        List<MetalTransaction> transactions = transactionRepository.findByUserIdOrderByDisplayOrderAscIdDesc(userId);
        StringBuilder sb = new StringBuilder();
        sb.append("Metal,Category,Grams,BuyRate,Deduction,Date\n");

        for (MetalTransaction tx : transactions) {
            sb.append(tx.getMetal().getDisplayName()).append(",")
              .append(tx.getCategory().getDisplayName()).append(",")
              .append(tx.getGrams()).append(",")
              .append(tx.getRateBought()).append(",")
              .append(tx.getDeduction()).append(",")
              .append(tx.getDate() != null ? tx.getDate().toString() : LocalDate.now().toString())
              .append("\n");
        }
        return sb.toString();
    }

    public static class ImportResult {
        private int addedCount;
        private int skippedCount;
        private List<String> errors = new ArrayList<>();

        public ImportResult(int addedCount, int skippedCount, List<String> errors) {
            this.addedCount = addedCount;
            this.skippedCount = skippedCount;
            this.errors = errors;
        }

        public int getAddedCount() {
            return addedCount;
        }

        public int getSkippedCount() {
            return skippedCount;
        }

        public List<String> getErrors() {
            return errors;
        }
    }

    /**
     * Parses an uploaded CSV stream using Core Java BufferedReader.
     */
    public ImportResult importCsv(InputStream inputStream, String userId) {
        List<MetalTransaction> validTransactions = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int skippedCount = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                line = line.trim();
                if (line.isEmpty()) continue;

                // Skip header row
                if (lineNumber == 1 && line.toLowerCase().startsWith("metal")) {
                    continue;
                }

                String[] parts = line.split(",");
                if (parts.length < 6) {
                    skippedCount++;
                    errors.add("Row " + lineNumber + ": Insufficient columns. Expected 6, got " + parts.length);
                    continue;
                }

                try {
                    String metalStr = parts[0].trim();
                    String categoryStr = parts[1].trim();
                    double grams = Double.parseDouble(parts[2].trim());
                    double buyRate = Double.parseDouble(parts[3].trim());
                    double deduction = Double.parseDouble(parts[4].trim());
                    LocalDate date = LocalDate.parse(parts[5].trim(), DateTimeFormatter.ISO_LOCAL_DATE);

                    if (grams <= 0 || buyRate <= 0) {
                        skippedCount++;
                        errors.add("Row " + lineNumber + ": Grams and BuyRate must be positive numbers.");
                        continue;
                    }

                    MetalType metal = MetalType.fromString(metalStr);
                    CategoryType category = CategoryType.fromString(categoryStr);

                    MetalTransaction tx = new MetalTransaction(metal, category, grams, buyRate, deduction, date);
                    tx.setUserId(userId);
                    validTransactions.add(tx);
                } catch (Exception ex) {
                    skippedCount++;
                    errors.add("Row " + lineNumber + ": Error parsing values (" + ex.getMessage() + ")");
                }
            }

            if (!validTransactions.isEmpty()) {
                transactionRepository.saveAll(validTransactions);
            }

        } catch (Exception e) {
            errors.add("Failed to read CSV input: " + e.getMessage());
        }

        return new ImportResult(validTransactions.size(), skippedCount, errors);
    }
}
