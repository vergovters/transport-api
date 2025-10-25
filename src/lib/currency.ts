import axios from 'axios';

interface ExchangeRates {
    success: boolean;
    timestamp: number;
    base: string;
    date: string;
    rates: {
        [key: string]: number;
    };
}

interface CurrencyConversion {
    eur: number;
    usd: number;
    uah: number;
}

interface CachedRates {
    data: ExchangeRates;
    timestamp: number;
}

export class CurrencyService {
    private static readonly FIXER_API_KEY = process.env.FIXER_API_KEY;
    private static readonly FIXER_BASE_URL = 'http://data.fixer.io/api';
    private static readonly CACHE_DURATION_MS = 5 * 60 * 1000;

    private static cachedRates: CachedRates | null = null;

    static async getExchangeRates(forceRefresh = false): Promise<ExchangeRates> {
        if (!this.FIXER_API_KEY) {
            throw new Error('FIXER_API_KEY is not configured');
        }

        if (!forceRefresh && this.isCacheValid()) {
            console.log('Using cached exchange rates');
            return this.cachedRates!.data;
        }

        try {
            console.log('Fetching fresh exchange rates from Fixer API');
            const response = await axios.get(`${this.FIXER_BASE_URL}/latest`, {
                params: {
                    access_key: this.FIXER_API_KEY,
                    base: 'EUR',
                    symbols: 'USD,UAH'
                }
            });

            if (!response.data.success) {
                throw new Error(`Fixer API error: ${response.data.error?.info || 'Unknown error'}`);
            }

            this.cachedRates = {
                data: response.data,
                timestamp: Date.now()
            };

            return response.data;
        } catch (error) {
            if (this.cachedRates) {
                console.warn('API failed, using stale cached rates:', (error as Error).message);
                return this.cachedRates.data;
            }

            if (axios.isAxiosError(error)) {
                throw new Error(`Failed to fetch exchange rates: ${error.message}`);
            }
            throw error;
        }
    }

    private static isCacheValid(): boolean {
        if (!this.cachedRates) {
            return false;
        }

        const age = Date.now() - this.cachedRates.timestamp;
        return age < this.CACHE_DURATION_MS;
    }

    static clearCache(): void {
        this.cachedRates = null;
    }

    static getCacheInfo(): { isValid: boolean; age?: number; data?: ExchangeRates } | null {
        if (!this.cachedRates) {
            return null;
        }

        const age = Date.now() - this.cachedRates.timestamp;
        return {
            isValid: this.isCacheValid(),
            age,
            data: this.cachedRates.data
        };
    }

    static async convertFromEUR(amountEUR: number): Promise<CurrencyConversion> {
        try {
            const rates = await this.getExchangeRates();

            return {
                eur: amountEUR,
                usd: amountEUR * rates.rates.USD,
                uah: amountEUR * rates.rates.UAH
            };
        } catch (error) {
            console.warn('Using fallback exchange rates due to API error:', (error as Error).message);

            return {
                eur: amountEUR,
                usd: amountEUR * 1.08,
                uah: amountEUR * 44.5,
            };
        }
    }

    static async calculateRouteCost(distanceKm: number, pricePerKmEur: number): Promise<CurrencyConversion> {
        const totalCostEur = distanceKm * pricePerKmEur;
        return this.convertFromEUR(totalCostEur);
    }
}