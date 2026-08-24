package com.portfolio.metals.model;

/**
 * Supported Major Asset Classes.
 */
public enum AssetType {
    PRECIOUS_METALS("Precious Metals", "🪙"),
    EQUITY("Equities & Mutual Funds", "📈"),
    REAL_ESTATE("Real Estate", "🏡"),
    CASH_SAVINGS("Cash & Fixed Deposits", "💰"),
    PROVIDENT_FUND("Provident Fund & PPF", "🛡️");

    private final String displayName;
    private final String icon;

    AssetType(String displayName, String icon) {
        this.displayName = displayName;
        this.icon = icon;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getIcon() {
        return icon;
    }

    public static AssetType fromString(String text) {
        if (text == null) return PRECIOUS_METALS;
        for (AssetType type : AssetType.values()) {
            if (type.name().equalsIgnoreCase(text.trim()) || type.displayName.equalsIgnoreCase(text.trim())) {
                return type;
            }
        }
        return PRECIOUS_METALS;
    }
}
