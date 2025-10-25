/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles
 *     description: Retrieve a list of all vehicles in the system
 *     tags: [Vehicles]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of all vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehicle'
 *             example:
 *               - id: "550e8400-e29b-41d4-a716-446655440000"
 *                 type: "TRUCK"
 *                 licensePlate: "ABC-123"
 *                 costPerKm: 1.5
 *                 status: "FREE"
 *               - id: "550e8400-e29b-41d4-a716-446655440001"
 *                 type: "VAN"
 *                 licensePlate: "XYZ-789"
 *                 costPerKm: 1.2
 *                 status: "BUSY"
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     description: Add a new vehicle to the fleet
 *     tags: [Vehicles]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVehicle'
 *           example:
 *             type: "TRUCK"
 *             licensePlate: "NEW-123"
 *             costPerKm: 1.5
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *             example:
 *               error: "Validation error"
 *               message: "License plate is required"
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - License plate already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Conflict"
 *               message: "Vehicle with this license plate already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update an existing vehicle
 *     description: Update vehicle details by ID
 *     tags: [Vehicles]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Vehicle ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVehicle'
 *           example:
 *             licensePlate: "UPDATED-123"
 *             costPerKm: 2.0
 *             status: "MAINTENANCE"
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Resource not found"
 *               message: "Vehicle with id 550e8400-e29b-41d4-a716-446655440000 not found"
 *       409:
 *         description: Conflict - License plate already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete a vehicle
 *     description: Remove a vehicle from the fleet
 *     tags: [Vehicles]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Vehicle ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       204:
 *         description: Vehicle deleted successfully
 *       401:
 *         description: Unauthorized - Invalid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict - Cannot delete vehicle assigned to active routes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Conflict"
 *               message: "Cannot delete vehicle assigned to active routes"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */