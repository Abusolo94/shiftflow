import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| System Settings Schema
|--------------------------------------------------------------------------
|
| ShiftFlow uses one global settings document:
|
| key: "global"
|
| This prevents creating separate settings documents for every admin.
|--------------------------------------------------------------------------
*/

const systemSettingsSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Global Key
      |--------------------------------------------------------------------------
      */

      key: {
        type: String,

        required: true,

        default: "global",

        unique: true,

        trim: true,

        immutable: true,
      },

      /*
      |--------------------------------------------------------------------------
      | General System Information
      |--------------------------------------------------------------------------
      */

      systemName: {
        type: String,

        trim: true,

        default: "ShiftFlow",

        maxlength: [
          100,
          "System name cannot exceed 100 characters.",
        ],
      },

      companyName: {
        type: String,

        trim: true,

        default: "",

        maxlength: [
          150,
          "Company name cannot exceed 150 characters.",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | Support Information
      |--------------------------------------------------------------------------
      */

      supportEmail: {
        type: String,

        trim: true,

        lowercase: true,

        default: "",

        maxlength: [
          150,
          "Support email cannot exceed 150 characters.",
        ],
      },

      supportPhone: {
        type: String,

        trim: true,

        default: "",

        maxlength: [
          50,
          "Support phone cannot exceed 50 characters.",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | Localization
      |--------------------------------------------------------------------------
      */

      timezone: {
        type: String,

        trim: true,

        default: "Asia/Riyadh",

        maxlength: 100,
      },

      dateFormat: {
        type: String,

        enum: [
          "DD/MM/YYYY",
          "MM/DD/YYYY",
          "YYYY-MM-DD",
        ],

        default: "DD/MM/YYYY",
      },

      /*
      |--------------------------------------------------------------------------
      | Notifications
      |--------------------------------------------------------------------------
      */

      notificationsEnabled: {
        type: Boolean,

        default: true,
      },

      /*
      |--------------------------------------------------------------------------
      | System Access
      |--------------------------------------------------------------------------
      */

      maintenanceMode: {
        type: Boolean,

        default: false,
      },

      allowStoreLogin: {
        type: Boolean,

        default: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Session
      |--------------------------------------------------------------------------
      */

      sessionTimeoutMinutes: {
        type: Number,

        default: 60,

        min: [
          5,
          "Session timeout cannot be less than 5 minutes.",
        ],

        max: [
          1440,
          "Session timeout cannot exceed 1440 minutes.",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | Last Updated By
      |--------------------------------------------------------------------------
      |
      | These values should only be set by the backend using req.user.
      |--------------------------------------------------------------------------
      */

      updatedByUid: {
        type: String,

        trim: true,

        default: "",
      },

      updatedByName: {
        type: String,

        trim: true,

        default: "",

        maxlength: 150,
      },
    },

    {
      /*
      |--------------------------------------------------------------------------
      | Automatic Dates
      |--------------------------------------------------------------------------
      */

      timestamps: true,

      /*
      |--------------------------------------------------------------------------
      | Remove __v
      |--------------------------------------------------------------------------
      */

      versionKey: false,
    }
  );

/*
|--------------------------------------------------------------------------
| Support Email Validation
|--------------------------------------------------------------------------
*/

systemSettingsSchema.path(
  "supportEmail"
).validate(
  function (value) {
    if (!value) {
      return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value
    );
  },

  "Enter a valid support email."
);

/*
|--------------------------------------------------------------------------
| Index
|--------------------------------------------------------------------------
|
| There should only ever be one global settings record.
|--------------------------------------------------------------------------
*/

systemSettingsSchema.index(
  {
    key: 1,
  },
  {
    unique: true,
  }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const SystemSettings =
  mongoose.models
    .SystemSettings ||
  mongoose.model(
    "SystemSettings",
    systemSettingsSchema
  );

export default SystemSettings;