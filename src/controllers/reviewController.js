// src/controllers/reviewController.js

import FoodSafety from "../models/FoodSafety.js";
import SecurityChecklist from "../models/SecurityChecklist.js";
import Maintenance from "../models/Maintenance.js";
import RestroomCleaning from "../models/RestroomCleaning.js";
import TravelPath from "../models/TravelPath.js";
import CashAudit from "../models/CashAudit.js";
import CashTurnover from "../models/CashTurnover.js";
import EmployeeMeal from "../models/EmployeeMeal.js";

// ======================================================
// REVIEW TYPE CONFIGURATION
// ======================================================

const REVIEW_MODELS = {
  "food-safety": {
    model: FoodSafety,
    label: "Food Safety",
  },

  security: {
    model: SecurityChecklist,
    label: "Security Checklist",
  },

  maintenance: {
    model: Maintenance,
    label: "Maintenance",
  },

  restroom: {
    model: RestroomCleaning,
    label: "Restroom Cleaning",
  },

  "travel-path": {
    model: TravelPath,
    label: "Travel Path",
  },

  "cash-audit": {
    model: CashAudit,
    label: "Cash Audit",
  },

  "cash-turnover": {
    model: CashTurnover,
    label: "Cash Turnover",
  },

  "employee-meals": {
    model: EmployeeMeal,
    label: "Employee Meals",
  },
};

// ======================================================
// HELPERS
// ======================================================

const getReviewConfig = (type) => {
  return REVIEW_MODELS[type] || null;
};

const getReviewerId = (req) => {
  return (
    req.user?._id ||
    req.user?.id ||
    null
  );
};

// ======================================================
// COMPLETE REVIEW
// PATCH /api/reviews/:type/:id/complete
// ======================================================

export const completeReview = async (
  req,
  res
) => {
  try {
    const { type, id } =
      req.params;

    // --------------------------------------------------
    // Validate checklist type
    // --------------------------------------------------

    const config =
      getReviewConfig(type);

    if (!config) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid review type.",

          supportedTypes:
            Object.keys(
              REVIEW_MODELS
            ),
        });
    }

    const {
      model: Model,
      label,
    } = config;

    // --------------------------------------------------
    // Find submission
    // --------------------------------------------------

    const submission =
      await Model.findById(id);

    if (!submission) {
      return res
        .status(404)
        .json({
          success: false,

          message: `${label} submission not found.`,
        });
    }

    // --------------------------------------------------
    // Already completed
    // --------------------------------------------------

    const currentStatus =
      String(
        submission.status || ""
      ).toLowerCase();

    if (
      currentStatus ===
        "completed" ||
      currentStatus ===
        "complete"
    ) {
      return res
        .status(200)
        .json({
          success: true,

          message: `${label} review is already completed.`,

          data: submission,
        });
    }

    // --------------------------------------------------
    // Update review
    // --------------------------------------------------

    submission.status =
      "Completed";

    // These fields will only be persisted if they exist
    // in the corresponding Mongoose schema.

    if (
      submission.schema.path(
        "reviewStatus"
      )
    ) {
      submission.reviewStatus =
        "Completed";
    }

    if (
      submission.schema.path(
        "reviewedAt"
      )
    ) {
      submission.reviewedAt =
        new Date();
    }

    if (
      submission.schema.path(
        "reviewedBy"
      )
    ) {
      submission.reviewedBy =
        getReviewerId(req);
    }

    if (
      submission.schema.path(
        "completedAt"
      )
    ) {
      submission.completedAt =
        new Date();
    }

    if (
      submission.schema.path(
        "completedBy"
      )
    ) {
      submission.completedBy =
        getReviewerId(req);
    }

    await submission.save();

    // --------------------------------------------------
    // Populate reviewer where available
    // --------------------------------------------------

    if (
      submission.schema.path(
        "reviewedBy"
      )
    ) {
      await submission.populate(
        "reviewedBy",
        "fullName email role"
      );
    }

    console.log(
      `${label} review completed:`,
      {
        id:
          submission._id.toString(),

        reviewedBy:
          getReviewerId(req),
      }
    );

    return res
      .status(200)
      .json({
        success: true,

        message: `${label} review completed successfully.`,

        data: submission,
      });
  } catch (error) {
    console.error(
      "Complete review error:",
      error
    );

    // Invalid MongoDB ObjectId
    if (
      error.name ===
      "CastError"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid submission ID.",
        });
    }

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Unable to complete review.",
      });
  }
};

// ======================================================
// REOPEN REVIEW
// PATCH /api/reviews/:type/:id/reopen
// ======================================================

export const reopenReview = async (
  req,
  res
) => {
  try {
    const { type, id } =
      req.params;

    const config =
      getReviewConfig(type);

    if (!config) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid review type.",

          supportedTypes:
            Object.keys(
              REVIEW_MODELS
            ),
        });
    }

    const {
      model: Model,
      label,
    } = config;

    const submission =
      await Model.findById(id);

    if (!submission) {
      return res
        .status(404)
        .json({
          success: false,

          message: `${label} submission not found.`,
        });
    }

    // --------------------------------------------------
    // Return to pending
    // --------------------------------------------------

    submission.status =
      "Pending";

    if (
      submission.schema.path(
        "reviewStatus"
      )
    ) {
      submission.reviewStatus =
        "Pending";
    }

    if (
      submission.schema.path(
        "reviewedAt"
      )
    ) {
      submission.reviewedAt =
        null;
    }

    if (
      submission.schema.path(
        "reviewedBy"
      )
    ) {
      submission.reviewedBy =
        null;
    }

    if (
      submission.schema.path(
        "completedAt"
      )
    ) {
      submission.completedAt =
        null;
    }

    if (
      submission.schema.path(
        "completedBy"
      )
    ) {
      submission.completedBy =
        null;
    }

    await submission.save();

    console.log(
      `${label} review reopened:`,
      {
        id:
          submission._id.toString(),

        reopenedBy:
          getReviewerId(req),
      }
    );

    return res
      .status(200)
      .json({
        success: true,

        message: `${label} review returned to pending.`,

        data: submission,
      });
  } catch (error) {
    console.error(
      "Reopen review error:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Invalid submission ID.",
        });
    }

    return res
      .status(500)
      .json({
        success: false,

        message:
          error.message ||
          "Unable to reopen review.",
      });
  }
};

// ======================================================
// GET SUPPORTED REVIEW TYPES
// GET /api/reviews/types
// ======================================================

export const getReviewTypes = async (
  req,
  res
) => {
  try {
    const types =
      Object.entries(
        REVIEW_MODELS
      ).map(
        ([key, value]) => ({
          key,
          label:
            value.label,
        })
      );

    return res.json({
      success: true,

      count:
        types.length,

      data: types,
    });
  } catch (error) {
    console.error(
      "Get review types error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          "Unable to load review types.",
      });
  }
};