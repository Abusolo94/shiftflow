import mongoose from "mongoose";

import CashAudit from "../models/CashAudit.js";
import Store from "../models/Store.js";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const VALID_PERIODS = [
  "AM",
  "PM",
];

const VALID_STATUSES = [
  "Pending",
  "Reviewed",
  "Failed",
  "Completed",
];

const VALID_DENOMINATIONS = [
  500,
  200,
  100,
  50,
  20,
  10,
  5,
  1,
];

/*
|--------------------------------------------------------------------------
| Canonical Cash Procedure Questions
|--------------------------------------------------------------------------
|
| Do not trust question labels/numbers supplied by React.
|
| React should only send:
|
| {
|   questionId,
|   answer,
|   remarks,
|   actionPlan
| }
|
*/

const CASH_PROCEDURE_QUESTIONS = [
  {
    id: "employeeUsingWallets",
    number: 1,
    label:
      "Employees are not using wallets or mobile phones while working.",
  },

  {
    id: "managerCollectingWallets",
    number: 2,
    label:
      "Manager collects employee wallets and mobile phones.",
  },

  {
    id: "cashProcedureVerified",
    number: 3,
    label:
      "All counter employees are verified and have signed the cash procedure.",
  },

  {
    id: "lostAndFoundLogbook",
    number: 4,
    label:
      "Lost and Found logbook is available and has been updated.",
  },

  {
    id: "cashManagerKnowledge",
    number: 5,
    label:
      "Cash manager understands the cash policy and current promotions.",
  },

  {
    id: "noPendingIou",
    number: 6,
    label:
      "There is no pending IOU or CARE amount in the safe.",
  },

  {
    id: "depositAccordingToPolicy",
    number: 7,
    label:
      "Deposits are completed according to the cash policy with zero pending deposits.",
  },

  {
    id: "depositFinanceVerified",
    number: 8,
    label:
      "Deposits were verified against Finance updates where applicable.",
  },

  {
    id: "dropBoxVerified",
    number: 9,
    label:
      "Drop box and deposit slips were verified randomly.",
  },

  {
    id: "tredsAndRefundVerified",
    number: 10,
    label:
      "T-REDS and refund records were verified together with incident reports.",
  },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const cleanString = (
  value
) =>
  String(
    value ?? ""
  ).trim();

const getObjectIdString = (
  value
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (value?._id) {
    return String(
      value._id
    );
  }

  if (value?.id) {
    return String(
      value.id
    );
  }

  return String(value);
};

const isValidObjectId = (
  value
) =>
  mongoose.Types.ObjectId.isValid(
    getObjectIdString(
      value
    )
  );

const toSafeNumber = (
  value
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    ) ||
    number < 0
  ) {
    return 0;
  }

  return number;
};

const toSafeInteger = (
  value
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    ) ||
    number < 0
  ) {
    return 0;
  }

  return Math.floor(
    number
  );
};

const escapeRegex = (
  value = ""
) =>
  String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

const isAdminAccount = (
  user
) => {
  const role =
    cleanString(
      user?.role
    ).toLowerCase();

  const accountType =
    cleanString(
      user?.accountType
    ).toLowerCase();

  return (
    role === "admin" ||
    accountType ===
      "admin"
  );
};

/*
|--------------------------------------------------------------------------
| Store Access
|--------------------------------------------------------------------------
*/

const checkStoreAccess = (
  user,
  record
) => {
  if (
    isAdminAccount(user)
  ) {
    return true;
  }

  const userStoreId =
    getObjectIdString(
      user?.storeId
    );

  const recordStoreId =
    getObjectIdString(
      record?.storeId
    );

  return Boolean(
    userStoreId &&
      recordStoreId &&
      userStoreId ===
        recordStoreId
  );
};

/*
|--------------------------------------------------------------------------
| Resolve Store
|--------------------------------------------------------------------------
|
| STORE USER:
| store comes only from req.user.storeId
|
| ADMIN:
| storeId must be supplied explicitly when creating.
|
*/

const resolveStore = async (
  req
) => {
  let storeId = "";

  if (
    isAdminAccount(
      req.user
    )
  ) {
    storeId =
      getObjectIdString(
        req.body?.storeId
      );

    if (!storeId) {
      throw new Error(
        "Store ID is required when an administrator creates a Cash Audit."
      );
    }
  } else {
    storeId =
      getObjectIdString(
        req.user?.storeId
      );

    if (!storeId) {
      throw new Error(
        "Your account is not linked to a store."
      );
    }
  }

  if (
    !isValidObjectId(
      storeId
    )
  ) {
    throw new Error(
      "Invalid store assignment."
    );
  }

  const store =
    await Store.findById(
      storeId
    );

  if (!store) {
    throw new Error(
      "Store not found."
    );
  }

  if (
    store.status &&
    cleanString(
      store.status
    ).toLowerCase() !==
      "active"
  ) {
    throw new Error(
      "This store is not active."
    );
  }

  return store;
};

/*
|--------------------------------------------------------------------------
| Creator
|--------------------------------------------------------------------------
*/

const getCreatorInfo = (
  req
) => ({
  createdByUid:
    cleanString(
      req.firebaseUser?.uid ||
        req.user
          ?.firebaseUid ||
        req.user?.uid
    ),

  createdByName:
    cleanString(
      req.user
        ?.displayName ||
        req.user
          ?.fullName ||
        req.user?.name ||
        req.firebaseUser
          ?.name ||
        ""
    ),

  createdByEmail:
    cleanString(
      req.user?.email ||
        req.firebaseUser
          ?.email ||
        ""
    ).toLowerCase(),
});

/*
|--------------------------------------------------------------------------
| Reviewer
|--------------------------------------------------------------------------
*/

const getReviewerInfo = (
  req
) => ({
  reviewedByUid:
    cleanString(
      req.firebaseUser?.uid ||
        req.user
          ?.firebaseUid ||
        req.user?.uid
    ),

  reviewedByName:
    cleanString(
      req.user
        ?.displayName ||
        req.user
          ?.fullName ||
        req.user?.name ||
        req.firebaseUser
          ?.name ||
        ""
    ),

  reviewedAt:
    new Date(),
});

/*
|--------------------------------------------------------------------------
| Completion
|--------------------------------------------------------------------------
*/

const getCompletionInfo = (
  req
) => ({
  completedByUid:
    cleanString(
      req.firebaseUser?.uid ||
        req.user
          ?.firebaseUid ||
        req.user?.uid
    ),

  completedByName:
    cleanString(
      req.user
        ?.displayName ||
        req.user
          ?.fullName ||
        req.user?.name ||
        req.firebaseUser
          ?.name ||
        ""
    ),

  completedAt:
    new Date(),
});

/*
|--------------------------------------------------------------------------
| Normalize Denominations
|--------------------------------------------------------------------------
|
| Client sends only:
|
| [
|   { value: 500, quantity: 2 }
| ]
|
| Backend calculates totals.
|
*/

const normalizeDenominations = (
  denominations
) => {
  const quantities =
    new Map();

  if (
    Array.isArray(
      denominations
    )
  ) {
    denominations.forEach(
      (item) => {
        const value =
          Number(
            item?.value
          );

        if (
          !VALID_DENOMINATIONS.includes(
            value
          )
        ) {
          return;
        }

        quantities.set(
          value,
          toSafeInteger(
            item?.quantity
          )
        );
      }
    );
  }

  return VALID_DENOMINATIONS.map(
    (value) => {
      const quantity =
        quantities.get(
          value
        ) || 0;

      return {
        value,
        quantity,
        total:
          value *
          quantity,
      };
    }
  );
};

/*
|--------------------------------------------------------------------------
| Normalize Procedures
|--------------------------------------------------------------------------
|
| Supports:
|
| ARRAY:
|
| [
|   {
|     questionId: "...",
|     answer: "yes",
|     remarks: "",
|     actionPlan: ""
|   }
| ]
|
| and older object format:
|
| {
|   questionId: {
|     answer: "...",
|     remarks: "...",
|     actionPlan: "..."
|   }
| }
|
*/

const normalizeProcedures = (
  procedures
) => {
  const supplied =
    new Map();

  if (
    Array.isArray(
      procedures
    )
  ) {
    procedures.forEach(
      (item) => {
        const questionId =
          cleanString(
            item?.questionId ||
              item?.id
          );

        if (questionId) {
          supplied.set(
            questionId,
            item
          );
        }
      }
    );
  } else if (
    procedures &&
    typeof procedures ===
      "object"
  ) {
    Object.entries(
      procedures
    ).forEach(
      ([
        questionId,
        value,
      ]) => {
        supplied.set(
          questionId,
          value
        );
      }
    );
  }

  return CASH_PROCEDURE_QUESTIONS.map(
    (question) => {
      const item =
        supplied.get(
          question.id
        ) || {};

      const answer =
        cleanString(
          item?.answer
        ).toLowerCase();

      return {
        questionId:
          question.id,

        number:
          question.number,

        label:
          question.label,

        answer,

        remarks:
          cleanString(
            item?.remarks
          ),

        actionPlan:
          cleanString(
            item?.actionPlan
          ),

        passed:
          answer ===
          "yes",
      };
    }
  );
};

/*
|--------------------------------------------------------------------------
| Validate Procedures
|--------------------------------------------------------------------------
*/

const validateProcedures = (
  procedures
) => {
  const invalid =
    procedures.find(
      (item) =>
        ![
          "yes",
          "no",
        ].includes(
          item.answer
        )
    );

  if (invalid) {
    return {
      valid: false,

      message:
        `Cash procedure question ${invalid.number} must be answered Yes or No.`,
    };
  }

  const missingActionPlan =
    procedures.find(
      (item) =>
        item.answer ===
          "no" &&
        !item.actionPlan
    );

  if (
    missingActionPlan
  ) {
    return {
      valid: false,

      message:
        `Cash procedure question ${missingActionPlan.number} requires an action plan.`,
    };
  }

  return {
    valid: true,
  };
};

/*
|--------------------------------------------------------------------------
| Calculate Cash Totals
|--------------------------------------------------------------------------
*/

const calculateCashTotals = (
  data
) => {
  const denominations =
    normalizeDenominations(
      data?.denominations
    );

  const notesTotal =
    denominations.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.total,
      0
    );

  const coins =
    toSafeNumber(
      data?.coins
    );

  const cashSubtotal =
    notesTotal +
    coins;

  const setDrawer500 =
    toSafeNumber(
      data?.setDrawer500
    );

  const dollarRate =
    toSafeNumber(
      data?.dollarRate
    );

  const mcdelRate =
    toSafeNumber(
      data?.mcdelRate
    );

  const setDrawerTotal =
    setDrawer500 +
    dollarRate +
    mcdelRate;

  const pcvCash =
    toSafeNumber(
      data?.pcvCash
    );

  const pcvReceipts =
    toSafeNumber(
      data?.pcvReceipts
    );

  const pcvTotal =
    pcvCash +
    pcvReceipts;

  const mcdelCash =
    toSafeNumber(
      data?.mcdelCash
    );

  const mcdelReceipts =
    toSafeNumber(
      data?.mcdelReceipts
    );

  const mcdelTotal =
    mcdelCash +
    mcdelReceipts;

  const depositDay =
    toSafeNumber(
      data?.depositDay
    );

  const depositNight =
    toSafeNumber(
      data?.depositNight
    );

  const depositsTotal =
    depositDay +
    depositNight;

  const grandTotal =
    cashSubtotal +
    setDrawerTotal +
    pcvTotal +
    mcdelTotal +
    depositsTotal;

  return {
    denominations,

    notesTotal,

    coins,

    cashSubtotal,

    setDrawer500,
    dollarRate,
    mcdelRate,
    setDrawerTotal,

    pcvCash,
    pcvReceipts,
    pcvTotal,

    mcdelCash,
    mcdelReceipts,
    mcdelTotal,

    depositDay,
    depositNight,
    depositsTotal,

    grandTotal,
  };
};

/*
|--------------------------------------------------------------------------
| Calculate Procedure Statistics
|--------------------------------------------------------------------------
*/

const calculateProcedureStats = (
  procedures
) => {
  const procedurePassed =
    procedures.filter(
      (item) =>
        item.answer ===
        "yes"
    ).length;

  const procedureFailed =
    procedures.filter(
      (item) =>
        item.answer ===
        "no"
    ).length;

  const procedureAnswered =
    procedurePassed +
    procedureFailed;

  const procedureUnanswered =
    CASH_PROCEDURE_QUESTIONS.length -
    procedureAnswered;

  const failedProcedures =
    procedures.filter(
      (item) =>
        item.answer ===
        "no"
    );

  const procedureScore =
    CASH_PROCEDURE_QUESTIONS.length
      ? Math.round(
          (
            procedurePassed /
            CASH_PROCEDURE_QUESTIONS.length
          ) * 100
        )
      : 0;

  return {
    procedurePassed,
    procedureFailed,
    procedureAnswered,
    procedureUnanswered,
    procedureScore,
    failedProcedures,
  };
};

/*
|--------------------------------------------------------------------------
| Format Record
|--------------------------------------------------------------------------
*/

const formatRecord = (
  record
) => {
  if (!record) {
    return null;
  }

  const object =
    typeof record.toObject ===
    "function"
      ? record.toObject()
      : record;

  return {
    ...object,

    id:
      String(
        object._id
      ),

    _id:
      String(
        object._id
      ),

    storeId:
      getObjectIdString(
        object.storeId
      ),
  };
};

/*
|--------------------------------------------------------------------------
| Get Cash Audits
|--------------------------------------------------------------------------
*/

export const getCashAudits =
  async (
    req,
    res
  ) => {
    try {
      const {
        storeId,
        storeNumber,
        status,
        period,
        businessDate,
        search,
        page = 1,
        limit = 50,
      } = req.query;

      const filter = {};

      /*
      |--------------------------------------------------------------------------
      | Store Security
      |--------------------------------------------------------------------------
      */

      if (
        isAdminAccount(
          req.user
        )
      ) {
        if (storeId) {
          if (
            !isValidObjectId(
              storeId
            )
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,

                message:
                  "Invalid store ID.",
              });
          }

          filter.storeId =
            new mongoose.Types.ObjectId(
              storeId
            );
        }

        if (
          storeNumber
        ) {
          filter.storeNumber =
            cleanString(
              storeNumber
            );
        }
      } else {
        const userStoreId =
          getObjectIdString(
            req.user
              ?.storeId
          );

        if (
          !userStoreId ||
          !isValidObjectId(
            userStoreId
          )
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "Your account is not linked to a valid store.",
            });
        }

        filter.storeId =
          new mongoose.Types.ObjectId(
            userStoreId
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Status
      |--------------------------------------------------------------------------
      */

      if (status) {
        if (
          !VALID_STATUSES.includes(
            status
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid Cash Audit status.",
            });
        }

        filter.status =
          status;
      }

      /*
      |--------------------------------------------------------------------------
      | Period
      |--------------------------------------------------------------------------
      */

      if (period) {
        const normalizedPeriod =
          cleanString(
            period
          ).toUpperCase();

        if (
          !VALID_PERIODS.includes(
            normalizedPeriod
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid audit period.",
            });
        }

        filter.period =
          normalizedPeriod;
      }

      /*
      |--------------------------------------------------------------------------
      | Business Date
      |--------------------------------------------------------------------------
      */

      if (
        businessDate
      ) {
        const start =
          new Date(
            `${businessDate}T00:00:00.000Z`
          );

        const end =
          new Date(
            `${businessDate}T23:59:59.999Z`
          );

        if (
          Number.isNaN(
            start.getTime()
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid business date.",
            });
        }

        filter.businessDate =
          {
            $gte: start,
            $lte: end,
          };
      }

      /*
      |--------------------------------------------------------------------------
      | Search
      |--------------------------------------------------------------------------
      */

      if (
        search &&
        cleanString(
          search
        )
      ) {
        const regex =
          new RegExp(
            escapeRegex(
              cleanString(
                search
              )
            ),
            "i"
          );

        filter.$or = [
          {
            storeName:
              regex,
          },

          {
            storeNumber:
              regex,
          },

          {
            preparedBy:
              regex,
          },

          {
            verifiedBy:
              regex,
          },

          {
            receivedBy:
              regex,
          },

          {
            auditComments:
              regex,
          },
        ];
      }

      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const currentPage =
        Math.max(
          Number(page) ||
            1,
          1
        );

      const pageLimit =
        Math.min(
          Math.max(
            Number(limit) ||
              50,
            1
          ),
          200
        );

      const skip =
        (
          currentPage -
          1
        ) *
        pageLimit;

      /*
      |--------------------------------------------------------------------------
      | Query
      |--------------------------------------------------------------------------
      */

      const [
        records,
        total,
      ] =
        await Promise.all([
          CashAudit.find(
            filter
          )
            .sort({
              businessDate:
                -1,
              createdAt:
                -1,
            })
            .skip(skip)
            .limit(
              pageLimit
            ),

          CashAudit.countDocuments(
            filter
          ),
        ]);

      return res
        .status(200)
        .json({
          success:
            true,

          records:
            records.map(
              formatRecord
            ),

          pagination: {
            page:
              currentPage,

            limit:
              pageLimit,

            total,

            pages:
              Math.ceil(
                total /
                  pageLimit
              ),
          },
        });
    } catch (error) {
      console.error(
        "Get Cash Audits Error:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Could not fetch Cash Audit records.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| Get Single Cash Audit
|--------------------------------------------------------------------------
*/

export const getCashAudit =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid Cash Audit ID.",
          });
      }

      const record =
        await CashAudit.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Cash Audit record not found.",
          });
      }

      if (
        !checkStoreAccess(
          req.user,
          record
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "You do not have permission to view this Cash Audit.",
          });
      }

      return res
        .status(200)
        .json({
          success:
            true,

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Get Cash Audit Error:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Could not fetch Cash Audit record.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| Create Cash Audit
|--------------------------------------------------------------------------
*/

export const createCashAudit =
  async (
    req,
    res
  ) => {
    try {
      const {
        businessDate,
        auditTime,
        period,

        preparedBy,
        verifiedBy,
        receivedBy,

        employeeMealsVerified,
        promoCouponVerified,

        auditComments,

        procedures,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Validate Core Fields
      |--------------------------------------------------------------------------
      */

      if (!businessDate) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Business date is required.",
          });
      }

      const parsedDate =
        new Date(
          `${businessDate}T00:00:00.000Z`
        );

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid business date.",
          });
      }

      const normalizedPeriod =
        cleanString(
          period
        ).toUpperCase();

      if (
        !VALID_PERIODS.includes(
          normalizedPeriod
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Audit period must be AM or PM.",
          });
      }

      const prepared =
        cleanString(
          preparedBy
        );

      const verified =
        cleanString(
          verifiedBy
        );

      const received =
        cleanString(
          receivedBy
        );

      if (!prepared) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Prepared By is required.",
          });
      }

      if (!verified) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Verified By is required.",
          });
      }

      if (!received) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Received By is required.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Store
      |--------------------------------------------------------------------------
      */

      const store =
        await resolveStore(
          req
        );

      /*
      |--------------------------------------------------------------------------
      | Procedures
      |--------------------------------------------------------------------------
      */

      const normalizedProcedures =
        normalizeProcedures(
          procedures
        );

      const procedureValidation =
        validateProcedures(
          normalizedProcedures
        );

      if (
        !procedureValidation.valid
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              procedureValidation.message,
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Server Calculations
      |--------------------------------------------------------------------------
      */

      const cash =
        calculateCashTotals(
          req.body
        );

      const procedureStats =
        calculateProcedureStats(
          normalizedProcedures
        );

      const creator =
        getCreatorInfo(
          req
        );

      /*
      |--------------------------------------------------------------------------
      | Create
      |--------------------------------------------------------------------------
      */

      const record =
        await CashAudit.create(
          {
            /*
            |--------------------------------------------------------------------------
            | Store Identity
            |--------------------------------------------------------------------------
            */

            storeId:
              store._id,

            storeNumber:
              cleanString(
                store.storeNumber
              ),

            storeName:
              cleanString(
                store.storeName
              ),

            /*
            |--------------------------------------------------------------------------
            | Audit
            |--------------------------------------------------------------------------
            */

            formType:
              "Cash Audit",

            businessDate:
              parsedDate,

            auditTime:
              cleanString(
                auditTime
              ),

            period:
              normalizedPeriod,

            /*
            |--------------------------------------------------------------------------
            | Cash
            |--------------------------------------------------------------------------
            */

            ...cash,

            /*
            |--------------------------------------------------------------------------
            | Personnel
            |--------------------------------------------------------------------------
            */

            preparedBy:
              prepared,

            verifiedBy:
              verified,

            receivedBy:
              received,

            /*
            |--------------------------------------------------------------------------
            | Additional Verification
            |--------------------------------------------------------------------------
            */

            employeeMealsVerified:
              cleanString(
                employeeMealsVerified
              ),

            promoCouponVerified:
              cleanString(
                promoCouponVerified
              ),

            /*
            |--------------------------------------------------------------------------
            | Procedures
            |--------------------------------------------------------------------------
            */

            procedures:
              normalizedProcedures,

            ...procedureStats,

            /*
            |--------------------------------------------------------------------------
            | Comments
            |--------------------------------------------------------------------------
            */

            auditComments:
              cleanString(
                auditComments
              ),

            /*
            |--------------------------------------------------------------------------
            | Workflow
            |--------------------------------------------------------------------------
            */

            status:
              "Pending",

            submittedAt:
              new Date(),

            /*
            |--------------------------------------------------------------------------
            | Creator
            |--------------------------------------------------------------------------
            */

            ...creator,
          }
        );

      return res
        .status(201)
        .json({
          success:
            true,

          message:
            "Cash Audit submitted successfully.",

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Create Cash Audit Error:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error?.message ||
            "Could not create Cash Audit.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| Update Cash Audit
|--------------------------------------------------------------------------
*/

export const updateCashAudit =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid Cash Audit ID.",
          });
      }

      const record =
        await CashAudit.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Cash Audit record not found.",
          });
      }

      if (
        !checkStoreAccess(
          req.user,
          record
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "You do not have permission to update this Cash Audit.",
          });
      }

      const admin =
        isAdminAccount(
          req.user
        );

      /*
      |--------------------------------------------------------------------------
      | Completed = Locked
      |--------------------------------------------------------------------------
      */

      if (
        record.status ===
        "Completed" &&
        !admin
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Completed Cash Audits cannot be edited.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Operational Fields
      |--------------------------------------------------------------------------
      |
      | Store may edit while Pending.
      | Admin may also correct Pending audit data.
      |
      */

      const canEditAudit =
        admin ||
        record.status ===
          "Pending";

      if (canEditAudit) {
        if (
          req.body
            ?.businessDate
        ) {
          const parsedDate =
            new Date(
              `${req.body.businessDate}T00:00:00.000Z`
            );

          if (
            Number.isNaN(
              parsedDate.getTime()
            )
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,

                message:
                  "Invalid business date.",
              });
          }

          record.businessDate =
            parsedDate;
        }

        if (
          req.body?.auditTime !==
          undefined
        ) {
          record.auditTime =
            cleanString(
              req.body
                .auditTime
            );
        }

        if (
          req.body?.period !==
          undefined
        ) {
          const period =
            cleanString(
              req.body.period
            ).toUpperCase();

          if (
            !VALID_PERIODS.includes(
              period
            )
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,

                message:
                  "Audit period must be AM or PM.",
              });
          }

          record.period =
            period;
        }

        const personFields =
          [
            "preparedBy",
            "verifiedBy",
            "receivedBy",
          ];

        for (
          const field of
          personFields
        ) {
          if (
            req.body?.[
              field
            ] !== undefined
          ) {
            const value =
              cleanString(
                req.body[
                  field
                ]
              );

            if (!value) {
              return res
                .status(400)
                .json({
                  success:
                    false,

                  message:
                    `${field} cannot be empty.`,
                });
            }

            record[
              field
            ] = value;
          }
        }

        if (
          req.body
            ?.employeeMealsVerified !==
          undefined
        ) {
          record.employeeMealsVerified =
            cleanString(
              req.body
                .employeeMealsVerified
            );
        }

        if (
          req.body
            ?.promoCouponVerified !==
          undefined
        ) {
          record.promoCouponVerified =
            cleanString(
              req.body
                .promoCouponVerified
            );
        }

        if (
          req.body
            ?.auditComments !==
          undefined
        ) {
          record.auditComments =
            cleanString(
              req.body
                .auditComments
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Cash Recalculation
        |--------------------------------------------------------------------------
        */

        const cashFields = [
          "denominations",
          "coins",
          "setDrawer500",
          "dollarRate",
          "mcdelRate",
          "pcvCash",
          "pcvReceipts",
          "mcdelCash",
          "mcdelReceipts",
          "depositDay",
          "depositNight",
        ];

        const hasCashChange =
          cashFields.some(
            (field) =>
              req.body?.[
                field
              ] !==
              undefined
          );

        if (
          hasCashChange
        ) {
          const cash =
            calculateCashTotals(
              {
                denominations:
                  req.body
                    ?.denominations ??
                  record.denominations,

                coins:
                  req.body
                    ?.coins ??
                  record.coins,

                setDrawer500:
                  req.body
                    ?.setDrawer500 ??
                  record.setDrawer500,

                dollarRate:
                  req.body
                    ?.dollarRate ??
                  record.dollarRate,

                mcdelRate:
                  req.body
                    ?.mcdelRate ??
                  record.mcdelRate,

                pcvCash:
                  req.body
                    ?.pcvCash ??
                  record.pcvCash,

                pcvReceipts:
                  req.body
                    ?.pcvReceipts ??
                  record.pcvReceipts,

                mcdelCash:
                  req.body
                    ?.mcdelCash ??
                  record.mcdelCash,

                mcdelReceipts:
                  req.body
                    ?.mcdelReceipts ??
                  record.mcdelReceipts,

                depositDay:
                  req.body
                    ?.depositDay ??
                  record.depositDay,

                depositNight:
                  req.body
                    ?.depositNight ??
                  record.depositNight,
              }
            );

          Object.assign(
            record,
            cash
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Procedure Recalculation
        |--------------------------------------------------------------------------
        */

        if (
          req.body
            ?.procedures !==
          undefined
        ) {
          const normalizedProcedures =
            normalizeProcedures(
              req.body
                .procedures
            );

          const validation =
            validateProcedures(
              normalizedProcedures
            );

          if (
            !validation.valid
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,

                message:
                  validation.message,
              });
          }

          const stats =
            calculateProcedureStats(
              normalizedProcedures
            );

          record.procedures =
            normalizedProcedures;

          record.procedurePassed =
            stats.procedurePassed;

          record.procedureFailed =
            stats.procedureFailed;

          record.procedureAnswered =
            stats.procedureAnswered;

          record.procedureUnanswered =
            stats.procedureUnanswered;

          record.procedureScore =
            stats.procedureScore;

          record.failedProcedures =
            stats.failedProcedures;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Workflow Status
      |--------------------------------------------------------------------------
      */

      if (
        req.body?.status
      ) {
        const requestedStatus =
          cleanString(
            req.body.status
          );

        if (
          !VALID_STATUSES.includes(
            requestedStatus
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid Cash Audit status.",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | ADMIN
        |--------------------------------------------------------------------------
        */

        if (admin) {
          if (
            requestedStatus ===
            "Completed"
          ) {
            return res
              .status(403)
              .json({
                success:
                  false,

                message:
                  "Administrators cannot mark Cash Audits as Completed.",
              });
          }

          if (
            record.status ===
            "Completed"
          ) {
            return res
              .status(403)
              .json({
                success:
                  false,

                message:
                  "Completed Cash Audits cannot move backward.",
              });
          }

          if (
            requestedStatus ===
            "Failed"
          ) {
            const failureReason =
              cleanString(
                req.body
                  ?.failureReason
              );

            if (
              !failureReason
            ) {
              return res
                .status(400)
                .json({
                  success:
                    false,

                  message:
                    "Failure reason is required.",
                });
            }

            record.failureReason =
              failureReason;
          }

          if (
            requestedStatus ===
            "Reviewed"
          ) {
            record.failureReason =
              "";
          }

          if (
            [
              "Reviewed",
              "Failed",
            ].includes(
              requestedStatus
            )
          ) {
            Object.assign(
              record,
              getReviewerInfo(
                req
              )
            );
          }

          record.adminComment =
            cleanString(
              req.body
                ?.adminComment ??
                record
                  .adminComment
            );

          record.status =
            requestedStatus;
        } else {
          /*
          |--------------------------------------------------------------------------
          | STORE
          |--------------------------------------------------------------------------
          */

          if (
            requestedStatus !==
            "Completed"
          ) {
            return res
              .status(403)
              .json({
                success:
                  false,

                message:
                  "Store accounts cannot change Cash Audit review status.",
              });
          }

          if (
            record.status !==
            "Reviewed"
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,

                message:
                  "Only a Reviewed Cash Audit can be completed.",
              });
          }

          record.status =
            "Completed";

          Object.assign(
            record,
            getCompletionInfo(
              req
            )
          );
        }
      }

      await record.save();

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Cash Audit updated successfully.",

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Update Cash Audit Error:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            error?.message ||
            "Could not update Cash Audit.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| Delete Cash Audit
|--------------------------------------------------------------------------
*/

export const deleteCashAudit =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid Cash Audit ID.",
          });
      }

      const record =
        await CashAudit.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Cash Audit record not found.",
          });
      }

      if (
        !checkStoreAccess(
          req.user,
          record
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "You do not have permission to delete this Cash Audit.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Store cannot delete Completed audit
      |--------------------------------------------------------------------------
      */

      if (
        !isAdminAccount(
          req.user
        ) &&
        record.status ===
          "Completed"
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Completed Cash Audits cannot be deleted by store accounts.",
          });
      }

      await record.deleteOne();

      return res
        .status(200)
        .json({
          success:
            true,

          message:
            "Cash Audit deleted successfully.",
        });
    } catch (error) {
      console.error(
        "Delete Cash Audit Error:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Could not delete Cash Audit.",
        });
    }
  };