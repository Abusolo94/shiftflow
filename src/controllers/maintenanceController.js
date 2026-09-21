import mongoose from "mongoose";

import Maintenance from "../models/Maintenance.js";
import Store from "../models/Store.js";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

/**
 * Safely convert a value into a MongoDB ObjectId string.
 *
 * Handles:
 * - ObjectId
 * - populated Store document
 * - string ObjectId
 */
const getObjectIdString = (value) => {
  if (!value) {
    return null;
  }

  if (value?._id) {
    return String(value._id);
  }

  return String(value);
};


/**
 * Validate MongoDB ObjectId.
 */
const isValidObjectId = (id) => {
  return Boolean(
    id &&
      mongoose.Types.ObjectId.isValid(
        id
      )
  );
};


/**
 * Normalize maintenance document
 * before sending it to React.
 */
const normalizeMaintenance = (
  maintenance
) => {
  if (!maintenance) {
    return null;
  }

  const item =
    typeof maintenance.toObject ===
    "function"
      ? maintenance.toObject()
      : maintenance;

  return {
    ...item,

    id: item._id
      ? String(item._id)
      : String(item.id || ""),

    _id: item._id
      ? String(item._id)
      : String(item.id || ""),

    storeId: item.storeId
      ? getObjectIdString(
          item.storeId
        )
      : null,

    /*
    |----------------------------------------------------------------------
    | Keep frontend-friendly creator fields
    |----------------------------------------------------------------------
    */

    createdByUid:
      item.createdByUid || "",

    createdByName:
      item.createdByName || "",

    createdByEmail:
      item.createdByEmail || "",

    /*
    |----------------------------------------------------------------------
    | Optional review fields
    |----------------------------------------------------------------------
    |
    | These are safe even if they don't exist
    | in older MongoDB records.
    |
    */

    adminComment:
      item.adminComment || "",

    rejectionReason:
      item.rejectionReason || "",

    createdAt:
      item.createdAt || null,

    updatedAt:
      item.updatedAt || null,

    submittedAt:
      item.submittedAt || null,
  };
};


/*
|--------------------------------------------------------------------------
| GET USER STORE
|--------------------------------------------------------------------------
*/

/**
 * Get the Store document belonging to the authenticated user.
 *
 * Important:
 * req.user.storeId can be:
 *
 * ObjectId
 *
 * OR:
 *
 * populated Store document
 */
const getUserStore = async (req) => {
  const rawStoreId =
    req.user?.storeId;

  const storeId =
    getObjectIdString(
      rawStoreId
    );

  if (
    !storeId ||
    !isValidObjectId(storeId)
  ) {
    return null;
  }

  return Store.findById(
    storeId
  );
};


/*
|--------------------------------------------------------------------------
| RESOLVE STORE
|--------------------------------------------------------------------------
*/

/**
 * Resolve the store for create operations.
 *
 * ADMIN:
 *   Must provide storeId.
 *
 * STORE ACCOUNT:
 *   Always uses its own store.
 *
 * Never trust storeId sent by a store
 * account from the frontend.
 */
const resolveStore = async (
  req,
  requestedStoreId = null
) => {
  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    req.user?.accountType ===
    "admin"
  ) {
    if (
      !requestedStoreId
    ) {
      return null;
    }

    if (
      !isValidObjectId(
        requestedStoreId
      )
    ) {
      return null;
    }

    return Store.findById(
      requestedStoreId
    );
  }

  /*
  |--------------------------------------------------------------------------
  | STORE ACCOUNT
  |--------------------------------------------------------------------------
  */

  if (
    req.user?.accountType ===
    "store"
  ) {
    return getUserStore(req);
  }

  return null;
};


/*
|--------------------------------------------------------------------------
| CHECK STORE ACCESS
|--------------------------------------------------------------------------
*/

/**
 * Central authorization helper.
 *
 * Returns:
 *
 * {
 *   allowed: true,
 *   storeId: "..."
 * }
 *
 * OR:
 *
 * {
 *   allowed: false,
 *   reason: "..."
 * }
 */
const checkStoreAccess = (
  req,
  maintenance
) => {
  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  |
  | Admins can access all stores.
  |
  */

  if (
    req.user?.accountType ===
    "admin"
  ) {
    return {
      allowed: true,
      storeId:
        getObjectIdString(
          maintenance?.storeId
        ),
    };
  }

  /*
  |--------------------------------------------------------------------------
  | ONLY STORE ACCOUNTS BELOW
  |--------------------------------------------------------------------------
  */

  if (
    req.user?.accountType !==
    "store"
  ) {
    return {
      allowed: false,
      reason:
        "Invalid account type.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | USER STORE
  |--------------------------------------------------------------------------
  */

  const userStoreId =
    getObjectIdString(
      req.user?.storeId
    );

  if (!userStoreId) {
    return {
      allowed: false,
      reason:
        "Your account is not assigned to a store.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | MAINTENANCE STORE
  |--------------------------------------------------------------------------
  */

  const maintenanceStoreId =
    getObjectIdString(
      maintenance?.storeId
    );

  if (!maintenanceStoreId) {
    return {
      allowed: false,
      reason:
        "This maintenance record is not assigned to a store.",
    };
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | Compare normalized strings.
  |
  */

  if (
    userStoreId !==
    maintenanceStoreId
  ) {
    console.warn(
      "Maintenance store authorization mismatch",
      {
        userUid:
          req.user?.firebaseUid,

        accountType:
          req.user?.accountType,

        userStoreId,

        maintenanceStoreId,
      }
    );

    return {
      allowed: false,
      reason:
        "You are not authorized to access this maintenance checklist.",
    };
  }

  return {
    allowed: true,
    storeId:
      maintenanceStoreId,
  };
};


/*
|--------------------------------------------------------------------------
| CHECKLIST NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeChecklist = (
  checklist
) => {
  if (
    !Array.isArray(checklist)
  ) {
    return [];
  }

  return checklist.map(
    (section) => {
      const title =
        String(
          section?.title ||
            "Maintenance Tasks"
        ).trim();

      const tasks =
        Array.isArray(
          section?.tasks
        )
          ? section.tasks.map(
              (item) => {
                const result =
                  String(
                    item?.result ||
                      ""
                  )
                    .trim()
                    .toLowerCase();

                let normalizedResult =
                  "Not Checked";

                if (
                  result ===
                  "yes"
                ) {
                  normalizedResult =
                    "yes";
                }

                if (
                  result ===
                  "no"
                ) {
                  normalizedResult =
                    "no";
                }

                return {
                  task: String(
                    item?.task ||
                      ""
                  ).trim(),

                  result:
                    normalizedResult,

                  passed:
                    normalizedResult ===
                    "yes",
                };
              }
            )
          : [];

      return {
        title,
        tasks,
      };
    }
  );
};


/*
|--------------------------------------------------------------------------
| CALCULATE CHECKLIST RESULTS
|--------------------------------------------------------------------------
*/

const calculateResults = (
  checklist
) => {
  const normalizedChecklist =
    normalizeChecklist(
      checklist
    );

  let total = 0;
  let passed = 0;
  let failed = 0;
  let unchecked = 0;

  normalizedChecklist.forEach(
    (section) => {
      section.tasks.forEach(
        (task) => {
          total += 1;

          if (
            task.result ===
            "yes"
          ) {
            passed += 1;
          } else if (
            task.result ===
            "no"
          ) {
            failed += 1;
          } else {
            unchecked += 1;
          }
        }
      );
    }
  );

  const score =
    total > 0
      ? Math.round(
          (passed / total) *
            100
        )
      : 0;

  return {
    checklist:
      normalizedChecklist,

    total,

    passed,

    failed,

    unchecked,

    score,
  };
};


/*
|--------------------------------------------------------------------------
| DETERMINE AUTOMATIC STATUS
|--------------------------------------------------------------------------
*/

const calculateStatus = ({
  unchecked,
  failed,
}) => {
  if (unchecked > 0) {
    return "Pending";
  }

  if (failed > 0) {
    return "Failed";
  }

  return "Completed";
};


/*
|--------------------------------------------------------------------------
| VALIDATE DATE
|--------------------------------------------------------------------------
*/

const parseDate = (
  value
) => {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};


/*
|--------------------------------------------------------------------------
| GET MAINTENANCE
|--------------------------------------------------------------------------
*/

export const getMaintenances =
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required.",
        });
      }

      const {
        storeId,
        storeNumber,
        shift,
        status,
        startDate,
        endDate,
      } = req.query;

      const filter = {};

      /*
      |--------------------------------------------------------------------------
      | STORE ACCOUNT
      |--------------------------------------------------------------------------
      */

      if (
        req.user.accountType ===
        "store"
      ) {
        const userStoreId =
          getObjectIdString(
            req.user.storeId
          );

        if (
          !userStoreId ||
          !isValidObjectId(
            userStoreId
          )
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not assigned to a valid store.",
          });
        }

        /*
        |----------------------------------------------------------------------
        | NEVER accept storeId from
        | frontend for store accounts.
        |----------------------------------------------------------------------
        */

        filter.storeId =
          new mongoose.Types.ObjectId(
            userStoreId
          );
      }

      /*
      |--------------------------------------------------------------------------
      | ADMIN
      |--------------------------------------------------------------------------
      */

      else if (
        req.user.accountType ===
        "admin"
      ) {
        if (storeId) {
          if (
            !isValidObjectId(
              storeId
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid store ID.",
            });
          }

          filter.storeId =
            new mongoose.Types.ObjectId(
              storeId
            );
        }

        if (storeNumber) {
          filter.storeNumber =
            String(
              storeNumber
            ).trim();
        }
      }

      /*
      |--------------------------------------------------------------------------
      | INVALID ACCOUNT
      |--------------------------------------------------------------------------
      */

      else {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to access maintenance records.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | SHIFT
      |--------------------------------------------------------------------------
      */

      if (shift) {
        if (
          ![
            "Opening",
            "Mid",
            "Closing",
          ].includes(shift)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid shift.",
          });
        }

        filter.shift =
          shift;
      }

      /*
      |--------------------------------------------------------------------------
      | STATUS
      |--------------------------------------------------------------------------
      */

      if (status) {
        const allowedStatuses =
          [
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
          return res.status(400).json({
            success: false,
            message:
              "Invalid maintenance status.",
          });
        }

        filter.status =
          status;
      }

      /*
      |--------------------------------------------------------------------------
      | DATE RANGE
      |--------------------------------------------------------------------------
      */

      if (
        startDate ||
        endDate
      ) {
        filter.businessDate =
          {};

        if (startDate) {
          const start =
            parseDate(
              startDate
            );

          if (!start) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid start date.",
            });
          }

          start.setHours(
            0,
            0,
            0,
            0
          );

          filter.businessDate.$gte =
            start;
        }

        if (endDate) {
          const end =
            parseDate(
              endDate
            );

          if (!end) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid end date.",
            });
          }

          end.setHours(
            23,
            59,
            59,
            999
          );

          filter.businessDate.$lte =
            end;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | DATABASE QUERY
      |--------------------------------------------------------------------------
      */

      const maintenances =
        await Maintenance.find(
          filter
        )
          .populate(
            "storeId",
            "storeNumber storeName contact email city region status"
          )
          .sort({
            businessDate: -1,
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        count:
          maintenances.length,

        maintenances:
          maintenances.map(
            normalizeMaintenance
          ),
      });
    } catch (error) {
      console.error(
        "Get maintenances error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch maintenance checklists.",
      });
    }
  };


/*
|--------------------------------------------------------------------------
| GET SINGLE MAINTENANCE
|--------------------------------------------------------------------------
*/

export const getSingleMaintenance =
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required.",
        });
      }

      const { id } =
        req.params;

      /*
      |--------------------------------------------------------------------------
      | VALIDATE ID
      |--------------------------------------------------------------------------
      */

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid maintenance ID.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | FIND RECORD
      |--------------------------------------------------------------------------
      */

      const maintenance =
        await Maintenance.findById(
          id
        ).populate(
          "storeId",
          "storeNumber storeName contact email city region status"
        );

      if (!maintenance) {
        return res.status(404).json({
          success: false,
          message:
            "Maintenance checklist not found.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | SECURITY CHECK
      |--------------------------------------------------------------------------
      */

      const access =
        checkStoreAccess(
          req,
          maintenance
        );

      if (!access.allowed) {
        return res.status(403).json({
          success: false,
          message:
            access.reason ||
            "You are not authorized to access this maintenance checklist.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      return res.status(200).json({
        success: true,

        maintenance:
          normalizeMaintenance(
            maintenance
          ),
      });
    } catch (error) {
      console.error(
        "Get single maintenance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch maintenance checklist.",
      });
    }
  };


/*
|--------------------------------------------------------------------------
| CREATE MAINTENANCE
|--------------------------------------------------------------------------
*/

export const createMaintenance =
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | ACCOUNT TYPE
      |--------------------------------------------------------------------------
      */

      if (
        ![
          "store",
          "admin",
        ].includes(
          req.user.accountType
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to create a maintenance checklist.",
        });
      }

      const {
        storeId,
        businessDate,
        shift,
        managerName,
        checklist,
        findings,
        repairsRequired,
        comments,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | VALIDATE BUSINESS DATE
      |--------------------------------------------------------------------------
      */

      if (!businessDate) {
        return res.status(400).json({
          success: false,
          message:
            "Business date is required.",
        });
      }

      const parsedBusinessDate =
        parseDate(
          businessDate
        );

      if (!parsedBusinessDate) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid business date.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | SHIFT
      |--------------------------------------------------------------------------
      */

      if (
        ![
          "Opening",
          "Mid",
          "Closing",
        ].includes(shift)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid shift.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | MANAGER
      |--------------------------------------------------------------------------
      */

      if (
        !managerName ||
        !String(
          managerName
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Manager name is required.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | CHECKLIST
      |--------------------------------------------------------------------------
      */

      if (
        !Array.isArray(
          checklist
        ) ||
        checklist.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maintenance checklist is required.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | STORE
      |--------------------------------------------------------------------------
      */

      const selectedStore =
        await resolveStore(
          req,
          storeId
        );

      if (!selectedStore) {
        return res.status(400).json({
          success: false,
          message:
            req.user.accountType ===
            "admin"
              ? "A valid store must be selected."
              : "Your account is not assigned to a valid store.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | RESULTS
      |--------------------------------------------------------------------------
      */

      const results =
        calculateResults(
          checklist
        );

      const calculatedStatus =
        calculateStatus({
          unchecked:
            results.unchecked,
          failed:
            results.failed,
        });

      /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
      */

      const maintenance =
        await Maintenance.create({
          storeId:
            selectedStore._id,

          storeNumber:
            selectedStore.storeNumber,

          storeName:
            selectedStore.storeName,

          businessDate:
            parsedBusinessDate,

          shift,

          managerName:
            String(
              managerName
            ).trim(),

          checklist:
            results.checklist,

          findings:
            String(
              findings || ""
            ).trim(),

          repairsRequired:
            String(
              repairsRequired ||
                ""
            ).trim(),

          comments:
            String(
              comments || ""
            ).trim(),

          total:
            results.total,

          passed:
            results.passed,

          failed:
            results.failed,

          unchecked:
            results.unchecked,

          score:
            results.score,

          status:
            calculatedStatus,

          createdByUid:
            req.user.firebaseUid,

          createdByName:
            req.user.displayName ||
            req.user.email ||
            "",

          createdByEmail:
            req.user.email ||
            "",

          submittedAt:
            new Date(),
        });

      await maintenance.populate(
        "storeId",
        "storeNumber storeName contact email city region status"
      );

      return res.status(201).json({
        success: true,

        message:
          "Maintenance checklist created successfully.",

        maintenance:
          normalizeMaintenance(
            maintenance
          ),
      });
    } catch (error) {
      console.error(
        "Create maintenance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create maintenance checklist.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };


/*
|--------------------------------------------------------------------------
| UPDATE MAINTENANCE
|--------------------------------------------------------------------------
*/

export const updateMaintenance =
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required.",
        });
      }

      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid maintenance ID.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | FIND
      |--------------------------------------------------------------------------
      */

      const maintenance =
        await Maintenance.findById(
          id
        );

      if (!maintenance) {
        return res.status(404).json({
          success: false,
          message:
            "Maintenance checklist not found.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | AUTHORIZATION
      |--------------------------------------------------------------------------
      */

      const access =
        checkStoreAccess(
          req,
          maintenance
        );

      if (!access.allowed) {
        return res.status(403).json({
          success: false,
          message:
            access.reason ||
            "You are not authorized to update this maintenance checklist.",
        });
      }

      const {
        businessDate,
        shift,
        managerName,
        checklist,
        findings,
        repairsRequired,
        comments,
        status,
        adminComment,
        rejectionReason,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | BASIC FIELDS
      |--------------------------------------------------------------------------
      */

      if (
        businessDate !==
        undefined
      ) {
        const parsedDate =
          parseDate(
            businessDate
          );

        if (!parsedDate) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid business date.",
          });
        }

        maintenance.businessDate =
          parsedDate;
      }

      if (shift !== undefined) {
        if (
          ![
            "Opening",
            "Mid",
            "Closing",
          ].includes(shift)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid shift.",
          });
        }

        maintenance.shift =
          shift;
      }

      if (
        managerName !==
        undefined
      ) {
        const cleanManagerName =
          String(
            managerName
          ).trim();

        if (!cleanManagerName) {
          return res.status(400).json({
            success: false,
            message:
              "Manager name cannot be empty.",
          });
        }

        maintenance.managerName =
          cleanManagerName;
      }

      if (
        findings !==
        undefined
      ) {
        maintenance.findings =
          String(
            findings
          ).trim();
      }

      if (
        repairsRequired !==
        undefined
      ) {
        maintenance.repairsRequired =
          String(
            repairsRequired
          ).trim();
      }

      if (
        comments !==
        undefined
      ) {
        maintenance.comments =
          String(
            comments
          ).trim();
      }

      /*
      |--------------------------------------------------------------------------
      | CHECKLIST UPDATE
      |--------------------------------------------------------------------------
      */

      if (
        Array.isArray(
          checklist
        )
      ) {
        const results =
          calculateResults(
            checklist
          );

        maintenance.checklist =
          results.checklist;

        maintenance.total =
          results.total;

        maintenance.passed =
          results.passed;

        maintenance.failed =
          results.failed;

        maintenance.unchecked =
          results.unchecked;

        maintenance.score =
          results.score;

        /*
        |----------------------------------------------------------------------
        | Automatic status
        |----------------------------------------------------------------------
        */

        maintenance.status =
          calculateStatus({
            unchecked:
              results.unchecked,

            failed:
              results.failed,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | ADMIN REVIEW
      |--------------------------------------------------------------------------
      |
      | Only admins can change review status.
      |
      */

      if (
        req.user.accountType ===
        "admin"
      ) {
        const allowedStatuses =
          [
            "Pending",
            "Completed",
            "Failed",
            "Reviewed",
          ];

        if (
          status !==
          undefined
        ) {
          if (
            !allowedStatuses.includes(
              status
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid maintenance status.",
            });
          }

          maintenance.status =
            status;
        }

        /*
        |----------------------------------------------------------------------
        | Review comment
        |----------------------------------------------------------------------
        */

        if (
          adminComment !==
          undefined
        ) {
          maintenance.adminComment =
            String(
              adminComment
            ).trim();
        }

        /*
        |----------------------------------------------------------------------
        | Rejection reason
        |----------------------------------------------------------------------
        */

        if (
          rejectionReason !==
          undefined
        ) {
          maintenance.rejectionReason =
            String(
              rejectionReason
            ).trim();
        }
      }

      /*
      |--------------------------------------------------------------------------
      | SAVE
      |--------------------------------------------------------------------------
      */

      await maintenance.save();

      await maintenance.populate(
        "storeId",
        "storeNumber storeName contact email city region status"
      );

      return res.status(200).json({
        success: true,

        message:
          "Maintenance checklist updated successfully.",

        maintenance:
          normalizeMaintenance(
            maintenance
          ),
      });
    } catch (error) {
      console.error(
        "Update maintenance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update maintenance checklist.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };


/*
|--------------------------------------------------------------------------
| DELETE MAINTENANCE
|--------------------------------------------------------------------------
*/

export const deleteMaintenance =
  async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required.",
        });
      }

      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid maintenance ID.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | FIND
      |--------------------------------------------------------------------------
      */

      const maintenance =
        await Maintenance.findById(
          id
        );

      if (!maintenance) {
        return res.status(404).json({
          success: false,
          message:
            "Maintenance checklist not found.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | AUTHORIZATION
      |--------------------------------------------------------------------------
      */

      const access =
        checkStoreAccess(
          req,
          maintenance
        );

      if (!access.allowed) {
        return res.status(403).json({
          success: false,
          message:
            access.reason ||
            "You are not authorized to delete this maintenance checklist.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | DELETE
      |--------------------------------------------------------------------------
      */

      await Maintenance.findByIdAndDelete(
        id
      );

      return res.status(200).json({
        success: true,

        message:
          "Maintenance checklist deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete maintenance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete maintenance checklist.",
      });
    }
  };