import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Checklist Item Schema
|--------------------------------------------------------------------------
*/

const travelPathItemSchema =
  new mongoose.Schema(
    {
      itemId: {
        type: String,
        required: true,
        trim: true,
      },

      itemLabel: {
        type: String,
        required: true,
        trim: true,
      },

      status: {
        type: String,
        enum: [
          "",
          "pass",
          "attention",
          "fail",
        ],
        default: "",
      },

      comment: {
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
| Checklist Section Schema
|--------------------------------------------------------------------------
*/

const travelPathSectionSchema =
  new mongoose.Schema(
    {
      sectionId: {
        type: String,
        required: true,
        trim: true,
      },

      sectionTitle: {
        type: String,
        required: true,
        trim: true,
      },

      items: {
        type: [travelPathItemSchema],
        required: true,
        default: [],
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| Travel Path Schema
|--------------------------------------------------------------------------
*/

const travelPathSchema =
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
      | Business Information
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

      managerName: {
        type: String,
        required: true,
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Checklist
      |--------------------------------------------------------------------------
      */

      sections: {
        type: [travelPathSectionSchema],
        required: true,
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Checklist Statistics
      |--------------------------------------------------------------------------
      */

      totalItems: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      reviewedItems: {
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

      needsAttention: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      unreviewed: {
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

      performance: {
        type: String,
        enum: [
          "Excellent",
          "Very Good",
          "Good",
          "Needs Improvement",
          "Critical",
        ],
        default: "Critical",
      },

      /*
      |--------------------------------------------------------------------------
      | Failed / Attention Items
      |--------------------------------------------------------------------------
      */

      failedItems: {
        type: [
          {
            sectionId: {
              type: String,
              trim: true,
            },

            sectionTitle: {
              type: String,
              trim: true,
            },

            itemId: {
              type: String,
              trim: true,
            },

            itemLabel: {
              type: String,
              trim: true,
            },

            comment: {
              type: String,
              default: "",
              trim: true,
            },
          },
        ],
        default: [],
      },

      attentionItems: {
        type: [
          {
            sectionId: {
              type: String,
              trim: true,
            },

            sectionTitle: {
              type: String,
              trim: true,
            },

            itemId: {
              type: String,
              trim: true,
            },

            itemLabel: {
              type: String,
              trim: true,
            },

            comment: {
              type: String,
              default: "",
              trim: true,
            },
          },
        ],
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Remarks
      |--------------------------------------------------------------------------
      */

      remarks: {
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
      | Created By
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

      completedAt: {
        type: Date,
        default: null,
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

travelPathSchema.index({
  storeId: 1,
  businessDate: -1,
});

travelPathSchema.index({
  storeId: 1,
  shift: 1,
  businessDate: -1,
});

travelPathSchema.index({
  storeId: 1,
  status: 1,
});

travelPathSchema.index({
  storeNumber: 1,
  businessDate: -1,
});

travelPathSchema.index({
  createdByUid: 1,
  businessDate: -1,
});

travelPathSchema.index({
  performance: 1,
  businessDate: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const TravelPath =
  mongoose.model(
    "TravelPath",
    travelPathSchema
  );

export default TravelPath;