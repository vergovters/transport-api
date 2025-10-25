import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';


const prisma = new PrismaClient();


async function main() {
    await prisma.apiKey.upsert({
        where: { key: 'local-dev-key' },
        update: {},
        create: { name: 'local', key: 'local-dev-key', active: true },
    });


    await prisma.vehicle.createMany({
        data: [
            {
                id: randomUUID(),
                plateNumber: 'ABC-123',
                model: 'Volvo FH',
                type: 'TRUCK',
                purchaseDate: new Date('2019-03-10'),
                status: 'FREE',
                pricePerKmEur: 0.6,
            },
            {
                id: randomUUID(),
                plateNumber: 'XYZ-999',
                model: 'Toyota Prius',
                type: 'CAR',
                purchaseDate: new Date('2021-07-20'),
                status: 'FREE',
                pricePerKmEur: 0.15,
            }
        ],
    });


    await prisma.route.createMany({
        data: [
            {
                id: randomUUID(),
                startLat: 50.4501,
                startLon: 30.5234,
                endLat: 49.8397,
                endLon: 24.0297,
                distanceKm: 540,
                departureDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                requiredVehicleType: 'TRUCK',
                expectedRevenueUsd: 1200,
                status: 'PENDING'
            },
            {
                id: randomUUID(),
                startLat: 46.4825,
                startLon: 30.7233,
                endLat: 49.9935,
                endLon: 36.2304,
                distanceKm: 760,
                departureDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
                requiredVehicleType: 'CAR',
                expectedRevenueUsd: 800,
                status: 'PENDING'
            }
        ]
    });
}


main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());