import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  createVerification,
  getVerifications,
  getSingleVerification,
  updateVerification,
  deleteVerification,
} from "../controllers/foodSafetyVerificationController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
| Every Food Safety Verification endpoint requires a valid
| Firebase ID token and an active MongoDB user account.
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| FOOD SAFETY VERIFICATION ROUTES
|--------------------------------------------------------------------------
*/

// Get all verification records
// Store accounts → only their own store
// Admin accounts → all stores
router.get(
  "/",
  getVerifications
);

// Get one verification record
router.get(
  "/:id",
  getSingleVerification
);

// Create a new FS1–FS8 verification
router.post(
  "/",
  createVerification
);

// Update an existing verification
router.put(
  "/:id",
  updateVerification
);

// Delete a verification
router.delete(
  "/:id",
  deleteVerification
);

export default router;