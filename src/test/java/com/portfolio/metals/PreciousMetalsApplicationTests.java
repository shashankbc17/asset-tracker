package com.portfolio.metals;

import com.portfolio.metals.model.*;
import com.portfolio.metals.service.CsvService;
import com.portfolio.metals.service.NetWorthService;
import com.portfolio.metals.service.PortfolioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PreciousMetalsApplicationTests {

    @Autowired
    private NetWorthService netWorthService;

    @Autowired
    private CsvService csvService;

    @Test
    void contextLoads() {
        assertNotNull(netWorthService);
        assertNotNull(csvService);
    }

    @Test
    void testMultiAssetCalculations() {
        MetalRates rates = new MetalRates(14900.0, 240.0);

        // 1. Metal Asset (Gold Bar 10g @ 12000)
        Asset gold = new Asset();
        gold.setAssetType(AssetType.PRECIOUS_METALS);
        gold.setMetalType(MetalType.GOLD);
        gold.setCategoryType(CategoryType.COIN_BAR);
        gold.setGrams(10.0);
        gold.setRateBought(12000.0);
        gold.setDeduction(0.0);
        gold.setInvestedAmount(120000.0);
        gold.setPurchaseDate(LocalDate.now().minusYears(1));

        AssetMetrics goldMetrics = netWorthService.calculateAssetMetrics(gold, rates, LocalDate.now());
        assertEquals(120000.0, goldMetrics.getInvestedAmount(), 0.01);
        assertEquals(149000.0, goldMetrics.getCurrentValue(), 0.01);
        assertTrue(goldMetrics.getProfitLoss() > 0);

        // 2. Equity Asset (TCS 100 shares @ 3500, CMP 4000)
        Asset stock = new Asset();
        stock.setAssetType(AssetType.EQUITY);
        stock.setTicker("TCS");
        stock.setQuantity(100.0);
        stock.setBuyPrice(3500.0);
        stock.setCurrentPrice(4000.0);
        stock.setInvestedAmount(350000.0);
        stock.setPurchaseDate(LocalDate.now().minusMonths(6));

        AssetMetrics stockMetrics = netWorthService.calculateAssetMetrics(stock, rates, LocalDate.now());
        assertEquals(350000.0, stockMetrics.getInvestedAmount(), 0.01);
        assertEquals(400000.0, stockMetrics.getCurrentValue(), 0.01);
        assertEquals(50000.0, stockMetrics.getProfitLoss(), 0.01);

        // 3. Real Estate Asset (Flat bought @ 1 Cr, current val 1.3 Cr)
        Asset property = new Asset();
        property.setAssetType(AssetType.REAL_ESTATE);
        property.setInvestedAmount(10000000.0);
        property.setEstimatedMarketValue(13000000.0);
        property.setPurchaseDate(LocalDate.now().minusYears(2));

        AssetMetrics propMetrics = netWorthService.calculateAssetMetrics(property, rates, LocalDate.now());
        assertEquals(10000000.0, propMetrics.getInvestedAmount(), 0.01);
        assertEquals(13000000.0, propMetrics.getCurrentValue(), 0.01);
        assertEquals(3000000.0, propMetrics.getProfitLoss(), 0.01);
    }
}
