import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Cleaning Task Schema
|--------------------------------------------------------------------------
*/

const cleaningTaskSchema =
  new mongoose.Schema(
    {
      id: {
        type: String,
        required: true,
        trim: true,
      },

      label: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| Inspection Task Schema
|--------------------------------------------------------------------------
|
| Each inspection contains the 11 restroom
| cleaning tasks and whether each one passed.
|
*/

const inspectionTasksSchema =
  new mongoose.Schema(
    {
      toilets: {
        type: Boolean,
        default: false,
      },

      urinals: {
        type: Boolean,
        default: false,
      },

      washBasins: {
        type: Boolean,
        default: false,
      },

      mirrors: {
        type: Boolean,
        default: false,
      },

      floor: {
        type: Boolean,
        default: false,
      },

      soap: {
        type: Boolean,
        default: false,
      },

      tissue: {
        type: Boolean,
        default: false,
      },

      handDryer: {
        type: Boolean,
        default: false,
      },

      trash: {
        type: Boolean,
        default: false,
      },

      odor: {
        type: Boolean,
        default: false,
      },

      doors: {
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
| Inspection Schema
|--------------------------------------------------------------------------
*/

const inspectionSchema =
  new mongoose.Schema(
    {
      time: {
        type: String,
        required: true,
        trim: true,
      },

      initials: {
        type: String,
        default: "",
        trim: true,
        maxlength: 20,
      },

      remarks: {
        type: String,
        default: "",
        trim: true,
        maxlength: 1000,
      },

      completed: {
        type: Boolean,
        default: false,
      },

      tasks: {
        type: inspectionTasksSchema,
        default: () => ({}),
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| Restroom Cleaning Schema
|--------------------------------------------------------------------------
*/

const restroomCleaningSchema =
  new mongoose.Schema(
    {
      /*
       * ---------------------------------------------------------------
       * Store
       * ---------------------------------------------------------------
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
       * ---------------------------------------------------------------
       * Business Information
       * ---------------------------------------------------------------
       */

      businessDate: {
        type: Date,
        required: true,
        index: true,
      },

      supervisorName: {
        type: String,
        required: true,
        trim: true,
      },

      employeeName: {
        type: String,
        default: "",
        trim: true,
      },

      /*
       * ---------------------------------------------------------------
       * Cleaning Inspections
       * ---------------------------------------------------------------
       */

      inspections: {
        type: [inspectionSchema],
        required: true,
        default: [],
      },

      /*
       * ---------------------------------------------------------------
       * Cleaning Task Definitions
       * ---------------------------------------------------------------
       |
       | This stores the task definitions used when
       | the checklist was submitted.
       |
       */

      cleaningTasks: {
        type: [cleaningTaskSchema],
        default: [],
      },

      /*
       * ---------------------------------------------------------------
       * Inspection Statistics
       * ---------------------------------------------------------------
       */

      totalInspections: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      completedInspections: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      inspectionsWithInitials: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      inspectionCompletion: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100,
      },

      /*
       * ---------------------------------------------------------------
       * Task Statistics
       * ---------------------------------------------------------------
       */

      completedTasks: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      totalPossibleTasks: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },

      taskCompletion: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100,
      },

      /*
       * ---------------------------------------------------------------
       * Remarks
       * ---------------------------------------------------------------
       */

      overallRemarks: {
        type: String,
        default: "",
        trim: true,
        maxlength: 5000,
      },

      /*
       * ---------------------------------------------------------------
       * Workflow Status
       * ---------------------------------------------------------------
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
       * ---------------------------------------------------------------
       * Creator
       * ---------------------------------------------------------------
       */

      createdByUid: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },

      createdBy: {
        type: String,
        default: "",
        trim: true,
      },

      submittedAt: {
        type: Date,
        default: Date.now,
        index: true,
      },

      /*
       * ---------------------------------------------------------------
       * Admin Review
       * ---------------------------------------------------------------
       */

      adminComment: {
        type: String,
        default: "",
        trim: true,
        maxlength: 5000,
      },

      rejectionReason: {
        type: String,
        default: "",
        trim: true,
        maxlength: 5000,
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

/*
 * Store + newest business dates.
 */
restroomCleaningSchema.index({
  storeId: 1,
  businessDate: -1,
});

/*
 * Store + status.
 */
restroomCleaningSchema.index({
  storeId: 1,
  status: 1,
});

/*
 * Store + business date + status.
 */
restroomCleaningSchema.index({
  storeId: 1,
  businessDate: -1,
  status: 1,
});

/*
 * Creator + newest records.
 */
restroomCleaningSchema.index({
  createdByUid: 1,
  businessDate: -1,
});

/*
 * Supervisor search.
 */
restroomCleaningSchema.index({
  supervisorName: 1,
});

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const RestroomCleaning =
  mongoose.model(
    "RestroomCleaning",
    restroomCleaningSchema
  );

export default RestroomCleaning;