import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    // ======================================
    // STORE
    // ======================================

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
      trim: true,
      default: "",
    },

    // ======================================
    // ISSUE INFORMATION
    // ======================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    priority: {
      type: String,
      enum: [
        "Low",
        "Medium",
        "High",
        "Critical",
      ],
      default: "Medium",
      index: true,
    },

    // ======================================
    // STATUS
    // ======================================

    status: {
      type: String,
      enum: [
        "Open",
        "In Progress",
        "Resolved",
        "Closed",
      ],
      default: "Open",
      index: true,
    },

    // ======================================
    // REPORTER
    // ======================================

    reportedByUid: {
      type: String,
      trim: true,
      index: true,
    },

    reportedByName: {
      type: String,
      trim: true,
      default: "",
    },

    reportedByEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    // ======================================
    // ASSIGNMENT
    // ======================================

    assignedTo: {
      type: String,
      trim: true,
      default: "",
    },

    assignedToUid: {
      type: String,
      trim: true,
      default: "",
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    // ======================================
    // RESOLUTION
    // ======================================

    resolution: {
      type: String,
      trim: true,
      default: "",
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedByUid: {
      type: String,
      trim: true,
      default: "",
    },

    resolvedByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Issue = mongoose.model(
  "Issue",
  issueSchema
);

export default Issue;