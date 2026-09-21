import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  getShifts,
  getSingleShift,
  createShift,
  updateShift,
  deleteShift,
} from "../controllers/shiftController.js";

const router =
  express.Router();

// ======================================================
// GET ALL SHIFTS
// ======================================================

router.get(
  "/",
  authenticate,
  getShifts
);

// ======================================================
// GET SINGLE SHIFT
// ======================================================

router.get(
  "/:id",
  authenticate,
  getSingleShift
);

// ======================================================
// CREATE SHIFT
// ======================================================

router.post(
  "/",
  authenticate,
  createShift
);

// ======================================================
// UPDATE SHIFT
// ======================================================

router.put(
  "/:id",
  authenticate,
  updateShift
);

// ======================================================
// DELETE SHIFT
// ======================================================

router.delete(
  "/:id",
  authenticate,
  deleteShift
);

export default router;