// service.js - Service for fetching live cryptocurrency prices

/**
 * @namespace service
 * Service module for retrieving live exchange rates of virtual currencies.
 * Uses Coinbase API to fetch BTC, ETH, or LTC prices in USD.
 */

const service = {
    /**
     * Retrieves the current USD price for the specified cryptocurrency.
     * Falls back to default prices if API fails or response is invalid.
     * @async
     * @param {string} currency - The cryptocurrency symbol ('BTC', 'ETH', 'LTC').
     * @returns {Promise<number>} The current price in USD.
     */
    
    getLastPriceUSD: async function(currency) {
        try {
            // Using a free API - you can change this to any crypto API
            const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${currency}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.data && data.data.rates && data.data.rates.USD) {
                return parseFloat(data.data.rates.USD);
            } else {
                // Fallback prices if API response is invalid
                console.log('Invalid API response, using fallback prices');
                const fallbackPrices = {
                    'BTC': 45000,
                    'ETH': 3000
                };
                return fallbackPrices[currency] || 0;
            }
        } catch (error) {
            console.error(`Error fetching price for ${currency}:`, error);

            // Fallback prices if API fails
            const fallbackPrices = {
                'BTC': 45000,
                'ETH': 3000
            };
            return fallbackPrices[currency] || 0;
        }
    }
};