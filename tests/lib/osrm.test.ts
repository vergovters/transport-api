import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import { getDistanceKm } from '../../src/lib/osrm';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OSRM Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDistanceKm', () => {
        const startLng = -74.0059;
        const startLat = 40.7128;
        const endLng = -118.2437;
        const endLat = 34.0522;

        it('should calculate distance between two coordinates', async () => {
            const mockResponse = {
                data: {
                    code: 'Ok',
                    routes: [
                        {
                            distance: 4445000,
                            duration: 159000
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await getDistanceKm(startLng, startLat, endLng, endLat);

            expect(result).toBe(4445);
            expect(mockedAxios.get).toHaveBeenCalledWith(
                `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`
            );
        });

        it('should return distance in kilometers (converted from meters)', async () => {
            const mockResponse = {
                data: {
                    code: 'Ok',
                    routes: [
                        {
                            distance: 5000,
                            duration: 600
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await getDistanceKm(startLng, startLat, endLng, endLat);

            expect(result).toBe(5);
        });

        it('should handle OSRM API errors with non-Ok status', async () => {
            const mockResponse = {
                data: {
                    code: 'NoRoute',
                    message: 'No route found between coordinates'
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            await expect(
                getDistanceKm(startLng, startLat, endLng, endLat)
            ).rejects.toThrow('Failed to calculate distance using OSRM');
        });

        it('should handle OSRM API errors with empty routes', async () => {
            const mockResponse = {
                data: {
                    code: 'Ok',
                    routes: []
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            await expect(
                getDistanceKm(startLng, startLat, endLng, endLat)
            ).rejects.toThrow('Failed to calculate distance using OSRM');
        });

        it('should handle OSRM API errors with missing routes property', async () => {
            const mockResponse = {
                data: {
                    code: 'Ok'
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            await expect(
                getDistanceKm(startLng, startLat, endLng, endLat)
            ).rejects.toThrow('Failed to calculate distance using OSRM');
        });

        it('should handle network errors from axios', async () => {
            const networkError = new Error('Network Error');
            mockedAxios.get.mockRejectedValue(networkError);

            await expect(
                getDistanceKm(startLng, startLat, endLng, endLat)
            ).rejects.toThrow('Network Error');
        });

        it('should handle HTTP error responses', async () => {
            const httpError = {
                response: {
                    status: 429,
                    statusText: 'Too Many Requests'
                }
            };
            mockedAxios.get.mockRejectedValue(httpError);

            await expect(
                getDistanceKm(startLng, startLat, endLng, endLat)
            ).rejects.toEqual(httpError);
        });

        it('should work with zero distance (same coordinates)', async () => {
            const mockResponse = {
                data: {
                    code: 'Ok',
                    routes: [
                        {
                            distance: 0,
                            duration: 0
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await getDistanceKm(startLng, startLat, startLng, startLat);

            expect(result).toBe(0);
        });

        it('should handle small distances correctly', async () => {
            const mockResponse = {
                data: {
                    code: 'Ok',
                    routes: [
                        {
                            distance: 500,
                            duration: 60
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await getDistanceKm(startLng, startLat, endLng, endLat);

            expect(result).toBe(0.5);
        });

        it('should handle invalid coordinate values', async () => {
            const mockResponse = {
                data: {
                    code: 'InvalidCoordinate',
                    message: 'Invalid coordinate'
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            await expect(
                getDistanceKm(999, 999, -999, -999)
            ).rejects.toThrow('Failed to calculate distance using OSRM');
        });

        it('should handle very long distance routes', async () => {
            const mockResponse = {
                data: {
                    code: 'Ok',
                    routes: [
                        {
                            distance: 20015000,
                            duration: 720000
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await getDistanceKm(startLng, startLat, endLng, endLat);

            expect(result).toBe(20015);
        });
    });

    describe('API Integration Edge Cases', () => {
        it('should handle timeout errors', async () => {
            const timeoutError = new Error('timeout of 5000ms exceeded');
            mockedAxios.get.mockRejectedValue(timeoutError);

            await expect(
                getDistanceKm(-74.0059, 40.7128, -118.2437, 34.0522)
            ).rejects.toThrow('timeout of 5000ms exceeded');
        });

        it('should handle OSRM service unavailable', async () => {
            const serviceError = {
                response: {
                    status: 503,
                    statusText: 'Service Unavailable'
                }
            };
            mockedAxios.get.mockRejectedValue(serviceError);

            await expect(
                getDistanceKm(-74.0059, 40.7128, -118.2437, 34.0522)
            ).rejects.toEqual(serviceError);
        });

        it('should handle OSRM rate limiting', async () => {
            const rateLimitError = {
                response: {
                    status: 429,
                    statusText: 'Too Many Requests',
                    headers: {
                        'retry-after': '60'
                    }
                }
            };
            mockedAxios.get.mockRejectedValue(rateLimitError);

            await expect(
                getDistanceKm(-74.0059, 40.7128, -118.2437, 34.0522)
            ).rejects.toEqual(rateLimitError);
        });
    });
});