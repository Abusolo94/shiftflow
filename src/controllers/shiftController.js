



import mongoose from "mongoose";

import Shift from "../models/Shift.js";
import Store from "../models/Store.js";

// ======================================================
// HELPERS
// ======================================================

const getAccountType = (user) => {
  return (
    user?.accountType ||
    (
      user?.role === "Admin"
        ? "admin"
        : user?.role === "Store Account"
        ? "store"
        : ""
    )
  )
    .toString()
    .toLowerCase();
};

// ------------------------------------------------------
// GET USER STORE ID
// ------------------------------------------------------
//
// Handles all possible formats:
//
// req.user.storeId = ObjectId
// req.user.storeId = "ObjectId string"
// req.user.storeId = populated Store object
//
// If storeId is missing, we try storeNumber.
//

const resolveUserStoreId = async (
  user
) => {
  if (!user) {
    return null;
  }

  const possibleStoreId =
    user.storeId?._id ||
    user.storeId;

  if (
    possibleStoreId &&
    mongoose.Types.ObjectId.isValid(
      possibleStoreId
    )
  ) {
    return new mongoose.Types.ObjectId(
      possibleStoreId
    );
  }

  // ----------------------------------------------------
  // FALLBACK: STORE NUMBER
  // ----------------------------------------------------

  if (user.storeNumber) {
    const store =
      await Store.findOne({
        storeNumber:
          user.storeNumber
            .toString()
            .trim(),
      }).select("_id");

    if (store) {
      return store._id;
    }
  }

  return null;
};

// ======================================================
// CALCULATE CHECKLIST PROGRESS
// ======================================================

const calculateChecklistProgress = (
  checklist = []
) => {
  let totalTasks = 0;
  let completedTasks = 0;

  if (!Array.isArray(checklist)) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      score: 0,
    };
  }

  checklist.forEach(
    (group) => {
      if (
        !Array.isArray(
          group?.sections
        )
      ) {
        return;
      }

      group.sections.forEach(
        (section) => {
          if (
            !Array.isArray(
              section?.tasks
            )
          ) {
            return;
          }

          section.tasks.forEach(
            (task) => {
              totalTasks += 1;

              if (
                task?.completed === true
              ) {
                completedTasks += 1;
              }
            }
          );
        }
      );
    }
  );

  const score =
    totalTasks > 0
      ? Math.round(
          (completedTasks /
            totalTasks) *
            100
        )
      : 0;

  return {
    totalTasks,
    completedTasks,
    score,
  };
};

// ======================================================
// NORMALIZE SHIFT
// ======================================================
//
// Calculates completion from checklist instead of
// blindly trusting old score values.
//

const normalizeShift = (
  shift
) => {
  if (!shift) {
    return shift;
  }

  const data =
    typeof shift.toObject ===
    "function"
      ? shift.toObject()
      : { ...shift };

  const progress =
    calculateChecklistProgress(
      data.checklist
    );

  /*
   * If the shift actually has checklist
   * tasks, checklist is the source of truth.
   */
  if (
    progress.totalTasks > 0
  ) {
    data.totalTasks =
      progress.totalTasks;

    data.completedTasks =
      progress.completedTasks;

    data.score =
      progress.score;
  }

  return data;
};

// ======================================================
// GET ALL SHIFTS
// ======================================================

export const getShifts = async (
  req,
  res
) => {
  try {
    const {
      storeNumber,
      status,
    } = req.query;

    const accountType =
      getAccountType(
        req.user
      );

    const filter = {};

    // ==================================================
    // STORE ACCOUNT
    // ==================================================

    if (
      accountType === "store"
    ) {
      const userStoreId =
        await resolveUserStoreId(
          req.user
        );

      if (!userStoreId) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is not assigned to a valid store.",
        });
      }

      filter.storeId =
        userStoreId;
    }

    // ==================================================
    // ADMIN
    // ==================================================

    if (
      accountType === "admin" &&
      storeNumber
    ) {
      filter.storeNumber =
        storeNumber
          .toString()
          .trim();
    }

    // ==================================================
    // STATUS
    // ==================================================

    if (status) {
      filter.status =
        status;
    }

    const shifts =
      await Shift.find(filter)
        .sort({
          createdAt: -1,
        })
        .lean();

    const normalizedShifts =
      shifts.map(
        normalizeShift
      );

    return res.json({
      success: true,
      count:
        normalizedShifts.length,
      shifts:
        normalizedShifts,
    });
  } catch (error) {
    console.error(
      "Get shifts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch shifts.",
    });
  }
};

// ======================================================
// GET SINGLE SHIFT
// ======================================================

export const getSingleShift =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      // ------------------------------------------------
      // VALIDATE ID
      // ------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid shift ID.",
        });
      }

      // ------------------------------------------------
      // FIND SHIFT
      // ------------------------------------------------

      const shift =
        await Shift.findById(
          id
        ).lean();

      if (!shift) {
        return res.status(404).json({
          success: false,
          message:
            "Shift not found.",
        });
      }

      const accountType =
        getAccountType(
          req.user
        );

      // =================================================
      // STORE ACCOUNT SECURITY
      // =================================================

      if (
        accountType === "store"
      ) {
        const userStoreId =
          await resolveUserStoreId(
            req.user
          );

        if (!userStoreId) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not assigned to a valid store.",
          });
        }

        const shiftStoreId =
          shift.storeId?._id ||
          shift.storeId;

        if (!shiftStoreId) {
          return res.status(403).json({
            success: false,
            message:
              "This shift is not assigned to a store.",
          });
        }

        const userStoreIdString =
          userStoreId.toString();

        const shiftStoreIdString =
          shiftStoreId.toString();

        console.log(
          "========== SHIFT ACCESS =========="
        );

        console.log(
          "Account type:",
          accountType
        );

        console.log(
          "User store ID:",
          userStoreIdString
        );

        console.log(
          "Shift store ID:",
          shiftStoreIdString
        );

        console.log(
          "Same store:",
          userStoreIdString ===
            shiftStoreIdString
        );

        console.log(
          "==================================="
        );

        if (
          userStoreIdString !==
          shiftStoreIdString
        ) {
          return res.status(403).json({
            success: false,
            message:
              "You are not authorized to access this shift.",
          });
        }
      }

      // =================================================
      // NORMALIZE
      // =================================================

      const normalizedShift =
        normalizeShift(
          shift
        );

      return res.json({
        success: true,
        shift:
          normalizedShift,
      });
    } catch (error) {
      console.error(
        "Get single shift error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch shift.",
      });
    }
  };

// ======================================================
// CREATE SHIFT
// ======================================================

export const createShift =
  async (req, res) => {
    try {
      const {
        title,
        shiftDate,
        startTime,
        endTime,
        shiftType,
        managerName,
        managerUid,
        notes,
        issues,
        handover,
        checklist,
        tasks,
      } = req.body;

      // =================================================
      // VALIDATION
      // =================================================

      if (!shiftDate) {
        return res.status(400).json({
          success: false,
          message:
            "Shift date is required.",
        });
      }

      if (!startTime) {
        return res.status(400).json({
          success: false,
          message:
            "Start time is required.",
        });
      }

      if (!endTime) {
        return res.status(400).json({
          success: false,
          message:
            "End time is required.",
        });
      }

      // =================================================
      // DETERMINE STORE
      // =================================================

      let store = null;

      const accountType =
        getAccountType(
          req.user
        );

      // -------------------------------------------------
      // STORE ACCOUNT
      // -------------------------------------------------

      if (
        accountType === "store"
      ) {
        const userStoreId =
          await resolveUserStoreId(
            req.user
          );

        if (!userStoreId) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not assigned to a valid store.",
          });
        }

        store =
          await Store.findById(
            userStoreId
          );
      }

      // -------------------------------------------------
      // ADMIN
      // -------------------------------------------------

      if (
        accountType === "admin"
      ) {
        const {
          storeId,
          storeNumber,
        } = req.body;

        if (storeId) {
          if (
            !mongoose.Types.ObjectId.isValid(
              storeId
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid store ID.",
            });
          }

          store =
            await Store.findById(
              storeId
            );
        } else if (
          storeNumber
        ) {
          store =
            await Store.findOne({
              storeNumber:
                storeNumber
                  .toString()
                  .trim(),
            });
        }
      }

      // =================================================
      // STORE VALIDATION
      // =================================================

      if (!store) {
        return res.status(400).json({
          success: false,
          message:
            "A valid store is required to create a shift.",
        });
      }

      // =================================================
      // CHECKLIST
      // =================================================

      const safeChecklist =
        Array.isArray(
          checklist
        )
          ? checklist
          : [];

      const progress =
        calculateChecklistProgress(
          safeChecklist
        );

      // =================================================
      // CREATE
      // =================================================

      const shift =
        await Shift.create({
          storeId:
            store._id,

          storeNumber:
            store.storeNumber,

          storeName:
            store.storeName,

          title:
            title?.trim() ||
            `${shiftType?.trim() || "Regular"} Shift`,

          shiftDate:
            new Date(
              shiftDate
            ),

          startTime:
            startTime.trim(),

          endTime:
            endTime.trim(),

          shiftType:
            shiftType?.trim() ||
            "Regular",

          managerName:
            managerName?.trim() ||
            "",

          managerUid:
            managerUid?.trim() ||
            "",

          notes:
            notes?.trim() ||
            "",

          issues:
            typeof issues ===
            "string"
              ? issues.trim()
              : "",

          handover:
            handover?.trim() ||
            "",

          checklist:
            safeChecklist,

          tasks:
            tasks || {},

          completedTasks:
            progress.completedTasks,

          totalTasks:
            progress.totalTasks,

          score:
            progress.score,

          status:
            "Pending",

          createdByUid:
            req.firebaseUser.uid,

          createdByName:
            req.firebaseUser.name ||
            req.user.displayName ||
            "",

          createdByEmail:
            req.firebaseUser.email ||
            req.user.email ||
            "",
        });

      return res.status(201).json({
        success: true,
        message:
          "Shift created successfully.",
        shift:
          normalizeShift(
            shift
          ),
      });
    } catch (error) {
      console.error(
        "Create shift error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create shift.",
      });
    }
  };

// ======================================================
// UPDATE SHIFT
// ======================================================

export const updateShift =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid shift ID.",
        });
      }

      const shift =
        await Shift.findById(
          id
        );

      if (!shift) {
        return res.status(404).json({
          success: false,
          message:
            "Shift not found.",
        });
      }

      const accountType =
        getAccountType(
          req.user
        );

      // =================================================
      // STORE SECURITY
      // =================================================

      if (
        accountType === "store"
      ) {
        const userStoreId =
          await resolveUserStoreId(
            req.user
          );

        const shiftStoreId =
          shift.storeId?._id ||
          shift.storeId;

        if (
          !userStoreId ||
          !shiftStoreId ||
          userStoreId.toString() !==
            shiftStoreId.toString()
        ) {
          return res.status(403).json({
            success: false,
            message:
              "You are not authorized to update this shift.",
          });
        }
      }

      // =================================================
      // SAFE FIELDS
      // =================================================

      const allowedFields = [
        "title",
        "shiftDate",
        "startTime",
        "endTime",
        "shiftType",
        "managerName",
        "managerUid",
        "notes",
        "issues",
        "handover",
        "checklist",
        "tasks",
        "managerComment",
        "verified",
      ];

      allowedFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            shift[field] =
              req.body[field];
          }
        }
      );

      // =================================================
      // CHECKLIST PROGRESS
      // =================================================

      if (
        req.body.checklist !==
        undefined
      ) {
        const progress =
          calculateChecklistProgress(
            shift.checklist
          );

        shift.totalTasks =
          progress.totalTasks;

        shift.completedTasks =
          progress.completedTasks;

        shift.score =
          progress.score;
      }

      // =================================================
      // STATUS
      // =================================================

      if (
        req.body.status !==
        undefined
      ) {
        shift.status =
          req.body.status;
      }

      // =================================================
      // APPROVED
      // =================================================

      if (
        req.body.status ===
        "Approved"
      ) {
        shift.approvedByUid =
          req.firebaseUser.uid;

        shift.approvedByName =
          req.firebaseUser.name ||
          req.user.displayName ||
          "";

        shift.approvedAt =
          new Date();
      }

      // =================================================
      // COMPLETED
      // =================================================

      if (
        req.body.status ===
        "Completed"
      ) {
        shift.completedAt =
          new Date();
      }

      await shift.save();

      return res.json({
        success: true,
        message:
          "Shift updated successfully.",
        shift:
          normalizeShift(
            shift
          ),
      });
    } catch (error) {
      console.error(
        "Update shift error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update shift.",
      });
    }
  };

// ======================================================
// DELETE SHIFT
// ======================================================

export const deleteShift =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid shift ID.",
        });
      }

      const shift =
        await Shift.findById(
          id
        );

      if (!shift) {
        return res.status(404).json({
          success: false,
          message:
            "Shift not found.",
        });
      }

      const accountType =
        getAccountType(
          req.user
        );

      // =================================================
      // STORE SECURITY
      // =================================================

      if (
        accountType === "store"
      ) {
        const userStoreId =
          await resolveUserStoreId(
            req.user
          );

        const shiftStoreId =
          shift.storeId?._id ||
          shift.storeId;

        if (
          !userStoreId ||
          !shiftStoreId ||
          userStoreId.toString() !==
            shiftStoreId.toString()
        ) {
          return res.status(403).json({
            success: false,
            message:
              "You are not authorized to delete this shift.",
          });
        }
      }

      await Shift.findByIdAndDelete(
        id
      );

      return res.json({
        success: true,
        message:
          "Shift deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete shift error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete shift.",
      });
    }
  };