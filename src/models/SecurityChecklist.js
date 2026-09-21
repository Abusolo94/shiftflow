import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Security Response Schema
|--------------------------------------------------------------------------
*/

const securityResponseSchema =
  new mongoose.Schema(
    {
      number: {
        type: Number,
        required: true,
      },

      questionId: {
        type: String,
        required: true,
        trim: true,
      },

      question: {
        type: String,
        required: true,
        trim: true,
      },

      answer: {
        type: String,
        enum: [
          "yes",
          "no",
        ],
        required: true,
      },

      remarks: {
        type: String,
        default: "",
        trim: true,
      },

      actionPlan: {
        type: String,
        default: "",
        trim: true,
      },

      passed: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| Security Checklist Schema
|--------------------------------------------------------------------------
*/

const securityChecklistSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Store Identity
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | Form Information
      |--------------------------------------------------------------------------
      */

      formType: {
        type: String,
        default: "Security Checklist",
        trim: true,
      },

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

      restaurantManager: {
        type: String,
        required: true,
        trim: true,
      },

      completedBy: {
        type: String,
        required: true,
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Checklist Responses
      |--------------------------------------------------------------------------
      */

      responses: {
        type: [
          securityResponseSchema,
        ],
        required: true,
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Results
      |--------------------------------------------------------------------------
      */

      totalQuestions: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      answeredQuestions: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      passed: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      failed: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      unanswered: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      completionPercentage: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100,
      },

      score: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100,
      },

      complianceStatus: {
        type: String,
        enum: [
          "Incomplete",
          "Compliant",
          "Action Required",
          "Critical",
        ],
        default: "Incomplete",
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Failed Items
      |--------------------------------------------------------------------------
      */

      failedItems: {
        type: [
          securityResponseSchema,
        ],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Findings / Action Plans
      |--------------------------------------------------------------------------
      */

      findingsAndActionPlans: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Workflow Status
      |--------------------------------------------------------------------------
      */

      status: {
        type: String,
        enum: [
          "Pending",
          "Reviewed",
          "Failed",
          "Completed",
        ],
        default: "Pending",
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Creator
      |--------------------------------------------------------------------------
      */

      createdByUid: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      createdByName: {
        type: String,
        default: "",
        trim: true,
      },

      createdByEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      submittedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Admin Review
      |--------------------------------------------------------------------------
      */

      adminComment: {
        type: String,
        default: "",
        trim: true,
      },

      failureReason: {
        type: String,
        default: "",
        trim: true,
      },

      reviewedByUid: {
        type: String,
        default: "",
        trim: true,
      },

      reviewedByName: {
        type: String,
        default: "",
        trim: true,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | Completion
      |--------------------------------------------------------------------------
      */

      completedAt: {
        type: Date,
        default: null,
      },

      completedByUid: {
        type: String,
        default: "",
        trim: true,
      },

      completedByName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

securityChecklistSchema.index({
  storeId: 1,
  businessDate: -1,
});

securityChecklistSchema.index({
  storeId: 1,
  status: 1,
});

securityChecklistSchema.index({
  storeId: 1,
  shift: 1,
  businessDate: -1,
});

securityChecklistSchema.index({
  storeNumber: 1,
  businessDate: -1,
});

securityChecklistSchema.index({
  complianceStatus: 1,
  businessDate: -1,
});

securityChecklistSchema.index({
  createdByUid: 1,
  businessDate: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const SecurityChecklist =
  mongoose.model(
    "SecurityChecklist",
    securityChecklistSchema
  );

export default SecurityChecklist;