import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  getShiftPlans,
  getShiftPlan,
  createShiftPlan,
  updateShiftPlan,
  deleteShiftPlan,
} from "../controllers/shiftPlanController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Every Shift Plan route requires a valid Firebase ID token.
|
| authenticate.js should:
| 1. Verify the Firebase token
| 2. Load the MongoDB user
| 3. Attach:
|      req.firebaseUser
|      req.user
|
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Shift Plan Routes
|--------------------------------------------------------------------------
*/

// Get all Shift Plans
router.get(
  "/",
  getShiftPlans
);

// Get one Shift Plan
router.get(
  "/:id",
  getShiftPlan
);

// Create Shift Plan
router.post(
  "/",
  createShiftPlan
);

// Update Shift Plan
router.put(
  "/:id",
  updateShiftPlan
);

// Delete Shift Plan
router.delete(
  "/:id",
  deleteShiftPlan
);

export default router;