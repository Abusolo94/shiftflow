import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  getRestroomCleaningRecords,
  getRestroomCleaningRecord,
  createRestroomCleaningRecord,
  updateRestroomCleaningRecord,
  deleteRestroomCleaningRecord,
} from "../controllers/restroomCleaningController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
| Every restroom-cleaning endpoint requires a valid Firebase token
| and an active MongoDB user account.
*/
router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Restroom Cleaning Records
|--------------------------------------------------------------------------
*/

/**
 * GET /
 * Get restroom cleaning records
 *
 * Store Account:
 *   - Only receives records belonging to its own store.
 *
 * Admin:
 *   - Can receive records from all stores.
 *   - Can use filters such as storeId, storeNumber, status, etc.
 */
router.get(
  "/",
  getRestroomCleaningRecords
);

/**
 * GET /:id
 * Get one restroom cleaning record
 *
 * Store Account:
 *   - Can only access records belonging to its store.
 *
 * Admin:
 *   - Can access any record.
 */
router.get(
  "/:id",
  getRestroomCleaningRecord
);

/**
 * POST /
 * Create a new restroom cleaning record
 *
 * The controller determines the authenticated user's store.
 * Store users cannot create records for another store by
 * simply changing storeId in the request body.
 */
router.post(
  "/",
  createRestroomCleaningRecord
);

/**
 * PUT /:id
 * Update a restroom cleaning record
 */
router.put(
  "/:id",
  updateRestroomCleaningRecord
);

/**
 * DELETE /:id
 * Delete a restroom cleaning record
 */
router.delete(
  "/:id",
  deleteRestroomCleaningRecord
);

export default router;