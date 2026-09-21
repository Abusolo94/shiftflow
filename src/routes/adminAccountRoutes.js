import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  getAdminAccounts,
  getAdminAccount,
  createAdminAccount,
  updateAdminAccount,
  updateAdminStatus,
  deleteAdminAccount,
} from "../controllers/adminAccountController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Every administrator-account route requires a valid Firebase ID token.
| The controller then checks MongoDB role/permissions.
|
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Administrator Accounts
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getAdminAccounts
);

router.get(
  "/:id",
  getAdminAccount
);

router.post(
  "/",
  createAdminAccount
);

router.put(
  "/:id",
  updateAdminAccount
);

router.patch(
  "/:id/status",
  updateAdminStatus
);

router.delete(
  "/:id",
  deleteAdminAccount
);

export default router;