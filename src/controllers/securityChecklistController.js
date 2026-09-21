import mongoose from "mongoose";

import SecurityChecklist from "../models/SecurityChecklist.js";
import Store from "../models/Store.js";

/*
|--------------------------------------------------------------------------
| Canonical Security Questions
|--------------------------------------------------------------------------
|
| Keep this list on the backend so:
| - the client cannot invent/remove questions
| - labels stay consistent
| - scoring stays trustworthy
|
*/

const SECURITY_QUESTIONS = [
  {
    number: 2,
    id: "staggeredOpening",
    question:
      "Is the staggered method of opening utilized in the restaurant?",
  },
  {
    number: 3,
    id: "maintenanceSafetyAwareness",
    question:
      "Are maintenance personnel fully aware of all safety and security procedures?",
  },
  {
    number: 4,
    id: "emergencyProcedureTraining",
    question:
      "Are crews and managers trained in emergency procedures?",
  },
  {
    number: 5,
    id: "openingDriveAround",
    question:
      "Does the AM manager drive around the store prior to set-up?",
  },
  {
    number: 6,
    id: "nonStaffIdentification",
    question:
      "Is identification requested from non-McDonald's staff requesting entry into work areas?",
  },
  {
    number: 7,
    id: "restaurantSafeLocked",
    question:
      "Is the restaurant safe locked at all times?",
  },
  {
    number: 8,
    id: "safeCombinationChanged",
    question:
      "Is the safe combination changed every month by the Restaurant Manager?",
  },
  {
    number: 9,
    id: "safeKeysReplaced",
    question:
      "Are the safe and store keys replaced when a Restaurant Manager leaves the company or is transferred?",
  },
  {
    number: 10,
    id: "safeCombinationShared",
    question:
      "Is the safe combination communicated verbally to the rest of the assistant managers?",
  },
  {
    number: 11,
    id: "companyVehicleParking",
    question:
      "Is the company bus or car parked in front of the store after closing?",
  },
  {
    number: 12,
    id: "closingAreaCheck",
    question:
      "Does the manager check all areas, including hidden areas, just prior to close?",
  },
  {
    number: 13,
    id: "doorsLockedOnClose",
    question:
      "Are all doors locked upon close, including the drive-thru windows?",
  },
  {
    number: 14,
    id: "closingLighting",
    question:
      "Is there sufficient lighting left after closing?",
  },
  {
    number: 15,
    id: "authorizedExtraKeys",
    question:
      "Are keys not given to crews unless first authorized by the manager?",
  },
  {
    number: 16,
    id: "noOneAlone",
    question:
      "Are members of the management team or crew prohibited from remaining in the restaurant alone?",
  },
  {
    number: 17,
    id: "backDoorSupervision",
    question:
      "Is a manager present whenever the back door is opened or unlocked?",
  },
  {
    number: 18,
    id: "backDoorUse",
    question:
      "Is the back door used only for deliveries and rubbish removal during daylight hours?",
  },
  {
    number: 19,
    id: "burglarAlarm",
    question:
      "Does the restaurant have a working burglar alarm?",
  },
  {
    number: 20,
    id: "largeNoteVerification",
    question:
      "Are front counter and drive-thru crew requesting management verification on all large notes?",
  },
  {
    number: 21,
    id: "fakeMoneyDetector",
    question:
      "Is the fake money detector working?",
  },
  {
    number: 22,
    id: "securityCameras",
    question:
      "Are the security cameras working and protected by a password?",
  },
  {
    number: 23,
    id: "largeNotesStored",
    question:
      "Are large notes stored underneath the cash drawers?",
  },
  {
    number: 24,
    id: "personalFilesLocked",
    question:
      "Are all personnel files stored and locked in a cabinet?",
  },
  {
    number: 25,
    id: "storageAreasLocked",
    question:
      "Are all storage areas locked, including the walk-in freezer, cooler, stockroom inside and outside?",
  },
  {
    number: 26,
    id: "cashPolicyExplained",
    question:
      "Is the cash policy thoroughly explained to crews and managers, signed, and filed?",
  },
  {
    number: 27,
    id: "cashDrawerResponsibility",
    question:
      "Is each cash drawer assigned to one person who is responsible for all cash variances?",
  },
  {
    number: 28,
    id: "salesPaid",
    question:
      "Are all sales rung up and paid for at all times?",
  },
  {
    number: 29,
    id: "tRedsMonitored",
    question:
      "Are T-Reds being monitored?",
  },
  {
    number: 30,
    id: "couponsFiled",
    question:
      "Are coupons and BOGs handled correctly and filed?",
  },
  {
    number: 31,
    id: "registerSkimming",
    question:
      "Are all registers being skimmed by the manager every two hours?",
  },
  {
    number: 32,
    id: "refundSlipsFiled",
    question:
      "Are refund slips filed, with all correct information and the reason for refunding written on the slip?",
  },
  {
    number: 33,
    id: "bankDepositSlipsVerified",
    question:
      "Are all bank deposit slips verified by the Restaurant Manager and filed?",
  },
  {
    number: 34,
    id: "foreignCurrencyVerified",
    question:
      "Are all foreign currency deposits verified by the Restaurant Manager?",
  },
  {
    number: 35,
    id: "cashFloatCounted",
    question:
      "Are cash floats given to crew counted prior to handling counter or drive-thru stations?",
  },
  {
    number: 36,
    id: "employeeDepositWitness",
    question:
      "Is the manager going to deposit accompanied by another employee?",
  },
  {
    number: 37,
    id: "invoicesVerified",
    question:
      "Are all invoices signed, translated, and verified by the Restaurant Manager?",
  },
  {
    number: 38,
    id: "emergencyNumbersPosted",
    question:
      "Are emergency numbers posted in the office, including Police, Fire, and Ambulance?",
  },
  {
    number: 39,
    id: "cashSpotChecks",
    question:
      "Does the shift manager conduct cash spot checks on the cash registers?",
  },
  {
    number: 40,
    id: "lostAndFoundPolicy",
    question:
      "Is the policy on lost and found being followed?",
  },
];

const VALID_SHIFTS = [
  "Opening",
  "Mid",
  "Closing",
];

const VALID_STATUSES = [
  "Pending",
  "Reviewed",
  "Failed",
  "Completed",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getObjectIdString = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (value?._id) {
    return String(value._id);
  }

  if (value?.id) {
    return String(value.id);
  }

  return String(value);
};

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const isAdminAccount = (req) =>
  String(req.user?.accountType || "")
    .trim()
    .toLowerCase() === "admin";

const checkStoreAccess = (
  req,
  record
) => {
  if (isAdminAccount(req)) {
    return true;
  }

  const userStoreId =
    getObjectIdString(
      req.user?.storeId
    );

  const recordStoreId =
    getObjectIdString(
      record?.storeId
    );

  return (
    Boolean(userStoreId) &&
    Boolean(recordStoreId) &&
    userStoreId ===
      recordStoreId
  );
};

/*
|--------------------------------------------------------------------------
| Normalize Answers
|--------------------------------------------------------------------------
|
| Current frontend sends:
|
| answers: {
|   staggeredOpening: {
|     answer: "yes",
|     remarks: "",
|     actionPlan: ""
|   }
| }
|
*/

const normalizeResponses = (
  answers
) => {
  const source =
    answers &&
    typeof answers === "object"
      ? answers
      : {};

  return SECURITY_QUESTIONS.map(
    (question) => {
      const response =
        source?.[question.id] ||
        {};

      const answer =
        String(
          response?.answer || ""
        )
          .trim()
          .toLowerCase();

      const normalizedAnswer =
        answer === "yes" ||
        answer === "no"
          ? answer
          : "";

      return {
        number:
          question.number,

        questionId:
          question.id,

        question:
          question.question,

        answer:
          normalizedAnswer,

        remarks:
          String(
            response?.remarks ||
              ""
          ).trim(),

        actionPlan:
          String(
            response?.actionPlan ||
              ""
          ).trim(),

        passed:
          normalizedAnswer ===
          "yes",
      };
    }
  );
};

/*
|--------------------------------------------------------------------------
| Calculate Results
|--------------------------------------------------------------------------
*/

const calculateResults = (
  responses
) => {
  const totalQuestions =
    responses.length;

  const answeredQuestions =
    responses.filter(
      (item) =>
        item.answer === "yes" ||
        item.answer === "no"
    ).length;

  const passed =
    responses.filter(
      (item) =>
        item.answer === "yes"
    ).length;

  const failed =
    responses.filter(
      (item) =>
        item.answer === "no"
    ).length;

  const unanswered =
    totalQuestions -
    answeredQuestions;

  const completionPercentage =
    totalQuestions > 0
      ? Math.round(
          (answeredQuestions /
            totalQuestions) *
            100
        )
      : 0;

  const score =
    totalQuestions > 0
      ? Math.round(
          (passed /
            totalQuestions) *
            100
        )
      : 0;

  let complianceStatus =
    "Incomplete";

  if (unanswered > 0) {
    complianceStatus =
      "Incomplete";
  } else if (failed === 0) {
    complianceStatus =
      "Compliant";
  } else if (failed <= 3) {
    complianceStatus =
      "Action Required";
  } else {
    complianceStatus =
      "Critical";
  }

  const failedItems =
    responses.filter(
      (item) =>
        item.answer === "no"
    );

  return {
    totalQuestions,
    answeredQuestions,
    passed,
    failed,
    unanswered,
    completionPercentage,
    score,
    complianceStatus,
    failedItems,
  };
};

/*
|--------------------------------------------------------------------------
| Validate No Answers
|--------------------------------------------------------------------------
|
| Every No answer must have an action plan.
|
*/

const findMissingActionPlans = (
  responses
) =>
  responses.filter(
    (item) =>
      item.answer === "no" &&
      !item.actionPlan
  );

/*
|--------------------------------------------------------------------------
| Format Record
|--------------------------------------------------------------------------
*/

const formatRecord = (
  record
) => {
  const raw =
    typeof record?.toObject ===
    "function"
      ? record.toObject()
      : record;

  if (!raw) {
    return null;
  }

  return {
    ...raw,

    id: String(raw._id),

    _id: String(raw._id),

    storeId:
      getObjectIdString(
        raw.storeId
      ),
  };
};

/*
|--------------------------------------------------------------------------
| GET /api/security-checklists
|--------------------------------------------------------------------------
*/

export const getSecurityChecklistRecords =
  async (req, res) => {
    try {
      const query = {};

      /*
      |--------------------------------------------------------------------------
      | Store Scope
      |--------------------------------------------------------------------------
      */

      if (!isAdminAccount(req)) {
        const storeId =
          getObjectIdString(
            req.user?.storeId
          );

        if (
          !storeId ||
          !isValidObjectId(
            storeId
          )
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not linked to a valid store.",
          });
        }

        query.storeId =
          storeId;
      } else {
        if (
          req.query.storeId
        ) {
          if (
            !isValidObjectId(
              req.query.storeId
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid store ID.",
            });
          }

          query.storeId =
            req.query.storeId;
        }

        if (
          req.query.storeNumber
        ) {
          query.storeNumber =
            String(
              req.query.storeNumber
            ).trim();
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Status
      |--------------------------------------------------------------------------
      */

      if (req.query.status) {
        const status =
          String(
            req.query.status
          ).trim();

        if (
          !VALID_STATUSES.includes(
            status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid security checklist status.",
          });
        }

        query.status =
          status;
      }

      /*
      |--------------------------------------------------------------------------
      | Compliance
      |--------------------------------------------------------------------------
      */

      if (
        req.query.complianceStatus
      ) {
        query.complianceStatus =
          String(
            req.query
              .complianceStatus
          ).trim();
      }

      /*
      |--------------------------------------------------------------------------
      | Shift
      |--------------------------------------------------------------------------
      */

      if (req.query.shift) {
        const shift =
          String(
            req.query.shift
          ).trim();

        if (
          !VALID_SHIFTS.includes(
            shift
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid shift.",
          });
        }

        query.shift = shift;
      }

      /*
      |--------------------------------------------------------------------------
      | Business Date
      |--------------------------------------------------------------------------
      */

      if (
        req.query.businessDate
      ) {
        const start =
          new Date(
            req.query
              .businessDate
          );

        if (
          Number.isNaN(
            start.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid business date.",
          });
        }

        const end =
          new Date(start);

        end.setDate(
          end.getDate() + 1
        );

        query.businessDate = {
          $gte: start,
          $lt: end,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | Search
      |--------------------------------------------------------------------------
      */

      if (req.query.search) {
        const search =
          String(
            req.query.search
          ).trim();

        if (search) {
          query.$or = [
            {
              storeName: {
                $regex: search,
                $options: "i",
              },
            },
            {
              storeNumber: {
                $regex: search,
                $options: "i",
              },
            },
            {
              restaurantManager: {
                $regex: search,
                $options: "i",
              },
            },
            {
              completedBy: {
                $regex: search,
                $options: "i",
              },
            },
          ];
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const page =
        Math.max(
          Number(
            req.query.page
          ) || 1,
          1
        );

      const limit =
        Math.min(
          Math.max(
            Number(
              req.query.limit
            ) || 50,
            1
          ),
          200
        );

      const skip =
        (page - 1) *
        limit;

      const [
        records,
        total,
      ] =
        await Promise.all([
          SecurityChecklist.find(
            query
          )
            .sort({
              businessDate: -1,
              createdAt: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean(),

          SecurityChecklist.countDocuments(
            query
          ),
        ]);

      return res.status(200).json({
        success: true,

        records:
          records.map(
            formatRecord
          ),

        pagination: {
          page,
          limit,
          total,
          pages:
            Math.ceil(
              total / limit
            ),
        },
      });
    } catch (error) {
      console.error(
        "Get Security Checklist Records Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load security checklist records.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GET /api/security-checklists/:id
|--------------------------------------------------------------------------
*/

export const getSecurityChecklistRecord =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid security checklist record ID.",
        });
      }

      const record =
        await SecurityChecklist.findById(
          id
        );

      if (!record) {
        return res.status(404).json({
          success: false,
          message:
            "Security checklist record not found.",
        });
      }

      if (
        !checkStoreAccess(
          req,
          record
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to access this security checklist.",
        });
      }

      return res.status(200).json({
        success: true,
        record:
          formatRecord(
            record
          ),
      });
    } catch (error) {
      console.error(
        "Get Security Checklist Record Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load the security checklist.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| POST /api/security-checklists
|--------------------------------------------------------------------------
*/

export const createSecurityChecklistRecord =
  async (req, res) => {
    try {
      const businessDate =
        req.body?.businessDate;

      const shift =
        String(
          req.body?.shift ||
            ""
        ).trim();

      const restaurantManager =
        String(
          req.body
            ?.restaurantManager ||
            ""
        ).trim();

      const completedBy =
        String(
          req.body?.completedBy ||
            restaurantManager
        ).trim();

      const findingsAndActionPlans =
        String(
          req.body
            ?.findingsAndActionPlans ||
            ""
        ).trim();

      /*
      |--------------------------------------------------------------------------
      | Validate Basic Fields
      |--------------------------------------------------------------------------
      */

      if (!businessDate) {
        return res.status(400).json({
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
        return res.status(400).json({
          success: false,
          message:
            "Invalid business date.",
        });
      }

      if (
        !VALID_SHIFTS.includes(
          shift
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid shift is required.",
        });
      }

      if (!restaurantManager) {
        return res.status(400).json({
          success: false,
          message:
            "Restaurant Manager name is required.",
        });
      }

      if (!completedBy) {
        return res.status(400).json({
          success: false,
          message:
            "Completed By is required.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Resolve Store
      |--------------------------------------------------------------------------
      */

      let storeId = "";

      if (!isAdminAccount(req)) {
        storeId =
          getObjectIdString(
            req.user?.storeId
          );
      } else {
        storeId =
          getObjectIdString(
            req.body?.storeId
          );
      }

      if (
        !storeId ||
        !isValidObjectId(
          storeId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            isAdminAccount(req)
              ? "A valid storeId is required for administrator-created records."
              : "Your account is not linked to a valid store.",
        });
      }

      const store =
        await Store.findById(
          storeId
        );

      if (!store) {
        return res.status(404).json({
          success: false,
          message:
            "Store not found.",
        });
      }

      if (
        store.status !==
        "Active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This store is not active.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Normalize Answers
      |--------------------------------------------------------------------------
      */

      const responses =
        normalizeResponses(
          req.body?.answers
        );

      const results =
        calculateResults(
          responses
        );

      /*
      |--------------------------------------------------------------------------
      | Require All Questions
      |--------------------------------------------------------------------------
      |
      | Your frontend already blocks unanswered questions.
      | The backend enforces the same rule.
      |
      */

      if (
        results.unanswered > 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${results.unanswered} security question(s) are unanswered.`,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Require Action Plan For Every No
      |--------------------------------------------------------------------------
      */

      const missingActionPlans =
        findMissingActionPlans(
          responses
        );

      if (
        missingActionPlans.length >
        0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Every No answer must include an action plan.",

          questions:
            missingActionPlans.map(
              (item) => ({
                number:
                  item.number,
                questionId:
                  item.questionId,
                question:
                  item.question,
              })
            ),
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Create Record
      |--------------------------------------------------------------------------
      */

      const record =
        await SecurityChecklist.create(
          {
            storeId:
              store._id,

            storeNumber:
              store.storeNumber,

            storeName:
              store.storeName,

            formType:
              "Security Checklist",

            businessDate:
              parsedDate,

            shift,

            restaurantManager,

            completedBy,

            responses,

            totalQuestions:
              results.totalQuestions,

            answeredQuestions:
              results.answeredQuestions,

            passed:
              results.passed,

            failed:
              results.failed,

            unanswered:
              results.unanswered,

            completionPercentage:
              results.completionPercentage,

            score:
              results.score,

            complianceStatus:
              results.complianceStatus,

            failedItems:
              results.failedItems,

            findingsAndActionPlans,

            status:
              "Pending",

            createdByUid:
              req.firebaseUser?.uid ||
              req.user
                ?.firebaseUid ||
              "",

            createdByName:
              req.user
                ?.displayName ||
              req.firebaseUser
                ?.name ||
              "",

            createdByEmail:
              req.user?.email ||
              req.firebaseUser
                ?.email ||
              "",

            submittedAt:
              new Date(),
          }
        );

      return res.status(201).json({
        success: true,

        message:
          "Security checklist submitted successfully.",

        record:
          formatRecord(
            record
          ),
      });
    } catch (error) {
      console.error(
        "Create Security Checklist Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to create security checklist.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| PUT /api/security-checklists/:id
|--------------------------------------------------------------------------
*/

export const updateSecurityChecklistRecord =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid security checklist record ID.",
        });
      }

      const record =
        await SecurityChecklist.findById(
          id
        );

      if (!record) {
        return res.status(404).json({
          success: false,
          message:
            "Security checklist record not found.",
        });
      }

      if (
        !checkStoreAccess(
          req,
          record
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to update this security checklist.",
        });
      }

      const admin =
        isAdminAccount(req);

      /*
      |--------------------------------------------------------------------------
      | Basic Editable Fields
      |--------------------------------------------------------------------------
      */

      if (
        req.body
          ?.businessDate !==
        undefined
      ) {
        const date =
          new Date(
            req.body.businessDate
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid business date.",
          });
        }

        record.businessDate =
          date;
      }

      if (
        req.body?.shift !==
        undefined
      ) {
        const shift =
          String(
            req.body.shift
          ).trim();

        if (
          !VALID_SHIFTS.includes(
            shift
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid shift.",
          });
        }

        record.shift = shift;
      }

      if (
        req.body
          ?.restaurantManager !==
        undefined
      ) {
        const value =
          String(
            req.body
              .restaurantManager ||
              ""
          ).trim();

        if (!value) {
          return res.status(400).json({
            success: false,
            message:
              "Restaurant Manager name cannot be empty.",
          });
        }

        record.restaurantManager =
          value;
      }

      if (
        req.body?.completedBy !==
        undefined
      ) {
        const value =
          String(
            req.body
              .completedBy ||
              ""
          ).trim();

        if (!value) {
          return res.status(400).json({
            success: false,
            message:
              "Completed By cannot be empty.",
          });
        }

        record.completedBy =
          value;
      }

      if (
        req.body
          ?.findingsAndActionPlans !==
        undefined
      ) {
        record.findingsAndActionPlans =
          String(
            req.body
              .findingsAndActionPlans ||
              ""
          ).trim();
      }

      /*
      |--------------------------------------------------------------------------
      | Answers Update
      |--------------------------------------------------------------------------
      */

      if (
        req.body?.answers !==
        undefined
      ) {
        const responses =
          normalizeResponses(
            req.body.answers
          );

        const results =
          calculateResults(
            responses
          );

        if (
          results.unanswered >
          0
        ) {
          return res.status(400).json({
            success: false,
            message:
              `${results.unanswered} security question(s) are unanswered.`,
          });
        }

        const missingActionPlans =
          findMissingActionPlans(
            responses
          );

        if (
          missingActionPlans.length >
          0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Every No answer must include an action plan.",
          });
        }

        record.responses =
          responses;

        record.totalQuestions =
          results.totalQuestions;

        record.answeredQuestions =
          results.answeredQuestions;

        record.passed =
          results.passed;

        record.failed =
          results.failed;

        record.unanswered =
          results.unanswered;

        record.completionPercentage =
          results.completionPercentage;

        record.score =
          results.score;

        record.complianceStatus =
          results.complianceStatus;

        record.failedItems =
          results.failedItems;
      }

      /*
      |--------------------------------------------------------------------------
      | Admin Review
      |--------------------------------------------------------------------------
      */

      if (admin) {
        if (
          req.body
            ?.adminComment !==
          undefined
        ) {
          record.adminComment =
            String(
              req.body
                .adminComment ||
                ""
            ).trim();
        }

        if (
          req.body
            ?.failureReason !==
          undefined
        ) {
          record.failureReason =
            String(
              req.body
                .failureReason ||
                ""
            ).trim();
        }

        if (
          req.body?.status !==
          undefined
        ) {
          const nextStatus =
            String(
              req.body.status
            ).trim();

          if (
            !VALID_STATUSES.includes(
              nextStatus
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid security checklist status.",
            });
          }

          if (
            record.status ===
              "Completed" &&
            nextStatus !==
              "Completed"
          ) {
            return res.status(400).json({
              success: false,
              message:
                "A completed checklist cannot be moved back to another status.",
            });
          }

          record.status =
            nextStatus;

          if (
            nextStatus ===
              "Reviewed" ||
            nextStatus ===
              "Failed"
          ) {
            record.reviewedByUid =
              req.firebaseUser?.uid ||
              req.user
                ?.firebaseUid ||
              "";

            record.reviewedByName =
              req.user
                ?.displayName ||
              req.firebaseUser
                ?.name ||
              "Admin";

            record.reviewedAt =
              new Date();
          }

          if (
            nextStatus ===
            "Reviewed"
          ) {
            record.failureReason =
              "";
          }
        }
      } else {
        /*
        |--------------------------------------------------------------------------
        | Store Completion
        |--------------------------------------------------------------------------
        |
        | Only Reviewed → Completed
        |
        */

        if (
          req.body?.status !==
          undefined
        ) {
          const nextStatus =
            String(
              req.body.status
            ).trim();

          if (
            nextStatus !==
            "Completed"
          ) {
            return res.status(403).json({
              success: false,
              message:
                "Store accounts cannot change review status.",
            });
          }

          if (
            record.status !==
            "Reviewed"
          ) {
            return res.status(400).json({
              success: false,
              message:
                "This checklist must be reviewed before it can be completed.",
            });
          }

          record.status =
            "Completed";

          record.completedAt =
            new Date();

          record.completedByUid =
            req.firebaseUser?.uid ||
            req.user
              ?.firebaseUid ||
            "";

          record.completedByName =
            req.user
              ?.displayName ||
            req.firebaseUser
              ?.name ||
            "";
        }
      }

      await record.save();

      return res.status(200).json({
        success: true,

        message:
          "Security checklist updated successfully.",

        record:
          formatRecord(
            record
          ),
      });
    } catch (error) {
      console.error(
        "Update Security Checklist Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update security checklist.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE /api/security-checklists/:id
|--------------------------------------------------------------------------
*/

export const deleteSecurityChecklistRecord =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid security checklist record ID.",
        });
      }

      const record =
        await SecurityChecklist.findById(
          id
        );

      if (!record) {
        return res.status(404).json({
          success: false,
          message:
            "Security checklist record not found.",
        });
      }

      if (
        !checkStoreAccess(
          req,
          record
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to delete this security checklist.",
        });
      }

      await record.deleteOne();

      return res.status(200).json({
        success: true,
        message:
          "Security checklist deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Security Checklist Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete security checklist.",
      });
    }
  };