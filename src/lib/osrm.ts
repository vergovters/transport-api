import axios from "axios";

export async function getDistanceKm(
    startLng: number,
    startLat: number,
    endLng: number,
    endLat: number
): Promise<number> {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`;

    const { data } = await axios.get(url);

    if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error("Failed to calculate distance using OSRM");
    }

    const distanceMeters = data.routes[0].distance;
    return distanceMeters / 1000;
}
