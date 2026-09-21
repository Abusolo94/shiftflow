import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| ANSWER SCHEMA
|--------------------------------------------------------------------------
| Stores the actual answer given for each FS question.
|--------------------------------------------------------------------------
*/

const answerSchema = new mongoose.Schema(
  {
    answer: {
      type: String,
      default: "",
      trim: true,
    },

    temperature: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },

    temperatureUnit: {
      type: String,
      enum: ["C", "F"],
      default: "C",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    correctiveAction: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| QUESTION RESULT SCHEMA
|--------------------------------------------------------------------------
| Stores the backend-calculated result for every FS1–FS8 question.
|--------------------------------------------------------------------------
*/

const questionResultSchema =
  new mongoose.Schema(
    {
      questionId: {
        type: String,
        required: true,
        trim: true,
      },

      code: {
        type: String,
        required: true,
        trim: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
      },

      answer: {
        type: String,
        default: "",
        trim: true,
      },

      temperature: {
        type: mongoose.Schema.Types.Mixed,
        default: "",
      },

      temperatureUnit: {
        type: String,
        enum: ["C", "F"],
        default: "C",
      },

      remarks: {
        type: String,
        default: "",
        trim: true,
      },

      correctiveAction: {
        type: String,
        default: "",
        trim: true,
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

/*
|--------------------------------------------------------------------------
| FOOD SAFETY VERIFICATION SCHEMA
|--------------------------------------------------------------------------
*/

const foodSafetyVerificationSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | FORM INFORMATION
      |--------------------------------------------------------------------------
      */

      formType: {
        type: String,
        required: true,
        default:
          "Food Safety Procedures Verification",
        trim: true,
      },

      verificationCode: {
        type: String,
        required: true,
        default: "FS1-FS8",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | STORE INFORMATION
      |--------------------------------------------------------------------------
      | storeId is the real MongoDB Store ObjectId.
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
      | VERIFICATION INFORMATION
      |--------------------------------------------------------------------------
      */

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

      verificationTime: {
        type: String,
        default: "",
        trim: true,
      },

      managerName: {
        type: String,
        required: true,
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | ANSWERS
      |--------------------------------------------------------------------------
      | Object structure:
      |
      | {
      |   fs1: {...},
      |   fs2: {...},
      |   ...
      |   fs8: {...}
      | }
      |--------------------------------------------------------------------------
      */

      answers: {
        type: Map,
        of: answerSchema,
        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | QUESTION RESULTS
      |--------------------------------------------------------------------------
      */

      questionResults: {
        type: [questionResultSchema],
        required: true,
        validate: {
          validator: function (value) {
            return (
              Array.isArray(value) &&
              value.length === 8
            );
          },

          message:
            "Food Safety Verification must contain results for all 8 questions.",
        },
      },

      /*
      |--------------------------------------------------------------------------
      | FAILED QUESTIONS
      |--------------------------------------------------------------------------
      */

      failedItems: {
        type: [questionResultSchema],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | RESULTS / SCORE
      |--------------------------------------------------------------------------
      */

      totalQuestions: {
        type: Number,
        required: true,
        default: 8,
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
        default: 8,
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

      /*
      |--------------------------------------------------------------------------
      | COMPLIANCE
      |--------------------------------------------------------------------------
      */

      complianceStatus: {
        type: String,
        enum: [
          "Incomplete",
          "Compliant",
          "Corrective Action Required",
          "Critical",
        ],
        required: true,
        default: "Incomplete",
        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | GENERAL REMARKS
      |--------------------------------------------------------------------------
      */

      generalRemarks: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | WORKFLOW STATUS
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | CREATED BY
      |--------------------------------------------------------------------------
      */

      createdByUid: {
        type: String,
        required: true,
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

      /*
      |--------------------------------------------------------------------------
      | SUBMISSION
      |--------------------------------------------------------------------------
      */

      submittedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },
    },

    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
| These will make store history and admin reporting faster.
|--------------------------------------------------------------------------
*/

foodSafetyVerificationSchema.index({
  storeId: 1,
  businessDate: -1,
});

foodSafetyVerificationSchema.index({
  storeNumber: 1,
  businessDate: -1,
});

foodSafetyVerificationSchema.index({
  storeId: 1,
  status: 1,
});

foodSafetyVerificationSchema.index({
  storeId: 1,
  complianceStatus: 1,
});

foodSafetyVerificationSchema.index({
  createdByUid: 1,
  businessDate: -1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const FoodSafetyVerification =
  mongoose.model(
    "FoodSafetyVerification",
    foodSafetyVerificationSchema
  );

export default FoodSafetyVerification;