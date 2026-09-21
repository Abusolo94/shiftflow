import mongoose from "mongoose";

// ======================================================
// FOOD SAFETY CHECKLIST ITEM
// ======================================================

const checklistItemSchema =
  new mongoose.Schema(
    {
      item: {
        type: String,
        required: true,
        trim: true,
      },

      result: {
        type: String,
        enum: ["yes", "no", "unchecked"],
        default: "unchecked",
      },

      passed: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

// ======================================================
// FOOD SAFETY REPORT
// ======================================================

const foodSafetySchema =
  new mongoose.Schema(
    {
      // ==================================================
      // STORE
      // ==================================================

      storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
        index: true,
      },

      storeNumber: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      storeName: {
        type: String,
        required: true,
        trim: true,
      },

      // ==================================================
      // REPORT INFORMATION
      // ==================================================

      businessDate: {
        type: Date,
        required: true,
        index: true,
      },

      shift: {
        type: String,
        enum: [
          "Opening",
          "Mid",
          "Closing",
        ],
        required: true,
        index: true,
      },

      managerName: {
        type: String,
        trim: true,
      },

      // ==================================================
      // CHECKLIST
      // ==================================================

      checklist: {
        type: [checklistItemSchema],
        required: true,
        validate: {
          validator: function (value) {
            return (
              Array.isArray(value) &&
              value.length > 0
            );
          },

          message:
            "Food Safety checklist cannot be empty.",
        },
      },

      // ==================================================
      // NOTES
      // ==================================================

      findings: {
        type: String,
        trim: true,
        default: "",
      },

      opportunities: {
        type: String,
        trim: true,
        default: "",
      },

      actionTaken: {
        type: String,
        trim: true,
        default: "",
      },

      // ==================================================
      // RESULTS
      // ==================================================

      passed: {
        type: Number,
        default: 0,
        min: 0,
      },

      failed: {
        type: Number,
        default: 0,
        min: 0,
      },

      unchecked: {
        type: Number,
        default: 0,
        min: 0,
      },

      total: {
        type: Number,
        default: 0,
        min: 0,
      },

      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      // ==================================================
      // REPORT STATUS
      // ==================================================

      status: {
        type: String,
        enum: [
          "Pending",
          "Completed",
          "Failed",
          "Reviewed",
        ],
        default: "Pending",
        index: true,
      },

      // ==================================================
      // CREATOR
      // ==================================================

      createdByUid: {
        type: String,
        required: true,
        index: true,
      },

      createdByName: {
        type: String,
        trim: true,
      },

      createdByEmail: {
        type: String,
        trim: true,
        lowercase: true,
      },

      // ==================================================
      // SUBMISSION
      // ==================================================

      submittedAt: {
        type: Date,
        default: Date.now,
      },
    },

    {
      timestamps: true,
    }
  );

// ======================================================
// INDEXES
// ======================================================

// Useful for store Food Safety history
foodSafetySchema.index({
  storeId: 1,
  businessDate: -1,
});

// Useful for filtering by status
foodSafetySchema.index({
  storeId: 1,
  status: 1,
});

// Useful for filtering by shift
foodSafetySchema.index({
  storeId: 1,
  shift: 1,
});

// Useful for admin reports
foodSafetySchema.index({
  storeNumber: 1,
  businessDate: -1,
});

// ======================================================
// MODEL
// ======================================================

const FoodSafety =
  mongoose.model(
    "FoodSafety",
    foodSafetySchema
  );

export default FoodSafety;