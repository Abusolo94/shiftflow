import mongoose from "mongoose";

const checklistTaskSchema = new mongoose.Schema(
  {
    task: {
      type: String,
      trim: true,
      required: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const checklistSectionSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      trim: true,
      default: "",
    },

    tasks: {
      type: [checklistTaskSchema],
      default: [],
    },
  },
  { _id: false }
);

const checklistGroupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },

    sections: {
      type: [checklistSectionSchema],
      default: [],
    },
  },
  { _id: false }
);

const shiftSchema = new mongoose.Schema(
  {
    // =========================
    // STORE
    // =========================

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

    // =========================
    // SHIFT INFORMATION
    // =========================

    title: {
      type: String,
      trim: true,
      default: "",
    },

    shiftDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    shiftType: {
      type: String,
      trim: true,
      default: "Regular",
    },

    // =========================
    // MANAGER
    // =========================

    managerName: {
      type: String,
      trim: true,
      default: "",
    },

    managerUid: {
      type: String,
      trim: true,
      default: "",
    },

    managerComment: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // CHECKLIST
    // =========================

    checklist: {
      type: [checklistGroupSchema],
      default: [],
    },

    // =========================
    // TASK PROGRESS
    // =========================

    tasks: {
      type: Map,
      of: Boolean,
      default: {},
    },

    completedTasks: {
      type: Number,
      default: 0,
    },

    totalTasks: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
    },

    // =========================
    // ISSUES / HANDOVER
    // =========================

    issues: {
      type: String,
      trim: true,
      default: "",
    },

    handover: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // STATUS
    // =========================

    status: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "Approved",
        "Rejected",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "Draft",
      index: true,
    },

    // =========================
    // CREATOR
    // =========================

    createdByUid: {
      type: String,
      required: true,
      index: true,
    },

    createdBy: {
      type: String,
      trim: true,
      default: "",
    },

    createdByName: {
      type: String,
      trim: true,
      default: "",
    },

    createdByEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    // =========================
    // APPROVAL
    // =========================

    approvedByUid: {
      type: String,
      default: "",
    },

    approvedByName: {
      type: String,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // =========================
    // COMPLETION / VERIFICATION
    // =========================

    verified: {
      type: Boolean,
      default: false,
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

const Shift = mongoose.model("Shift", shiftSchema);

export default Shift;