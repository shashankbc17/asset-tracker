/**
 * Service to fetch live spot market rates for Gold and Silver.
 */

const METALS_API_URL = 'https://api.metals.live/v1/spot';
const TROY_OUNCE_TO_GRAM = 31.1034768;
const DEFAULT_USD_TO_INR = 83.50;
const GOLD_22K_PURITY = 0.916;

export const RatesService = {
  /**
   * Fetches latest spot prices and converts to INR/g (22K Gold and Fine Silver).
   * @param {number} [usdToInr=DEFAULT_USD_TO_INR]
   * @returns {Promise<{gold: number, silver: number, timestamp: string}>}
   */
  async fetchLiveRates(usdToInr = DEFAULT_USD_TO_INR) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(METALS_API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API responded with HTTP status ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response structure from Metals API');
      }

      let goldSpotUsd = null;
      let silverSpotUsd = null;

      for (const item of data) {
        if (item.gold !== undefined && goldSpotUsd === null) {
          goldSpotUsd = Number(item.gold);
        }
        if (item.silver !== undefined && silverSpotUsd === null) {
          silverSpotUsd = Number(item.silver);
        }
      }

      if (goldSpotUsd === null && silverSpotUsd === null) {
        throw new Error('Spot prices for gold/silver not found in API response');
      }

      const goldInrPerGram = goldSpotUsd !== null 
        ? Math.round((goldSpotUsd / TROY_OUNCE_TO_GRAM) * usdToInr * GOLD_22K_PURITY)
        : null;

      const silverInrPerGram = silverSpotUsd !== null
        ? Math.round((silverSpotUsd / TROY_OUNCE_TO_GRAM) * usdToInr)
        : null;

      return {
        gold: goldInrPerGram,
        silver: silverInrPerGram,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error fetching live spot rates:', error);
      throw error;
    }
  }
};
