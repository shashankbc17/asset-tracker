package com.portfolio.metals.model;

/**
 * Category of precious metal holdings.
 */
public enum CategoryType {
    JEWELRY("Jewelry"),
    COIN_BAR("Coin/Bar");

    private final String displayName;

    CategoryType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static CategoryType fromString(String text) {
        if (text == null) return JEWELRY;
        String clean = text.trim().toLowerCase();
        if (clean.contains("coin") || clean.contains("bar")) {
            return COIN_BAR;
        }
        return JEWELRY;
    }
}
