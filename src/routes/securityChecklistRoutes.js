import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  getSecurityChecklistRecords,
  getSecurityChecklistRecord,
  createSecurityChecklistRecord,
  updateSecurityChecklistRecord,
  deleteSecurityChecklistRecord,
} from "../controllers/securityChecklistController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
|
| Every Security Checklist route requires a valid Firebase ID token
| and an active MongoDB user account.
|
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Security Checklist Routes
|--------------------------------------------------------------------------
|
| GET    /api/security-checklists
| GET    /api/security-checklists/:id
| POST   /api/security-checklists
| PUT    /api/security-checklists/:id
| DELETE /api/security-checklists/:id
|
*/

router.get(
  "/",
  getSecurityChecklistRecords
);

router.get(
  "/:id",
  getSecurityChecklistRecord
);

router.post(
  "/",
  createSecurityChecklistRecord
);

router.put(
  "/:id",
  updateSecurityChecklistRecord
);

router.delete(
  "/:id",
  deleteSecurityChecklistRecord
);

export default router;