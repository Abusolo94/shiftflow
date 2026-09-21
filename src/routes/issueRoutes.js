import express from "express";

import authenticate from "../middleware/authenticate.js";

import {
  createIssue,
  getIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
} from "../controllers/issueController.js";

const router = express.Router();

// All issue routes require Firebase authentication
router.use(authenticate);

// ======================================
// GET ALL ISSUES
// ======================================

router.get(
  "/",
  getIssues
);

// ======================================
// GET SINGLE ISSUE
// ======================================

router.get(
  "/:id",
  getSingleIssue
);

// ======================================
// CREATE ISSUE
// ======================================

router.post(
  "/",
  createIssue
);

// ======================================
// UPDATE ISSUE
// ======================================

router.put(
  "/:id",
  updateIssue
);

// ======================================
// DELETE ISSUE
// ======================================

router.delete(
  "/:id",
  deleteIssue
);

export default router;