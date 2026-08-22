package com.portfolio.metals.controller;

import com.portfolio.metals.model.Asset;
import com.portfolio.metals.model.AssetType;
import com.portfolio.metals.model.NetWorthSummary;
import com.portfolio.metals.service.NetWorthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for multi-asset management and Net Worth analytics.
 */
@RestController
@RequestMapping("/api/assets")
@CrossOrigin(origins = "*")
public class AssetController {

    private final NetWorthService netWorthService;

    public AssetController(NetWorthService netWorthService) {
        this.netWorthService = netWorthService;
    }

    @GetMapping("/summary")
    public ResponseEntity<NetWorthSummary> getSummary(
            @RequestParam(defaultValue = "default_user") String userId) {
        NetWorthSummary summary = netWorthService.getNetWorthSummary(userId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping
    public ResponseEntity<List<Asset>> getAssets(
            @RequestParam(defaultValue = "default_user") String userId,
            @RequestParam(required = false) AssetType type) {
        List<Asset> assets = (type != null) 
                ? netWorthService.getAssetsByType(userId, type) 
                : netWorthService.getAllAssets(userId);
        return ResponseEntity.ok(assets);
    }

    @PostMapping
    public ResponseEntity<Asset> createAsset(@RequestBody Asset asset) {
        Asset saved = netWorthService.saveAsset(asset);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Asset> updateAsset(
            @PathVariable Long id,
            @RequestBody Asset assetDetails) {
        return netWorthService.getAssetById(id).map(existing -> {
            existing.setName(assetDetails.getName());
            existing.setAssetType(assetDetails.getAssetType());
            existing.setPurchaseDate(assetDetails.getPurchaseDate());
            existing.setInvestedAmount(assetDetails.getInvestedAmount());
            existing.setNotes(assetDetails.getNotes());

            // Metals
            existing.setMetalType(assetDetails.getMetalType());
            existing.setCategoryType(assetDetails.getCategoryType());
            existing.setGrams(assetDetails.getGrams());
            existing.setRateBought(assetDetails.getRateBought());
            existing.setDeduction(assetDetails.getDeduction());

            // Equities
            existing.setTicker(assetDetails.getTicker());
            existing.setQuantity(assetDetails.getQuantity());
            existing.setBuyPrice(assetDetails.getBuyPrice());
            existing.setCurrentPrice(assetDetails.getCurrentPrice());

            // Real Estate
            existing.setLocation(assetDetails.getLocation());
            existing.setAreaSqFt(assetDetails.getAreaSqFt());
            existing.setEstimatedMarketValue(assetDetails.getEstimatedMarketValue());
            existing.setMonthlyRentalIncome(assetDetails.getMonthlyRentalIncome());

            // Cash / FDs
            existing.setBankName(assetDetails.getBankName());
            existing.setInterestRatePct(assetDetails.getInterestRatePct());
            existing.setMaturityDate(assetDetails.getMaturityDate());

            Asset updated = netWorthService.saveAsset(existing);
            return ResponseEntity.ok(updated);
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteAsset(@PathVariable Long id) {
        netWorthService.deleteAsset(id);
        return ResponseEntity.ok(Map.of("message", "Asset deleted successfully"));
    }
}
