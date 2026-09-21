import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  getCashTurnovers,
  getCashTurnover,
  createCashTurnover,
  updateCashTurnover,
  deleteCashTurnover,
} from "../controllers/cashTurnoverController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Protect All Cash Turnover Routes
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Cash Turnover Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getCashTurnovers
);

router.get(
  "/:id",
  getCashTurnover
);

router.post(
  "/",
  createCashTurnover
);

router.put(
  "/:id",
  updateCashTurnover
);

router.delete(
  "/:id",
  deleteCashTurnover
);

export default router;