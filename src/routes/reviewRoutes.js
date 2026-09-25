// src/routes/reviewRoutes.js

import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  completeReview,
  reopenReview,
  getReviewTypes,
} from "../controllers/reviewController.js";

const router =
  express.Router();

// ======================================================
// All review operations require authentication
// ======================================================

router.use(authenticate);

// ======================================================
// REVIEW TYPES
// GET /api/reviews/types
// ======================================================

router.get(
  "/types",
  getReviewTypes
);

// ======================================================
// COMPLETE REVIEW
// PATCH /api/reviews/:type/:id/complete
//
// Example:
// PATCH /api/reviews/food-safety/123/complete
// ======================================================

router.patch(
  "/:type/:id/complete",
  completeReview
);

// ======================================================
// REOPEN REVIEW
// PATCH /api/reviews/:type/:id/reopen
// ======================================================

router.patch(
  "/:type/:id/reopen",
  reopenReview
);

export default router;