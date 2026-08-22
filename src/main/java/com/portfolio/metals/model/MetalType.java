package com.portfolio.metals.model;

/**
 * Supported Precious Metal types.
 */
public enum MetalType {
    GOLD("Gold"),
    SILVER("Silver");

    private final String displayName;

    MetalType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static MetalType fromString(String text) {
        if (text == null) return GOLD;
        for (MetalType type : MetalType.values()) {
            if (type.name().equalsIgnoreCase(text.trim()) || type.displayName.equalsIgnoreCase(text.trim())) {
                return type;
            }
        }
        return GOLD;
    }
}
