import express from "express";

import {
  getAdminSetupStatus,
  createInitialAdmin,
} from "../controllers/adminSetupController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Initial Administrator Setup
|--------------------------------------------------------------------------
|
| Public ONLY for first-time system setup.
|
| Security is enforced by adminSetupController:
|
| - ALLOW_INITIAL_ADMIN_SETUP
| - no existing admin
| - atomic MongoDB bootstrap lock
|
*/

router.get(
  "/status",
  getAdminSetupStatus
);

router.post(
  "/",
  createInitialAdmin
);

export default router;