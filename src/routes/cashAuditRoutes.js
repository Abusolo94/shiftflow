import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  getCashAudits,
  getCashAudit,
  createCashAudit,
  updateCashAudit,
  deleteCashAudit,
} from "../controllers/cashAuditController.js";

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Protect all Cash Audit routes
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Cash Audit Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getCashAudits
);

router.get(
  "/:id",
  getCashAudit
);

router.post(
  "/",
  createCashAudit
);

router.put(
  "/:id",
  updateCashAudit
);

router.delete(
  "/:id",
  deleteCashAudit
);

export default router;