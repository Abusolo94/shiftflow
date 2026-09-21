import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  getTravelPathRecords,
  getTravelPathRecord,
  createTravelPathRecord,
  updateTravelPathRecord,
  deleteTravelPathRecord,
} from "../controllers/travelPathController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| All Travel Path routes require authentication
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Travel Path Routes
|--------------------------------------------------------------------------
*/

// Get all records
// Store user: only their store
// Admin: all stores, with optional filters
router.get(
  "/",
  getTravelPathRecords
);

// Get one record
router.get(
  "/:id",
  getTravelPathRecord
);

// Create checklist
router.post(
  "/",
  createTravelPathRecord
);

// Update checklist / review / complete
router.put(
  "/:id",
  updateTravelPathRecord
);

// Delete record
router.delete(
  "/:id",
  deleteTravelPathRecord
);

export default router;