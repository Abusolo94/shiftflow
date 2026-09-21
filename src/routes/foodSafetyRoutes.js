import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  createFoodSafety,
  getFoodSafeties,
  getSingleFoodSafety,
  updateFoodSafety,
  deleteFoodSafety,
} from "../controllers/foodSafetyController.js";

const router = express.Router();

// ======================================================
// AUTHENTICATION
// ======================================================

// Every Food Safety route requires a valid
// Firebase authentication token + MongoDB account.
router.use(authenticate);

// ======================================================
// FOOD SAFETY ROUTES
// ======================================================

// Get all Food Safety reports
router.get(
  "/",
  getFoodSafeties
);

// Get one Food Safety report
router.get(
  "/:id",
  getSingleFoodSafety
);

// Create Food Safety report
router.post(
  "/",
  createFoodSafety
);

// Update Food Safety report
router.put(
  "/:id",
  updateFoodSafety
);

// Delete Food Safety report
router.delete(
  "/:id",
  deleteFoodSafety
);

export default router;