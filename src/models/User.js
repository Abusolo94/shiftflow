import mongoose from "mongoose";

const userSchema =
  new mongoose.Schema(
    {
      firebaseUid: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      displayName: {
        type: String,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      role: {
        type: String,
        enum: [
          "Admin",
          "Store Account",
        ],
        default: "Store Account",
      },

      accountType: {
        type: String,
        enum: [
          "admin",
          "store",
        ],
        default: "store",
        index: true,
      },

      storeId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Store",
        default: null,
      },

      storeNumber: {
        type: String,
        trim: true,
        index: true,
      },

      storeName: {
        type: String,
        trim: true,
      },

      contact: {
        type: String,
        trim: true,
      },

      usersAllowed: {
        type: [String],
        default: [],
      },

      status: {
        type: String,
        enum: [
          "Active",
          "Inactive",
          "Disabled",
          "Suspended",
        ],
        default: "Active",
      },

      lastLogin: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

const User =
  mongoose.model(
    "User",
    userSchema
  );

export default User;