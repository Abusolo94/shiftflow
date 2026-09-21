import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| MAINTENANCE TASK
|--------------------------------------------------------------------------
*/

const maintenanceTaskSchema =
  new mongoose.Schema(
    {
      task: {
        type: String,
        required: true,
        trim: true,
      },

      result: {
        type: String,
        enum: [
          "yes",
          "no",
          "Not Checked",
        ],
        default: "Not Checked",
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
| MAINTENANCE SECTION
|--------------------------------------------------------------------------
*/

const maintenanceSectionSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },

      tasks: {
        type: [maintenanceTaskSchema],
        default: [],
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| MAINTENANCE SCHEMA
|--------------------------------------------------------------------------
*/

const maintenanceSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | STORE
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
      | MAINTENANCE INFORMATION
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
      | CHECKLIST
      |--------------------------------------------------------------------------
      */

      checklist: {
        type: [
          maintenanceSectionSchema,
        ],
        required: true,
        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | MAINTENANCE NOTES
      |--------------------------------------------------------------------------
      */

      findings: {
        type: String,
        default: "",
        trim: true,
      },

      repairsRequired: {
        type: String,
        default: "",
        trim: true,
      },

      comments: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | CALCULATED RESULTS
      |--------------------------------------------------------------------------
      |
      | These values are calculated by the backend controller.
      | They should not be trusted from the frontend.
      |--------------------------------------------------------------------------
      */

      total: {
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

      unchecked: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
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
      | STATUS
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
      | CREATOR
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
*/

/*
| Store maintenance history
*/
maintenanceSchema.index({
  storeId: 1,
  businessDate: -1,
});

/*
| Store + shift
*/
maintenanceSchema.index({
  storeId: 1,
  shift: 1,
  businessDate: -1,
});

/*
| Store + status
*/
maintenanceSchema.index({
  storeId: 1,
  status: 1,
});

/*
| Created by user
*/
maintenanceSchema.index({
  createdByUid: 1,
  businessDate: -1,
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

const Maintenance =
  mongoose.model(
    "Maintenance",
    maintenanceSchema
  );

export default Maintenance;