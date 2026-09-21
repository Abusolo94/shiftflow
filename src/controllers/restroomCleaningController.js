import mongoose from "mongoose";
import RestroomCleaning from "../models/RestroomCleaning.js";
import Store from "../models/Store.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getObjectIdString = (value) => {
  if (!value) return null;

  if (value?._id) {
    return String(value._id);
  }

  return String(value);
};

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

/*
|--------------------------------------------------------------------------
| Store Authorization
|--------------------------------------------------------------------------
|
| Admin:
|   - Can access all stores.
|
| Store Account:
|   - Can only access records belonging to req.user.storeId.
|
*/

const checkStoreAccess = (req, record) => {
  /*
   * Admin has access to all restroom records.
   */
  if (req.user?.accountType === "admin") {
    return {
      allowed: true,
      storeId: getObjectIdString(
        record?.storeId
      ),
    };
  }

  /*
   * Only store accounts are allowed beyond this point.
   */
  if (req.user?.accountType !== "store") {
    return {
      allowed: false,
      reason: "Invalid account type.",
    };
  }

  const userStoreId = getObjectIdString(
    req.user?.storeId
  );

  if (!userStoreId) {
    return {
      allowed: false,
      reason:
        "Your account is not assigned to a store.",
    };
  }

  const recordStoreId = getObjectIdString(
    record?.storeId
  );

  if (!recordStoreId) {
    return {
      allowed: false,
      reason:
        "This restroom cleaning record is not assigned to a store.",
    };
  }

  if (userStoreId !== recordStoreId) {
    console.warn(
      "Restroom cleaning authorization mismatch",
      {
        userUid: req.user?.firebaseUid,
        accountType:
          req.user?.accountType,
        userStoreId,
        recordStoreId,
      }
    );

    return {
      allowed: false,
      reason:
        "You are not authorized to access this restroom cleaning record.",
    };
  }

  return {
    allowed: true,
    storeId: recordStoreId,
  };
};

/*
|--------------------------------------------------------------------------
| Calculate Inspection Statistics
|--------------------------------------------------------------------------
|
| Never trust totals sent by the frontend.
| Calculate them again on the server.
|
*/

const calculateStatistics = (
  inspections = []
) => {
  const safeInspections =
    Array.isArray(inspections)
      ? inspections
      : [];

  const totalInspections =
    safeInspections.length;

  const completedInspections =
    safeInspections.filter(
      (inspection) =>
        inspection?.completed === true
    ).length;

  const inspectionsWithInitials =
    safeInspections.filter(
      (inspection) =>
        typeof inspection?.initials ===
          "string" &&
        inspection.initials.trim()
    ).length;

  let completedTasks = 0;

  safeInspections.forEach(
    (inspection) => {
      if (!inspection?.tasks) return;

      completedTasks += Object.values(
        inspection.tasks
      ).filter(Boolean).length;
    }
  );

  /*
   * The frontend currently has 11 cleaning tasks
   * for every inspection.
   *
   * We calculate the possible task count based
   * on the actual tasks stored in each inspection.
   */
  let totalPossibleTasks = 0;

  safeInspections.forEach(
    (inspection) => {
      if (!inspection?.tasks) return;

      totalPossibleTasks += Object.keys(
        inspection.tasks
      ).length;
    }
  );

  /*
   * If no task object was supplied, don't
   * manufacture a task count.
   */
  const inspectionCompletion =
    totalInspections > 0
      ? Math.round(
          (completedInspections /
            totalInspections) *
            100
        )
      : 0;

  const taskCompletion =
    totalPossibleTasks > 0
      ? Math.round(
          (completedTasks /
            totalPossibleTasks) *
            100
        )
      : 0;

  return {
    totalInspections,
    completedInspections,
    inspectionsWithInitials,
    completedTasks,
    totalPossibleTasks,
    inspectionCompletion,
    taskCompletion,
  };
};

/*
|--------------------------------------------------------------------------
| Normalize Response
|--------------------------------------------------------------------------
*/

const formatRecord = (record) => {
  if (!record) return null;

  const data =
    typeof record.toObject === "function"
      ? record.toObject()
      : record;

  return {
    ...data,

    id: String(data._id),

    _id: String(data._id),

    storeId: data.storeId
      ? getObjectIdString(data.storeId)
      : null,

    createdAt: data.createdAt
      ? new Date(data.createdAt)
      : null,

    updatedAt: data.updatedAt
      ? new Date(data.updatedAt)
      : null,

    submittedAt: data.submittedAt
      ? new Date(data.submittedAt)
      : null,
  };
};

/*
|--------------------------------------------------------------------------
| GET ALL RECORDS
|--------------------------------------------------------------------------
|
| GET /api/restroom-cleaning
|
| Store account:
|   Automatically receives only its own records.
|
| Admin:
|   Can see all records.
|
| Optional filters:
|   ?storeId=
|   ?storeNumber=
|   ?businessDate=
|   ?status=
|   ?supervisorName=
|   ?page=
|   ?limit=
|
*/

export const getRestroomCleaningRecords =
  async (req, res) => {
    try {
      const {
        storeId,
        storeNumber,
        businessDate,
        status,
        supervisorName,
        page = 1,
        limit = 50,
      } = req.query;

      const query = {};

      /*
       * Store accounts are ALWAYS restricted
       * to their own store.
       */
      if (
        req.user?.accountType ===
        "store"
      ) {
        const userStoreId =
          getObjectIdString(
            req.user.storeId
          );

        if (!userStoreId) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
        }

        query.storeId =
          userStoreId;
      }

      /*
       * Admin can filter by store.
       */
      if (
        req.user?.accountType ===
          "admin" &&
        storeId
      ) {
        if (!isValidObjectId(storeId)) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid store ID.",
          });
        }

        query.storeId = storeId;
      }

      if (storeNumber) {
        query.storeNumber = {
          $regex: storeNumber,
          $options: "i",
        };
      }

      if (status) {
        query.status = status;
      }

      if (supervisorName) {
        query.supervisorName = {
          $regex: supervisorName,
          $options: "i",
        };
      }

      /*
       * Business date.
       *
       * Supports:
       * 2026-09-06
       */
      if (businessDate) {
        const start = new Date(
          `${businessDate}T00:00:00.000Z`
        );

        const end = new Date(
          `${businessDate}T23:59:59.999Z`
        );

        if (
          Number.isNaN(start.getTime()) ||
          Number.isNaN(end.getTime())
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid business date.",
          });
        }

        query.businessDate = {
          $gte: start,
          $lte: end,
        };
      }

      const pageNumber = Math.max(
        Number(page) || 1,
        1
      );

      const limitNumber = Math.min(
        Math.max(Number(limit) || 50, 1),
        100
      );

      const skip =
        (pageNumber - 1) *
        limitNumber;

      const [
        records,
        total,
      ] = await Promise.all([
        RestroomCleaning.find(query)
          .populate(
            "storeId",
            "storeNumber storeName contact email city region status"
          )
          .sort({
            businessDate: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNumber)
          .lean(),

        RestroomCleaning.countDocuments(
          query
        ),
      ]);

      const formattedRecords =
        records.map(formatRecord);

      return res.status(200).json({
        success: true,
        records: formattedRecords,
        data: formattedRecords,

        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(
            total / limitNumber
          ),
        },
      });
    } catch (error) {
      console.error(
        "Get restroom cleaning records error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load restroom cleaning records.",
        error: error.message,
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GET SINGLE RECORD
|--------------------------------------------------------------------------
|
| GET /api/restroom-cleaning/:id
|
*/

export const getRestroomCleaningRecord =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid restroom cleaning record ID.",
        });
      }

      const record =
        await RestroomCleaning.findById(
          id
        ).populate(
          "storeId",
          "storeNumber storeName contact email city region status"
        );

      if (!record) {
        return res.status(404).json({
          success: false,
          message:
            "Restroom cleaning record not found.",
        });
      }

      const access =
        checkStoreAccess(
          req,
          record
        );

      if (!access.allowed) {
        return res.status(403).json({
          success: false,
          message: access.reason,
        });
      }

      return res.status(200).json({
        success: true,
        record: formatRecord(record),
      });
    } catch (error) {
      console.error(
        "Get single restroom cleaning record error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load restroom cleaning record.",
        error: error.message,
      });
    }
  };

/*
|--------------------------------------------------------------------------
| CREATE RECORD
|--------------------------------------------------------------------------
|
| POST /api/restroom-cleaning
|
| Store account:
|   storeId comes from req.user.storeId.
|
| Admin:
|   Must provide storeId.
|
*/

export const createRestroomCleaningRecord =
  async (req, res) => {
    try {
      const {
        storeId: requestedStoreId,

        businessDate,

        supervisorName,

        employeeName,

        overallRemarks,

        inspections,

        cleaningTasks,
      } = req.body;

      /*
       * ---------------------------------------------------------------
       * Validate common fields
       * ---------------------------------------------------------------
       */

      if (!businessDate) {
        return res.status(400).json({
          success: false,
          message:
            "Business date is required.",
        });
      }

      if (
        !supervisorName ||
        !String(
          supervisorName
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Supervisor name is required.",
        });
      }

      if (
        !Array.isArray(inspections)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Inspections must be an array.",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Determine Store
       * ---------------------------------------------------------------
       */

      let storeId;

      if (
        req.user?.accountType ===
        "store"
      ) {
        storeId =
          getObjectIdString(
            req.user.storeId
          );

        if (!storeId) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
        }
      } else if (
        req.user?.accountType ===
        "admin"
      ) {
        if (
          !requestedStoreId
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Store ID is required when an admin creates a record.",
          });
        }

        if (
          !isValidObjectId(
            requestedStoreId
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid store ID.",
          });
        }

        storeId =
          requestedStoreId;
      } else {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to create restroom cleaning records.",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Load Store
       * ---------------------------------------------------------------
       */

      const store =
        await Store.findById(
          storeId
        ).lean();

      if (!store) {
        return res.status(404).json({
          success: false,
          message:
            "Store not found.",
        });
      }

      if (
        store.status &&
        store.status !== "Active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This store is not active.",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Calculate statistics on backend
       * ---------------------------------------------------------------
       */

      const stats =
        calculateStatistics(
          inspections
        );

      /*
       * ---------------------------------------------------------------
       * Create record
       * ---------------------------------------------------------------
       */

      const record =
        await RestroomCleaning.create({
          storeId: store._id,

          storeNumber:
            store.storeNumber,

          storeName:
            store.storeName,

          businessDate:
            new Date(
              `${businessDate}T00:00:00.000Z`
            ),

          supervisorName:
            String(
              supervisorName
            ).trim(),

          employeeName:
            employeeName
              ? String(
                  employeeName
                ).trim()
              : "",

          overallRemarks:
            overallRemarks
              ? String(
                  overallRemarks
                ).trim()
              : "",

          inspections,

          cleaningTasks:
            Array.isArray(
              cleaningTasks
            )
              ? cleaningTasks
              : [],

          totalInspections:
            stats.totalInspections,

          completedInspections:
            stats.completedInspections,

          inspectionsWithInitials:
            stats.inspectionsWithInitials,

          inspectionCompletion:
            stats.inspectionCompletion,

          completedTasks:
            stats.completedTasks,

          totalPossibleTasks:
            stats.totalPossibleTasks,

          taskCompletion:
            stats.taskCompletion,

          status: "Pending",

          createdByUid:
            req.user.firebaseUid,

          createdBy:
            req.user.displayName ||
            req.user.email ||
            "Unknown User",

          submittedAt:
            new Date(),
        });

      const populatedRecord =
        await RestroomCleaning.findById(
          record._id
        ).populate(
          "storeId",
          "storeNumber storeName contact email city region status"
        );

      return res.status(201).json({
        success: true,
        message:
          "Restroom cleaning checklist submitted successfully.",
        record:
          formatRecord(
            populatedRecord
          ),
      });
    } catch (error) {
      console.error(
        "Create restroom cleaning record error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create restroom cleaning record.",
        error: error.message,
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE RECORD
|--------------------------------------------------------------------------
|
| PUT /api/restroom-cleaning/:id
|
| Store users:
|   Can update their own store record.
|
| Admin:
|   Can update and review any record.
|
*/

export const updateRestroomCleaningRecord =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid restroom cleaning record ID.",
        });
      }

      const record =
        await RestroomCleaning.findById(
          id
        );

      if (!record) {
        return res.status(404).json({
          success: false,
          message:
            "Restroom cleaning record not found.",
        });
      }

      /*
       * ---------------------------------------------------------------
       * Authorization
       * ---------------------------------------------------------------
       */

      const access =
        checkStoreAccess(
          req,
          record
        );

      if (!access.allowed) {
        return res.status(403).json({
          success: false,
          message: access.reason,
        });
      }

      const {
        businessDate,
        supervisorName,
        employeeName,
        overallRemarks,
        inspections,
        cleaningTasks,

        /*
         * Admin workflow
         */
        status,
        adminComment,
        rejectionReason,
      } = req.body;

      /*
       * ---------------------------------------------------------------
       * Update editable fields
       * ---------------------------------------------------------------
       */

      if (businessDate) {
        record.businessDate =
          new Date(
            `${businessDate}T00:00:00.000Z`
          );
      }

      if (
        supervisorName !==
        undefined
      ) {
        if (
          !String(
            supervisorName
          ).trim()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Supervisor name cannot be empty.",
          });
        }

        record.supervisorName =
          String(
            supervisorName
          ).trim();
      }

      if (
        employeeName !==
        undefined
      ) {
        record.employeeName =
          String(
            employeeName || ""
          ).trim();
      }

      if (
        overallRemarks !==
        undefined
      ) {
        record.overallRemarks =
          String(
            overallRemarks || ""
          ).trim();
      }

      if (
        Array.isArray(
          inspections
        )
      ) {
        record.inspections =
          inspections;

        /*
         * Recalculate all statistics.
         */
        const stats =
          calculateStatistics(
            inspections
          );

        record.totalInspections =
          stats.totalInspections;

        record.completedInspections =
          stats.completedInspections;

        record.inspectionsWithInitials =
          stats.inspectionsWithInitials;

        record.completedTasks =
          stats.completedTasks;

        record.totalPossibleTasks =
          stats.totalPossibleTasks;

        record.inspectionCompletion =
          stats.inspectionCompletion;

        record.taskCompletion =
          stats.taskCompletion;
      }

      if (
        Array.isArray(
          cleaningTasks
        )
      ) {
        record.cleaningTasks =
          cleaningTasks;
      }

      /*
       * ---------------------------------------------------------------
       * Admin review
       * ---------------------------------------------------------------
       *
       * Only admins can change the official
       * review status/comments.
       */

      if (
        req.user?.accountType ===
        "admin"
      ) {
        const allowedStatuses = [
          "Pending",
          "Completed",
          "Failed",
          "Reviewed",
        ];

        if (
          status !== undefined
        ) {
          if (
            !allowedStatuses.includes(
              status
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid restroom cleaning status.",
            });
          }

          record.status =
            status;
        }

        if (
          adminComment !==
          undefined
        ) {
          record.adminComment =
            String(
              adminComment || ""
            ).trim();
        }

        if (
          rejectionReason !==
          undefined
        ) {
          record.rejectionReason =
            String(
              rejectionReason || ""
            ).trim();
        }

        /*
         * If an admin reviews the record,
         * save who reviewed it.
         */
        if (
          status === "Reviewed" ||
          status === "Failed"
        ) {
          record.reviewedByUid =
            req.user.firebaseUid;

          record.reviewedByName =
            req.user.displayName ||
            req.user.email ||
            "Admin";

          record.reviewedAt =
            new Date();
        }
      }

      await record.save();

      const updatedRecord =
        await RestroomCleaning.findById(
          record._id
        ).populate(
          "storeId",
          "storeNumber storeName contact email city region status"
        );

      return res.status(200).json({
        success: true,
        message:
          "Restroom cleaning record updated successfully.",
        record:
          formatRecord(
            updatedRecord
          ),
      });
    } catch (error) {
      console.error(
        "Update restroom cleaning record error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update restroom cleaning record.",
        error: error.message,
      });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE RECORD
|--------------------------------------------------------------------------
|
| DELETE /api/restroom-cleaning/:id
|
| Store users:
|   Can delete their own store records.
|
| Admin:
|   Can delete any record.
|
*/

export const deleteRestroomCleaningRecord =
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid restroom cleaning record ID.",
        });
      }

      const record =
        await RestroomCleaning.findById(
          id
        );

      if (!record) {
        return res.status(404).json({
          success: false,
          message:
            "Restroom cleaning record not found.",
        });
      }

      /*
       * Check store authorization.
       */
      const access =
        checkStoreAccess(
          req,
          record
        );

      if (!access.allowed) {
        return res.status(403).json({
          success: false,
          message: access.reason,
        });
      }

      await RestroomCleaning.findByIdAndDelete(
        id
      );

      return res.status(200).json({
        success: true,
        message:
          "Restroom cleaning record deleted successfully.",
        id,
      });
    } catch (error) {
      console.error(
        "Delete restroom cleaning record error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete restroom cleaning record.",
        error: error.message,
      });
    }
  };