import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Denomination Schema
|--------------------------------------------------------------------------
*/

const denominationSchema =
  new mongoose.Schema(
    {
      value: {
        type: Number,
        required: true,
        min: 0,
      },

      quantity: {
        type: Number,
        default: 0,
        min: 0,
      },

      total: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| Cash Procedure Schema
|--------------------------------------------------------------------------
*/

const procedureSchema =
  new mongoose.Schema(
    {
      questionId: {
        type: String,
        required: true,
        trim: true,
      },

      number: {
        type: Number,
        required: true,
        min: 1,
      },

      label: {
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
        default: false,
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| Main Cash Audit Schema
|--------------------------------------------------------------------------
*/

const cashAuditSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Form
      |--------------------------------------------------------------------------
      */

      formType: {
        type: String,
        default:
          "Cash Audit",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Store
      |--------------------------------------------------------------------------
      */

      storeId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

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
      | Audit Information
      |--------------------------------------------------------------------------
      */

      businessDate: {
        type: Date,

        required: true,

        index: true,
      },

      auditTime: {
        type: String,

        default: "",

        trim: true,
      },

      period: {
        type: String,

        enum: [
          "AM",
          "PM",
        ],

        required: true,

        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Cash Denominations
      |--------------------------------------------------------------------------
      */

      denominations: {
        type: [
          denominationSchema,
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Cash Totals
      |--------------------------------------------------------------------------
      */

      notesTotal: {
        type: Number,

        default: 0,

        min: 0,
      },

      coins: {
        type: Number,

        default: 0,

        min: 0,
      },

      cashSubtotal: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | Set Drawer / Other Cash
      |--------------------------------------------------------------------------
      */

      setDrawer500: {
        type: Number,

        default: 0,

        min: 0,
      },

      dollarRate: {
        type: Number,

        default: 0,

        min: 0,
      },

      mcdelRate: {
        type: Number,

        default: 0,

        min: 0,
      },

      setDrawerTotal: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | PCV
      |--------------------------------------------------------------------------
      */

      pcvCash: {
        type: Number,

        default: 0,

        min: 0,
      },

      pcvReceipts: {
        type: Number,

        default: 0,

        min: 0,
      },

      pcvTotal: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | MCDEL
      |--------------------------------------------------------------------------
      */

      mcdelCash: {
        type: Number,

        default: 0,

        min: 0,
      },

      mcdelReceipts: {
        type: Number,

        default: 0,

        min: 0,
      },

      mcdelTotal: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | Deposits
      |--------------------------------------------------------------------------
      */

      depositDay: {
        type: Number,

        default: 0,

        min: 0,
      },

      depositNight: {
        type: Number,

        default: 0,

        min: 0,
      },

      depositsTotal: {
        type: Number,

        default: 0,

        min: 0,
      },

      /*
      |--------------------------------------------------------------------------
      | Grand Total
      |--------------------------------------------------------------------------
      */

      grandTotal: {
        type: Number,

        default: 0,

        min: 0,

        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Personnel
      |--------------------------------------------------------------------------
      */

      preparedBy: {
        type: String,

        required: true,

        trim: true,
      },

      verifiedBy: {
        type: String,

        required: true,

        trim: true,
      },

      receivedBy: {
        type: String,

        required: true,

        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Additional Verification
      |--------------------------------------------------------------------------
      */

      employeeMealsVerified: {
        type: String,

        default: "",

        trim: true,
      },

      promoCouponVerified: {
        type: String,

        default: "",

        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Cash Procedure Verification
      |--------------------------------------------------------------------------
      */

      procedures: {
        type: [
          procedureSchema,
        ],

        default: [],
      },

      procedurePassed: {
        type: Number,

        default: 0,

        min: 0,
      },

      procedureFailed: {
        type: Number,

        default: 0,

        min: 0,
      },

      procedureAnswered: {
        type: Number,

        default: 0,

        min: 0,
      },

      procedureUnanswered: {
        type: Number,

        default: 0,

        min: 0,
      },

      procedureScore: {
        type: Number,

        default: 0,

        min: 0,

        max: 100,

        index: true,
      },

      failedProcedures: {
        type: [
          procedureSchema,
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Audit Comments
      |--------------------------------------------------------------------------
      */

      auditComments: {
        type: String,

        default: "",

        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Workflow
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

        default:
          "Pending",

        index: true,
      },

      submittedAt: {
        type: Date,

        default: Date.now,

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
      | Store Completion
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

cashAuditSchema.index({
  storeId: 1,
  businessDate: -1,
});

cashAuditSchema.index({
  storeId: 1,
  status: 1,
  businessDate: -1,
});

cashAuditSchema.index({
  storeId: 1,
  period: 1,
  businessDate: -1,
});

cashAuditSchema.index({
  storeNumber: 1,
  businessDate: -1,
});

cashAuditSchema.index({
  status: 1,
  businessDate: -1,
});

cashAuditSchema.index({
  procedureScore: -1,
  businessDate: -1,
});

cashAuditSchema.index({
  createdByUid: 1,
  businessDate: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const CashAudit =
  mongoose.models
    .CashAudit ||
  mongoose.model(
    "CashAudit",
    cashAuditSchema
  );

export default CashAudit;