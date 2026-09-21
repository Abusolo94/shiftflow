import mongoose from "mongoose";

const storeSchema =
  new mongoose.Schema(
    {
      storeNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
      },

      storeName: {
        type: String,
        required: true,
        trim: true,
      },

      contact: {
        type: String,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
        lowercase: true,
      },

      city: {
        type: String,
        trim: true,
      },

      region: {
        type: String,
        trim: true,
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
    },
    {
      timestamps: true,
    }
  );

const Store =
  mongoose.model(
    "Store",
    storeSchema
  );

export default Store;