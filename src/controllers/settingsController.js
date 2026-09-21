import SystemSettings from "../models/SystemSettings.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const cleanString = (value) =>
  String(value ?? "").trim();

const normalize = (value) =>
  cleanString(value).toLowerCase();

const isAdminAccount = (user) => {
  const role = normalize(user?.role);
  const accountType = normalize(
    user?.accountType
  );

  return (
    role === "admin" ||
    accountType === "admin"
  );
};

const getUpdaterInfo = (req) => ({
  updatedByUid:
    req.user?.firebaseUid ||
    req.firebaseUser?.uid ||
    "",

  updatedByName:
    req.user?.displayName ||
    req.user?.name ||
    "Administrator",
});

const formatSettings = (record) => ({
  id: String(record._id),
  _id: record._id,

  systemName:
    record.systemName,

  companyName:
    record.companyName,

  supportEmail:
    record.supportEmail,

  supportPhone:
    record.supportPhone,

  timezone:
    record.timezone,

  dateFormat:
    record.dateFormat,

  notificationsEnabled:
    record.notificationsEnabled,

  maintenanceMode:
    record.maintenanceMode,

  allowStoreLogin:
    record.allowStoreLogin,

  sessionTimeoutMinutes:
    record.sessionTimeoutMinutes,

  updatedByUid:
    record.updatedByUid,

  updatedByName:
    record.updatedByName,

  createdAt:
    record.createdAt,

  updatedAt:
    record.updatedAt,
});

/*
|--------------------------------------------------------------------------
| GET SETTINGS
|--------------------------------------------------------------------------
*/

export const getSettings = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Admin Only
    |--------------------------------------------------------------------------
    */

    if (!isAdminAccount(req.user)) {
      return res.status(403).json({
        success: false,
        message:
          "Administrator access required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Load Global Settings
    |--------------------------------------------------------------------------
    */

    let settings =
      await SystemSettings.findOne({
        key: "global",
      });

    /*
    |--------------------------------------------------------------------------
    | Create Defaults If Missing
    |--------------------------------------------------------------------------
    */

    if (!settings) {
      settings =
        await SystemSettings.create({
          key: "global",
        });
    }

    return res.status(200).json({
      success: true,
      settings:
        formatSettings(settings),
    });
  } catch (error) {
    console.error(
      "Get Settings Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load settings.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE SETTINGS
|--------------------------------------------------------------------------
*/

export const updateSettings = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Admin Only
    |--------------------------------------------------------------------------
    */

    if (!isAdminAccount(req.user)) {
      return res.status(403).json({
        success: false,
        message:
          "Administrator access required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Load Existing Settings
    |--------------------------------------------------------------------------
    */

    let settings =
      await SystemSettings.findOne({
        key: "global",
      });

    if (!settings) {
      settings =
        new SystemSettings({
          key: "global",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Safe Editable Fields
    |--------------------------------------------------------------------------
    */

    const allowedFields = [
      "systemName",
      "companyName",
      "supportEmail",
      "supportPhone",
      "timezone",
      "dateFormat",
      "notificationsEnabled",
      "maintenanceMode",
      "allowStoreLogin",
      "sessionTimeoutMinutes",
    ];

    for (const field of allowedFields) {
      if (
        req.body[field] !==
        undefined
      ) {
        settings[field] =
          req.body[field];
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Strings
    |--------------------------------------------------------------------------
    */

    settings.systemName =
      cleanString(
        settings.systemName
      );

    settings.companyName =
      cleanString(
        settings.companyName
      );

    settings.supportEmail =
      cleanString(
        settings.supportEmail
      ).toLowerCase();

    settings.supportPhone =
      cleanString(
        settings.supportPhone
      );

    settings.timezone =
      cleanString(
        settings.timezone
      );

    /*
    |--------------------------------------------------------------------------
    | Validate Email
    |--------------------------------------------------------------------------
    */

    if (
      settings.supportEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        settings.supportEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid support email.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Session Timeout
    |--------------------------------------------------------------------------
    */

    const timeout =
      Number(
        settings.sessionTimeoutMinutes
      );

    if (
      Number.isNaN(timeout) ||
      timeout < 5 ||
      timeout > 1440
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Session timeout must be between 5 and 1440 minutes.",
      });
    }

    settings.sessionTimeoutMinutes =
      timeout;

    /*
    |--------------------------------------------------------------------------
    | Backend-Owned Update Metadata
    |--------------------------------------------------------------------------
    */

    const updater =
      getUpdaterInfo(req);

    settings.updatedByUid =
      updater.updatedByUid;

    settings.updatedByName =
      updater.updatedByName;

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    await settings.save();

    return res.status(200).json({
      success: true,

      message:
        "Settings updated successfully.",

      settings:
        formatSettings(settings),
    });
  } catch (error) {
    console.error(
      "Update Settings Error:",
      error
    );

    if (
      error?.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to update settings.",
    });
  }
};