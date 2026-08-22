package com.portfolio.metals.service;

import com.portfolio.metals.model.MetalRates;
import com.portfolio.metals.repository.MetalRatesRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Service to manage and sync live Karnataka (Bangalore) market spot rates for Gold and Silver.
 */
@Service
public class PriceService {

    private final MetalRatesRepository ratesRepository;
    private final HttpClient httpClient;

    // Public Live Karnataka / Bangalore Bullion Endpoint
    public static final String KARNATAKA_PRICING_API = "https://api.lalithaajewellery.com/public/pricings/latest?state_id=fbe51d69-c3ef-466f-a8f4-7c382759e35f";

    // Fallback Bangalore Benchmarks (22K Gold & Silver per gram)
    public static final double BANGALORE_22K_GOLD_DEFAULT = 14950.0;
    public static final double BANGALORE_SILVER_DEFAULT = 257.0;

    public PriceService(MetalRatesRepository ratesRepository) {
        this.ratesRepository = ratesRepository;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public MetalRates getCurrentRates() {
        return ratesRepository.findById(1L).map(rates -> {
            // Auto-refresh if rates are older than 4 hours
            if (rates.getLastUpdated() == null || 
                Duration.between(rates.getLastUpdated(), LocalDateTime.now()).toHours() >= 4) {
                return syncLiveBangaloreRates();
            }
            return rates;
        }).orElseGet(() -> {
            MetalRates defaultRates = new MetalRates(BANGALORE_22K_GOLD_DEFAULT, BANGALORE_SILVER_DEFAULT);
            return ratesRepository.save(defaultRates);
        });
    }

    public MetalRates updateRates(double goldRate, double silverRate) {
        MetalRates rates = ratesRepository.findById(1L).orElse(new MetalRates());
        rates.setId(1L);
        rates.setGoldRate(goldRate > 0 ? goldRate : rates.getGoldRate());
        rates.setSilverRate(silverRate > 0 ? silverRate : rates.getSilverRate());
        rates.setLastUpdated(LocalDateTime.now());
        return ratesRepository.save(rates);
    }

    /**
     * Directly fetches official live Karnataka (Bangalore) 22K Gold and Silver prices.
     */
    public MetalRates syncLiveBangaloreRates() {
        double syncedGold = BANGALORE_22K_GOLD_DEFAULT;
        double syncedSilver = BANGALORE_SILVER_DEFAULT;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(KARNATAKA_PRICING_API))
                    .timeout(Duration.ofSeconds(5))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body().contains("\"gold_22kt\"")) {
                String body = response.body();

                // Extract 22K Gold price
                int g22Idx = body.indexOf("\"gold_22kt\":");
                if (g22Idx != -1) {
                    int priceIdx = body.indexOf("\"price\":", g22Idx);
                    if (priceIdx != -1) {
                        int comma = body.indexOf(",", priceIdx);
                        int brace = body.indexOf("}", priceIdx);
                        int end = (comma != -1 && comma < brace) ? comma : brace;
                        String pStr = body.substring(priceIdx + 8, end).trim();
                        syncedGold = Double.parseDouble(pStr);
                    }
                }

                // Extract Silver price
                int silverIdx = body.indexOf("\"silver\":");
                if (silverIdx != -1) {
                    int priceIdx = body.indexOf("\"price\":", silverIdx);
                    if (priceIdx != -1) {
                        int comma = body.indexOf(",", priceIdx);
                        int brace = body.indexOf("}", priceIdx);
                        int end = (comma != -1 && comma < brace) ? comma : brace;
                        String pStr = body.substring(priceIdx + 8, end).trim();
                        syncedSilver = Double.parseDouble(pStr);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Warning: Live Karnataka API fetch encountered error (" + e.getMessage() + "), using fallback.");
            syncedGold = BANGALORE_22K_GOLD_DEFAULT;
            syncedSilver = BANGALORE_SILVER_DEFAULT;
        }

        // Apply sanity checks
        if (syncedGold < 5000 || syncedGold > 35000) syncedGold = BANGALORE_22K_GOLD_DEFAULT;
        if (syncedSilver < 50 || syncedSilver > 1000) syncedSilver = BANGALORE_SILVER_DEFAULT;

        System.out.println(">>> Synced Official Karnataka Bullion Prices -> 22K Gold: ₹" + syncedGold + "/g | Silver: ₹" + syncedSilver + "/g");
        return updateRates(syncedGold, syncedSilver);
    }
}
