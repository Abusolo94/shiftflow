import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Denomination Schema
|--------------------------------------------------------------------------
*/

const denominationSchema = new mongoose.Schema(
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
| Cash Turnover Schema
|--------------------------------------------------------------------------
*/

const cashTurnoverSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | Store
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
        "OP",
        "MID",
        "CL",
      ],
      required: true,
      index: true,
    },

    /*
    |--------------------------------------------------------------------------
    | People
    |--------------------------------------------------------------------------
    */

    managerName: {
      type: String,
      default: "",
      trim: true,
    },

    preparedBy: {
      type: String,
      required: true,
      trim: true,
    },

    receivedBy: {
      type: String,
      required: true,
      trim: true,
    },

    verifiedBy: {
      type: String,
      required: true,
      trim: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Cash Count
    |--------------------------------------------------------------------------
    */

    denominations: {
      type: [denominationSchema],
      default: [],
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

    pcvInvoices: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Other Amounts
    |--------------------------------------------------------------------------
    */

    swipeCard: {
      type: Number,
      default: 0,
      min: 0,
    },

    mdsKey: {
      type: Number,
      default: 0,
      min: 0,
    },

    refund: {
      type: Number,
      default: 0,
      min: 0,
    },

    deposits: {
      type: Number,
      default: 0,
      min: 0,
    },

    receipt: {
      type: Number,
      default: 0,
      min: 0,
    },

    others: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Server Calculated Totals
    |--------------------------------------------------------------------------
    */

    cashTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    pcvTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    otherTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Reconciliation
    |--------------------------------------------------------------------------
    */

    actualCash: {
      type: Number,
      default: 0,
      min: 0,
    },

    expectedCash: {
      type: Number,
      default: 0,
      min: 0,
    },

    variance: {
      type: Number,
      default: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Notes
    |--------------------------------------------------------------------------
    */

    remarks: {
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

cashTurnoverSchema.index({
  storeId: 1,
  businessDate: -1,
});

cashTurnoverSchema.index({
  storeId: 1,
  status: 1,
  businessDate: -1,
});

cashTurnoverSchema.index({
  storeId: 1,
  shift: 1,
  businessDate: -1,
});

cashTurnoverSchema.index({
  storeNumber: 1,
  businessDate: -1,
});

cashTurnoverSchema.index({
  status: 1,
  businessDate: -1,
});

cashTurnoverSchema.index({
  createdByUid: 1,
  businessDate: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const CashTurnover =
  mongoose.model(
    "CashTurnover",
    cashTurnoverSchema
  );

export default CashTurnover;