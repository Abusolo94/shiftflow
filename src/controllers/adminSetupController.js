import mongoose from "mongoose";

import User from "../models/User.js";

import {
  firebaseAuth,
} from "../config/firebaseAdmin.js";

/*
|--------------------------------------------------------------------------
| Administrator Permissions
|--------------------------------------------------------------------------
*/

const ALL_ADMIN_PERMISSIONS = [
  "stores.read",
  "stores.manage",

  "shifts.read",
  "shifts.manage",

  "issues.read",
  "issues.manage",

  "foodSafety.read",
  "foodSafety.review",

  "maintenance.read",
  "maintenance.review",

  "cashTurnover.read",
  "cashTurnover.review",

  "cashAudit.read",
  "cashAudit.review",

  "reports.read",
  "analytics.read",

  "accounts.manage",
  "settings.manage",
  "auditLogs.read",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const cleanString = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const normalizeEmail = (value) =>
  cleanString(value).toLowerCase();

/*
|--------------------------------------------------------------------------
| Setup Enabled
|--------------------------------------------------------------------------
*/

const isSetupEnabled = () => {
  return (
    String(
      process.env
        .ALLOW_INITIAL_ADMIN_SETUP ||
        ""
    )
      .trim()
      .toLowerCase() === "true"
  );
};

/*
|--------------------------------------------------------------------------
| Find Existing Administrator
|--------------------------------------------------------------------------
*/

const findExistingAdmin = async () => {
  return User.findOne({
    $or: [
      {
        accountType: {
          $regex: /^admin$/i,
        },
      },
      {
        role: {
          $regex: /^admin$/i,
        },
      },
    ],
  })
    .select(
      "_id firebaseUid email role accountType roleLevel status"
    )
    .lean();
};

/*
|--------------------------------------------------------------------------
| Firebase User Lookup
|--------------------------------------------------------------------------
|
| Returns Firebase user if found.
| Returns null when email does not exist.
|
*/

const getFirebaseUserByEmail =
  async (email) => {
    try {
      return await firebaseAuth
        .getUserByEmail(email);
    } catch (error) {
      if (
        error?.code ===
        "auth/user-not-found"
      ) {
        return null;
      }

      throw error;
    }
  };

/*
|--------------------------------------------------------------------------
| Delete Firebase User Safely
|--------------------------------------------------------------------------
*/

const deleteFirebaseUserSafely =
  async (firebaseUid) => {
    if (!firebaseUid) {
      return;
    }

    try {
      await firebaseAuth
        .deleteUser(firebaseUid);
    } catch (error) {
      if (
        error?.code ===
        "auth/user-not-found"
      ) {
        return;
      }

      console.error(
        "Firebase rollback delete failed:",
        error
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET /api/admin-setup/status
|--------------------------------------------------------------------------
|
| Public endpoint.
|
| Used by:
| - Login page
| - Register page
| - SetupAdmin page
|
*/

export const getAdminSetupStatus =
  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Environment Check
      |--------------------------------------------------------------------------
      */

      if (!isSetupEnabled()) {
        return res
          .status(200)
          .json({
            success: true,

            setupRequired: false,

            setupEnabled: false,

            message:
              "Initial administrator setup is disabled.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Check Existing Admin
      |--------------------------------------------------------------------------
      */

      const existingAdmin =
        await findExistingAdmin();

      if (existingAdmin) {
        return res
          .status(200)
          .json({
            success: true,

            setupRequired: false,

            setupEnabled: true,

            message:
              "Administrator setup has already been completed.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Setup Required
      |--------------------------------------------------------------------------
      */

      return res
        .status(200)
        .json({
          success: true,

          setupRequired: true,

          setupEnabled: true,

          message:
            "Initial administrator setup is required.",
        });
    } catch (error) {
      console.error(
        "Get admin setup status error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          setupRequired: false,

          setupEnabled:
            isSetupEnabled(),

          message:
            "Unable to check administrator setup status.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| POST /api/admin-setup
|--------------------------------------------------------------------------
|
| Creates the FIRST Super Admin only.
|
| PUBLIC endpoint intentionally.
|
| Security:
| - Environment flag must be enabled
| - No existing admin can exist
| - Atomic MongoDB lock prevents two simultaneous bootstrap requests
| - Backend forces role / permissions / status
|
*/

export const createInitialAdmin =
  async (req, res) => {
    let firebaseUid = null;

    let lockAcquired = false;

    const lockCollection =
      mongoose.connection
        .collection(
          "system_bootstrap_locks"
        );

    try {
      /*
      |--------------------------------------------------------------------------
      | Setup Must Be Enabled
      |--------------------------------------------------------------------------
      */

      if (!isSetupEnabled()) {
        return res
          .status(403)
          .json({
            success: false,

            message:
              "Initial administrator setup is disabled.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Read Input
      |--------------------------------------------------------------------------
      */

      const displayName =
        cleanString(
          req.body?.displayName
        );

      const email =
        normalizeEmail(
          req.body?.email
        );

      const password =
        String(
          req.body?.password ||
            ""
        );

      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

      if (!displayName) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Administrator name is required.",
          });
      }

      if (!email) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Administrator email is required.",
          });
      }

      if (!email.includes("@")) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Enter a valid administrator email address.",
          });
      }

      if (!password) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Administrator password is required.",
          });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Administrator password must contain at least 8 characters.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Check Existing Admin Before Lock
      |--------------------------------------------------------------------------
      */

      const existingAdmin =
        await findExistingAdmin();

      if (existingAdmin) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Administrator setup has already been completed.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Acquire Atomic Bootstrap Lock
      |--------------------------------------------------------------------------
      |
      | MongoDB _id is unique.
      |
      | If two requests arrive at the same time,
      | only one can create this document.
      |
      */

      try {
        await lockCollection
          .insertOne({
            _id: "initial-admin",

            createdAt:
              new Date(),
          });

        lockAcquired = true;
      } catch (lockError) {
        if (
          lockError?.code ===
          11000
        ) {
          return res
            .status(409)
            .json({
              success: false,

              message:
                "Initial administrator setup is already in progress or has already been completed.",
            });
        }

        throw lockError;
      }

      /*
      |--------------------------------------------------------------------------
      | Re-check After Lock
      |--------------------------------------------------------------------------
      |
      | Important because another request might have completed
      | between our first check and acquiring the lock.
      |
      */

      const existingAdminAfterLock =
        await findExistingAdmin();

      if (
        existingAdminAfterLock
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "Administrator setup has already been completed.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Check MongoDB Email
      |--------------------------------------------------------------------------
      */

      const existingMongoUser =
        await User.findOne({
          email,
        })
          .select(
            "_id email"
          )
          .lean();

      if (existingMongoUser) {
        const error =
          new Error(
            "An account already exists with this email address."
          );

        error.statusCode =
          409;

        throw error;
      }

      /*
      |--------------------------------------------------------------------------
      | Check Firebase Email
      |--------------------------------------------------------------------------
      */

      const existingFirebaseUser =
        await getFirebaseUserByEmail(
          email
        );

      if (
        existingFirebaseUser
      ) {
        const error =
          new Error(
            "A Firebase Authentication account already exists with this email address."
          );

        error.statusCode =
          409;

        throw error;
      }

      /*
      |--------------------------------------------------------------------------
      | Create Firebase Authentication User
      |--------------------------------------------------------------------------
      */

      const firebaseUser =
        await firebaseAuth
          .createUser({
            displayName,

            email,

            password,

            disabled: false,

            emailVerified: false,
          });

      firebaseUid =
        firebaseUser.uid;

      /*
      |--------------------------------------------------------------------------
      | Create MongoDB Administrator Account
      |--------------------------------------------------------------------------
      |
      | Do NOT trust role or permission fields from frontend.
      |
      | First admin is always:
      |
      | role         = Admin
      | accountType  = admin
      | roleLevel    = Super Admin
      |
      */

      const admin =
        await User.create({
          firebaseUid,

          displayName,

          email,

          role: "Admin",

          accountType:
            "admin",

          roleLevel:
            "Super Admin",

          permissions:
            ALL_ADMIN_PERMISSIONS,

          status:
            "Active",

          /*
          |--------------------------------------------------------------------------
          | Admin Does Not Belong To A Store
          |--------------------------------------------------------------------------
          */

          storeId: null,

          /*
          |--------------------------------------------------------------------------
          | Creator Metadata
          |--------------------------------------------------------------------------
          */

          createdByUid:
            firebaseUid,

          createdByName:
            "Initial System Setup",

          lastLogin: null,
        });

      /*
      |--------------------------------------------------------------------------
      | Keep Bootstrap Lock
      |--------------------------------------------------------------------------
      |
      | We intentionally DO NOT remove the lock on successful creation.
      |
      | It acts as an additional signal that bootstrap has completed.
      |
      */

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Initial Super Admin account created successfully.",

          admin: {
            id:
              String(
                admin._id
              ),

            firebaseUid:
              admin.firebaseUid,

            displayName:
              admin.displayName,

            email:
              admin.email,

            role:
              admin.role,

            accountType:
              admin.accountType,

            roleLevel:
              admin.roleLevel,

            status:
              admin.status,

            permissions:
              admin.permissions,
          },
        });
    } catch (error) {
      console.error(
        "Create initial admin error:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | Firebase Rollback
      |--------------------------------------------------------------------------
      |
      | If Firebase user was created but MongoDB failed,
      | delete the Firebase account.
      |
      */

      if (firebaseUid) {
        await deleteFirebaseUserSafely(
          firebaseUid
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Release Bootstrap Lock On Failure
      |--------------------------------------------------------------------------
      |
      | Allows setup to be retried.
      |
      */

      if (lockAcquired) {
        try {
          await lockCollection
            .deleteOne({
              _id:
                "initial-admin",
            });
        } catch (
          lockDeleteError
        ) {
          console.error(
            "Failed to release bootstrap lock:",
            lockDeleteError
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Custom Status
      |--------------------------------------------------------------------------
      */

      if (
        error?.statusCode
      ) {
        return res
          .status(
            error.statusCode
          )
          .json({
            success: false,

            message:
              error.message,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | MongoDB Duplicate
      |--------------------------------------------------------------------------
      */

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "An account with these details already exists.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Firebase Email Already Exists
      |--------------------------------------------------------------------------
      */

      if (
        error?.code ===
        "auth/email-already-exists"
      ) {
        return res
          .status(409)
          .json({
            success: false,

            message:
              "A Firebase Authentication account already exists with this email address.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Firebase Invalid Email
      |--------------------------------------------------------------------------
      */

      if (
        error?.code ===
        "auth/invalid-email"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Enter a valid administrator email address.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Firebase Invalid Password
      |--------------------------------------------------------------------------
      */

      if (
        error?.code ===
          "auth/invalid-password" ||
        error?.code ===
          "auth/password-does-not-meet-requirements"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Administrator password does not meet Firebase password requirements.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Firebase Internal Error
      |--------------------------------------------------------------------------
      */

      if (
        String(
          error?.code || ""
        ).startsWith(
          "auth/"
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              error?.message ||
              "Unable to create Firebase administrator account.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Unknown Server Error
      |--------------------------------------------------------------------------
      */

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to create the initial administrator account.",
        });
    }
  };