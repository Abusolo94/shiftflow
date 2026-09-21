import express from "express";

import authenticate from "../middleware/authenticate.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
  createStore,
  deleteStore,
  getStoreById,
  getStores,
  updateStore,
} from "../controllers/storeController.js";

const router = express.Router();

// ======================================================
// ALL STORE ROUTES REQUIRE LOGIN
// ======================================================

router.use(authenticate);

// ======================================================
// GET ALL STORES
// ADMIN ONLY
// GET /api/stores
// ======================================================

router.get(
  "/",
  requireAdmin,
  getStores
);

// ======================================================
// GET SINGLE STORE
// ADMIN OR ASSIGNED STORE ACCOUNT
// GET /api/stores/:id
// ======================================================

router.get(
  "/:id",
  getStoreById
);

// ======================================================
// CREATE STORE
// ADMIN ONLY
// POST /api/stores
// ======================================================

router.post(
  "/",
  requireAdmin,
  createStore
);

// ======================================================
// UPDATE STORE
// ADMIN ONLY
// PUT /api/stores/:id
// ======================================================

router.put(
  "/:id",
  requireAdmin,
  updateStore
);

// ======================================================
// DELETE STORE
// ADMIN ONLY
// DELETE /api/stores/:id
// ======================================================

router.delete(
  "/:id",
  requireAdmin,
  deleteStore
);

export default router;