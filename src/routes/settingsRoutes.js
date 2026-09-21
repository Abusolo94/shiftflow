import express from "express";

import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";

import authenticate from "../middleware/authenticate.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Protect Settings Routes
|--------------------------------------------------------------------------
|
| Firebase ID token is verified first.
| authenticate should attach:
|
| req.firebaseUser
| req.user
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Get Global Settings
|--------------------------------------------------------------------------
|
| GET /api/settings
|
| Admin only - controller enforces authorization.
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getSettings
);

/*
|--------------------------------------------------------------------------
| Update Global Settings
|--------------------------------------------------------------------------
|
| PUT /api/settings
|
| Admin only - controller enforces authorization.
|--------------------------------------------------------------------------
*/

router.put(
  "/",
  updateSettings
);

export default router;