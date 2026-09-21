import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Secondary Duty
|--------------------------------------------------------------------------
*/

const secondaryDutySchema =
  new mongoose.Schema(
    {
      what: {
        type: String,
        default: "",
        trim: true,
      },

      who: {
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
| Break
|--------------------------------------------------------------------------
*/

const breakSchema =
  new mongoose.Schema(
    {
      who: {
        type: String,
        default: "",
        trim: true,
      },

      when: {
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
| Action
|--------------------------------------------------------------------------
*/

const actionSchema =
  new mongoose.Schema(
    {
      what: {
        type: String,
        default: "",
        trim: true,
      },

      who: {
        type: String,
        default: "",
        trim: true,
      },

      when: {
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
| Station Crew
|--------------------------------------------------------------------------
|
| These keys match ShiftPlanBoard.jsx exactly.
|
*/

const stationCrewSchema =
  new mongoose.Schema(
    {
      drink: {
        type: String,
        default: "",
        trim: true,
      },

      dtot: {
        type: String,
        default: "",
        trim: true,
      },

      dtpb: {
        type: String,
        default: "",
        trim: true,
      },

      fries: {
        type: String,
        default: "",
        trim: true,
      },

      fryers: {
        type: String,
        default: "",
        trim: true,
      },

      dtotc: {
        type: String,
        default: "",
        trim: true,
      },

      bs: {
        type: String,
        default: "",
        trim: true,
      },

      pos1: {
        type: String,
        default: "",
        trim: true,
      },

      pos2: {
        type: String,
        default: "",
        trim: true,
      },

      pos3: {
        type: String,
        default: "",
        trim: true,
      },

      cciDrink: {
        type: String,
        default: "",
        trim: true,
      },

      grill1: {
        type: String,
        default: "",
        trim: true,
      },

      grill2: {
        type: String,
        default: "",
        trim: true,
      },

      buns: {
        type: String,
        default: "",
        trim: true,
      },

      prepTable: {
        type: String,
        default: "",
        trim: true,
      },

      uhc1: {
        type: String,
        default: "",
        trim: true,
      },

      uhc2: {
        type: String,
        default: "",
        trim: true,
      },

      hlz1: {
        type: String,
        default: "",
        trim: true,
      },

      hlz2: {
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
| Shift Plan Schema
|--------------------------------------------------------------------------
*/

const shiftPlanSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Store Identity
      |--------------------------------------------------------------------------
      |
      | Derived by the backend from the authenticated account.
      |
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

      mealPeriod: {
        type: String,

        enum: [
          "Breakfast",
          "Lunch",
          "Dinner",
        ],

        required: true,

        index: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Managers
      |--------------------------------------------------------------------------
      */

      productionManager: {
        type: String,
        default: "",
        trim: true,
      },

      serviceManager: {
        type: String,
        default: "",
        trim: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Crew
      |--------------------------------------------------------------------------
      |
      | The frontend currently has 10 crew slots.
      |
      */

      crew: {
        type: [
          {
            type: String,
            trim: true,
          },
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Station Assignments
      |--------------------------------------------------------------------------
      */

      stationCrew: {
        type: stationCrewSchema,

        default: () => ({}),
      },

      /*
      |--------------------------------------------------------------------------
      | Secondary Duties
      |--------------------------------------------------------------------------
      */

      secondaryDuties: {
        type: [
          secondaryDutySchema,
        ],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Breaks
      |--------------------------------------------------------------------------
      */

      breaks: {
        type: [breakSchema],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Actions
      |--------------------------------------------------------------------------
      */

      actions: {
        type: [actionSchema],

        default: [],
      },

      /*
      |--------------------------------------------------------------------------
      | Server Calculated Statistics
      |--------------------------------------------------------------------------
      */

      totalCrew: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalStations: {
        type: Number,
        default: 0,
        min: 0,
      },

      availableStations: {
        type: Number,
        default: 19,
        min: 0,
      },

      unassignedStations: {
        type: Number,
        default: 19,
        min: 0,
      },

      stationCoverage: {
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

shiftPlanSchema.index({
  storeId: 1,
  businessDate: -1,
});

shiftPlanSchema.index({
  storeId: 1,
  status: 1,
  businessDate: -1,
});

shiftPlanSchema.index({
  storeId: 1,
  shift: 1,
  businessDate: -1,
});

shiftPlanSchema.index({
  storeId: 1,
  mealPeriod: 1,
  businessDate: -1,
});

shiftPlanSchema.index({
  storeNumber: 1,
  businessDate: -1,
});

shiftPlanSchema.index({
  status: 1,
  businessDate: -1,
});

shiftPlanSchema.index({
  createdByUid: 1,
  businessDate: -1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const ShiftPlan =
  mongoose.model(
    "ShiftPlan",
    shiftPlanSchema
  );

export default ShiftPlan;