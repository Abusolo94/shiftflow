import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Employee Entry Schema
|--------------------------------------------------------------------------
*/

const employeeEntrySchema = new mongoose.Schema(
  {
    empNumber: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    position: {
      type: String,
      enum: [
        "Crew",
        "Crew Trainer",
        "Manager",
        "Maintenance",
      ],
      default: "Crew",
    },

    mealType: {
      type: String,
      enum: [
        "Break Meal",
        "End Shift Meal",
      ],
      default: "Break Meal",
    },

    meal: {
      type: String,
      default: "",
      trim: true,
    },

    drinks: {
      type: String,
      default: "",
      trim: true,
    },

    breakDone: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
  },
  {
    _id: false,
  }
);

/*
|--------------------------------------------------------------------------
| Employee Meal Schema
|--------------------------------------------------------------------------
*/

const employeeMealSchema = new mongoose.Schema(
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
    | Shift Information
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
    | Employee Meal Register
    |--------------------------------------------------------------------------
    */

    employees: {
      type: [employeeEntrySchema],
      default: [],
    },

    /*
    |--------------------------------------------------------------------------
    | Server Calculated Statistics
    |--------------------------------------------------------------------------
    */

    totalEmployees: {
      type: Number,
      default: 0,
      min: 0,
    },

    mealsTaken: {
      type: Number,
      default: 0,
      min: 0,
    },

    drinksTaken: {
      type: Number,
      default: 0,
      min: 0,
    },

    breaksDone: {
      type: Number,
      default: 0,
      min: 0,
    },

    noMeal: {
      type: Number,
      default: 0,
      min: 0,
    },

    noDrink: {
      type: Number,
      default: 0,
      min: 0,
    },

    mealCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    breakCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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

employeeMealSchema.index({
  storeId: 1,
  businessDate: -1,
});

employeeMealSchema.index({
  storeId: 1,
  status: 1,
  businessDate: -1,
});

employeeMealSchema.index({
  storeId: 1,
  shift: 1,
  businessDate: -1,
});

employeeMealSchema.index({
  storeNumber: 1,
  businessDate: -1,
});

employeeMealSchema.index({
  status: 1,
  businessDate: -1,
});

employeeMealSchema.index({
  createdByUid: 1,
  businessDate: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const EmployeeMeal = mongoose.model(
  "EmployeeMeal",
  employeeMealSchema
);

export default EmployeeMeal;