import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  createMaintenance,
  getMaintenances,
  getSingleMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from "../controllers/maintenanceController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Every maintenance endpoint requires a valid
| Firebase ID token and an active MongoDB user account.
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| GET ALL MAINTENANCE
|--------------------------------------------------------------------------
|
| Store account:
|   → Only its own store
|
| Admin:
|   → Can view all stores
|
| GET /api/maintenance
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getMaintenances
);

/*
|--------------------------------------------------------------------------
| GET SINGLE MAINTENANCE
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  getSingleMaintenance
);

/*
|--------------------------------------------------------------------------
| CREATE MAINTENANCE
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  createMaintenance
);

/*
|--------------------------------------------------------------------------
| UPDATE MAINTENANCE
|--------------------------------------------------------------------------
*/

router.put(
  "/:id",
  updateMaintenance
);

/*
|--------------------------------------------------------------------------
| DELETE MAINTENANCE
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  deleteMaintenance
);

export default router;