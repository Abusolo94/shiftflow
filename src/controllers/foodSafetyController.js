import mongoose from "mongoose";


import Store from "../models/Store.js";
import FoodSafety from "../models/FoodSafety.js";

// ======================================================
// HELPERS
// ======================================================

const getAccountType = (user) => {
  if (!user) {
    return null;
  }

  if (user.accountType) {
    return String(
      user.accountType
    ).toLowerCase();
  }

  if (
    String(user.role).toLowerCase() ===
    "admin"
  ) {
    return "admin";
  }

  return "store";
};

// ======================================================
// GET USER STORE ID
// ======================================================

const getUserStoreId = (user) => {
  if (!user?.storeId) {
    return null;
  }

  return (
    user.storeId?._id ||
    user.storeId
  );
};

// ======================================================
// GET STORE SCOPE
// ======================================================

const getStoreScope = (user) => {
  const accountType =
    getAccountType(user);

  // Admin can access all stores
  if (
    accountType === "admin"
  ) {
    return {};
  }

  const storeId =
    getUserStoreId(user);

  if (!storeId) {
    return null;
  }

  return {
    storeId,
  };
};

// ======================================================
// NORMALIZE FOOD SAFETY
// ======================================================

const normalizeFoodSafety = (
  report
) => {
  if (!report) {
    return null;
  }

  const data =
    report.toObject
      ? report.toObject()
      : report;

  return {
    ...data,

    id: String(
      data._id
    ),

    _id: String(
      data._id
    ),

    storeId:
      data.storeId
        ? String(
            data.storeId?._id ||
              data.storeId
          )
        : null,
  };
};

// ======================================================
// CALCULATE CHECKLIST RESULTS
// ======================================================

const calculateResults = (
  checklist = []
) => {
  const safeChecklist =
    Array.isArray(
      checklist
    )
      ? checklist
      : [];

  const total =
    safeChecklist.length;

  const passed =
    safeChecklist.filter(
      (item) =>
        item?.result ===
          "yes" ||
        item?.passed === true
    ).length;

  const failed =
    safeChecklist.filter(
      (item) =>
        item?.result ===
          "no" ||
        item?.passed === false
    ).length;

  const unchecked =
    total -
    passed -
    failed;

  const score =
    total > 0
      ? Math.round(
          (passed /
            total) *
            100
        )
      : 0;

  return {
    passed,
    failed,
    unchecked,
    total,
    score,
  };
};

// ======================================================
// GET STORE
// ======================================================

const resolveStore = async (
  user,
  requestedStoreId
) => {
  const accountType =
    getAccountType(user);

  // ----------------------------------------------------
  // ADMIN
  // ----------------------------------------------------

  if (
    accountType === "admin"
  ) {
    if (
      !requestedStoreId
    ) {
      throw new Error(
        "Store ID is required for an admin account."
      );
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        requestedStoreId
      )
    ) {
      throw new Error(
        "Invalid store ID."
      );
    }

    const store =
      await Store.findById(
        requestedStoreId
      );

    if (!store) {
      throw new Error(
        "Store not found."
      );
    }

    return store;
  }

  // ----------------------------------------------------
  // STORE ACCOUNT
  // ----------------------------------------------------

  const storeId =
    getUserStoreId(user);

  if (!storeId) {
    throw new Error(
      "Your account is not assigned to a store."
    );
  }

  const store =
    await Store.findById(
      storeId
    );

  if (!store) {
    throw new Error(
      "Your assigned store could not be found."
    );
  }

  return store;
};

// ======================================================
// CREATE FOOD SAFETY REPORT
// ======================================================

export const createFoodSafety =
  async (
    req,
    res
  ) => {
    try {
      const user =
        req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authenticated user not found.",
          });
      }

      const {
        businessDate,
        shift,
        checklist,
        findings,
        opportunities,
        actionTaken,
      } = req.body;

      // --------------------------------------------------
      // VALIDATE DATE
      // --------------------------------------------------

      if (
        !businessDate
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Business date is required.",
          });
      }

      const parsedDate =
        new Date(
          businessDate
        );

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid business date.",
          });
      }

      // --------------------------------------------------
      // VALIDATE SHIFT
      // --------------------------------------------------

      const allowedShifts = [
        "Opening",
        "Mid",
        "Closing",
      ];

      if (
        !allowedShifts.includes(
          shift
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid shift. Use Opening, Mid, or Closing.",
          });
      }

      // --------------------------------------------------
      // VALIDATE CHECKLIST
      // --------------------------------------------------

      if (
        !Array.isArray(
          checklist
        ) ||
        checklist.length ===
          0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Food safety checklist is required.",
          });
      }

      // --------------------------------------------------
      // RESOLVE STORE
      // --------------------------------------------------

      let store;

      try {
        store =
          await resolveStore(
            user,
            req.body.storeId
          );
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              error.message,
          });
      }

      // --------------------------------------------------
      // CALCULATE RESULTS
      // --------------------------------------------------

      const results =
        calculateResults(
          checklist
        );

      // --------------------------------------------------
      // CREATE REPORT
      // --------------------------------------------------

      const report =
        await FoodSafety.create(
          {
            storeId:
              store._id,

            storeNumber:
              store.storeNumber,

            storeName:
              store.storeName,

            businessDate:
              parsedDate,

            shift,

            managerName:
              user.displayName ||
              user.name ||
              user.email ||
              "Unknown",

            checklist,

            findings:
              findings?.trim() ||
              "",

            opportunities:
              opportunities?.trim() ||
              "",

            actionTaken:
              actionTaken?.trim() ||
              "",

            passed:
              results.passed,

            failed:
              results.failed,

            unchecked:
              results.unchecked,

            total:
              results.total,

            score:
              results.score,

            status:
              results.failed > 0
                ? "Pending"
                : "Completed",

            createdByUid:
              user.firebaseUid,

            createdByName:
              user.displayName ||
              user.name ||
              user.email ||
              "Unknown",

            createdByEmail:
              user.email ||
              "",

            submittedAt:
              new Date(),
          }
        );

      // --------------------------------------------------
      // POPULATE STORE
      // --------------------------------------------------

      await report.populate(
        "storeId"
      );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Food Safety report created successfully.",

          foodSafety:
            normalizeFoodSafety(
              report
            ),
        });
    } catch (error) {
      console.error(
        "Create Food Safety:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to create Food Safety report.",
          error:
            error.message,
        });
    }
  };

// ======================================================
// GET ALL FOOD SAFETY REPORTS
// ======================================================

export const getFoodSafeties =
  async (
    req,
    res
  ) => {
    try {
      const user =
        req.user;

      if (!user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authenticated user not found.",
          });
      }

      const scope =
        getStoreScope(
          user
        );

      if (
        scope === null
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
      }

      const {
        status,
        shift,
        storeNumber,
        businessDate,
        createdByUid,
      } = req.query;

      const filter = {
        ...scope,
      };

      // --------------------------------------------------
      // ADMIN STORE FILTER
      // --------------------------------------------------

      if (
        storeNumber &&
        getAccountType(
          user
        ) === "admin"
      ) {
        filter.storeNumber =
          String(
            storeNumber
          ).trim();
      }

      // --------------------------------------------------
      // STATUS FILTER
      // --------------------------------------------------

      if (status) {
        filter.status =
          String(
            status
          ).trim();
      }

      // --------------------------------------------------
      // SHIFT FILTER
      // --------------------------------------------------

      if (shift) {
        filter.shift =
          String(
            shift
          ).trim();
      }

      // --------------------------------------------------
      // CREATOR FILTER
      // --------------------------------------------------

      if (createdByUid) {
        filter.createdByUid =
          String(
            createdByUid
          ).trim();
      }

      // --------------------------------------------------
      // BUSINESS DATE
      // --------------------------------------------------

      if (businessDate) {
        const date =
          new Date(
            businessDate
          );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          const start =
            new Date(date);

          start.setHours(
            0,
            0,
            0,
            0
          );

          const end =
            new Date(date);

          end.setHours(
            23,
            59,
            59,
            999
          );

          filter.businessDate =
            {
              $gte: start,
              $lte: end,
            };
        }
      }

      // --------------------------------------------------
      // QUERY
      // --------------------------------------------------

      const reports =
        await FoodSafety.find(
          filter
        )
          .populate(
            "storeId"
          )
          .sort({
            businessDate:
              -1,
            createdAt:
              -1,
          });

      return res
        .status(200)
        .json({
          success: true,

          count:
            reports.length,

          foodSafeties:
            reports.map(
              normalizeFoodSafety
            ),
        });
    } catch (error) {
      console.error(
        "Get Food Safety Reports:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load Food Safety reports.",
          error:
            error.message,
        });
    }
  };

// ======================================================
// GET SINGLE FOOD SAFETY REPORT
// ======================================================

export const getSingleFoodSafety =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid Food Safety report ID.",
          });
      }

      const user =
        req.user;

      const scope =
        getStoreScope(
          user
        );

      if (
        scope === null
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
      }

      const filter = {
        _id: id,
        ...scope,
      };

      const report =
        await FoodSafety.findOne(
          filter
        ).populate(
          "storeId"
        );

      if (!report) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Food Safety report not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          foodSafety:
            normalizeFoodSafety(
              report
            ),
        });
    } catch (error) {
      console.error(
        "Get Single Food Safety:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to load Food Safety report.",
          error:
            error.message,
        });
    }
  };

// ======================================================
// UPDATE FOOD SAFETY REPORT
// ======================================================

export const updateFoodSafety =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid Food Safety report ID.",
          });
      }

      const user =
        req.user;

      const scope =
        getStoreScope(
          user
        );

      if (
        scope === null
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
      }

      const report =
        await FoodSafety.findOne(
          {
            _id: id,
            ...scope,
          }
        );

      if (!report) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Food Safety report not found.",
          });
      }

      const {
        businessDate,
        shift,
        checklist,
        findings,
        opportunities,
        actionTaken,
        status,
      } = req.body;

      // --------------------------------------------------
      // DATE
      // --------------------------------------------------

      if (
        businessDate !==
        undefined
      ) {
        const date =
          new Date(
            businessDate
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid business date.",
            });
        }

        report.businessDate =
          date;
      }

      // --------------------------------------------------
      // SHIFT
      // --------------------------------------------------

      if (
        shift !==
        undefined
      ) {
        const allowedShifts = [
          "Opening",
          "Mid",
          "Closing",
        ];

        if (
          !allowedShifts.includes(
            shift
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid shift.",
            });
        }

        report.shift =
          shift;
      }

      // --------------------------------------------------
      // CHECKLIST
      // --------------------------------------------------

      if (
        checklist !==
        undefined
      ) {
        if (
          !Array.isArray(
            checklist
          ) ||
          checklist.length ===
            0
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Checklist cannot be empty.",
            });
        }

        report.checklist =
          checklist;

        const results =
          calculateResults(
            checklist
          );

        report.passed =
          results.passed;

        report.failed =
          results.failed;

        report.unchecked =
          results.unchecked;

        report.total =
          results.total;

        report.score =
          results.score;
      }

      // --------------------------------------------------
      // TEXT FIELDS
      // --------------------------------------------------

      if (
        findings !==
        undefined
      ) {
        report.findings =
          String(
            findings
          ).trim();
      }

      if (
        opportunities !==
        undefined
      ) {
        report.opportunities =
          String(
            opportunities
          ).trim();
      }

      if (
        actionTaken !==
        undefined
      ) {
        report.actionTaken =
          String(
            actionTaken
          ).trim();
      }

      // --------------------------------------------------
      // STATUS
      // --------------------------------------------------

      if (
        status !==
        undefined
      ) {
        const allowedStatuses = [
          "Pending",
          "Completed",
          "Failed",
          "Reviewed",
        ];

        if (
          !allowedStatuses.includes(
            status
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid Food Safety status.",
            });
        }

        report.status =
          status;
      }

      // --------------------------------------------------
      // SAVE
      // --------------------------------------------------

      await report.save();

      await report.populate(
        "storeId"
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Food Safety report updated successfully.",

          foodSafety:
            normalizeFoodSafety(
              report
            ),
        });
    } catch (error) {
      console.error(
        "Update Food Safety:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update Food Safety report.",
          error:
            error.message,
        });
    }
  };

// ======================================================
// DELETE FOOD SAFETY REPORT
// ======================================================

export const deleteFoodSafety =
  async (
    req,
    res
  ) => {
    try {
      const {
        id,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid Food Safety report ID.",
          });
      }

      const user =
        req.user;

      const scope =
        getStoreScope(
          user
        );

      if (
        scope === null
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
      }

      const report =
        await FoodSafety.findOne(
          {
            _id: id,
            ...scope,
          }
        );

      if (!report) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Food Safety report not found.",
          });
      }

      await report.deleteOne();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Food Safety report deleted successfully.",
        });
    } catch (error) {
      console.error(
        "Delete Food Safety:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to delete Food Safety report.",
          error:
            error.message,
        });
    }
  };