import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  getEmployeeMeals,
  getEmployeeMeal,
  createEmployeeMeal,
  updateEmployeeMeal,
  deleteEmployeeMeal,
} from "../controllers/employeeMealController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Protect All Employee Meal Routes
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Employee Meal Routes
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getEmployeeMeals
);

router.get(
  "/:id",
  getEmployeeMeal
);

router.post(
  "/",
  createEmployeeMeal
);

router.put(
  "/:id",
  updateEmployeeMeal
);

router.delete(
  "/:id",
  deleteEmployeeMeal
);

export default router;