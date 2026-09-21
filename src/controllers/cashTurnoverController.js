import mongoose from "mongoose";

import CashTurnover from "../models/CashTurnover.js";
import Store from "../models/Store.js";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const VALID_SHIFTS = [
  "OP",
  "MID",
  "CL",
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
| Basic Helpers
|--------------------------------------------------------------------------
*/

const cleanString = (value) =>
  String(value || "").trim();

const getObjectIdString = (value) => {
  if (!value) {
    return "";
  }

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
  mongoose.Types.ObjectId.isValid(
    getObjectIdString(value)
  );

const toSafeNumber = (value) => {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return 0;
  }

  return parsed;
};

const toSafeInteger = (value) => {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return 0;
  }

  return Math.floor(parsed);
};

/*
|--------------------------------------------------------------------------
| Escape Search Regex
|--------------------------------------------------------------------------
*/

const escapeRegex = (value) =>
  cleanString(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

/*
|--------------------------------------------------------------------------
| Account Helpers
|--------------------------------------------------------------------------
*/

const isAdminAccount = (req) => {
  const role =
    cleanString(
      req?.user?.role
    ).toLowerCase();

  const accountType =
    cleanString(
      req?.user?.accountType
    ).toLowerCase();

  return (
    role === "admin" ||
    accountType === "admin"
  );
};

const checkStoreAccess = (
  req,
  recordStoreId
) => {
  if (isAdminAccount(req)) {
    return true;
  }

  const userStoreId =
    getObjectIdString(
      req?.user?.storeId
    );

  const targetStoreId =
    getObjectIdString(
      recordStoreId
    );

  if (
    !userStoreId ||
    !targetStoreId
  ) {
    return false;
  }

  return (
    userStoreId ===
    targetStoreId
  );
};

/*
|--------------------------------------------------------------------------
| Normalize Denominations
|--------------------------------------------------------------------------
|
| React only needs to send:
|
| {
|   value: 500,
|   quantity: 2
| }
|
| Node calculates total.
|
|--------------------------------------------------------------------------
*/

const normalizeDenominations = (
  denominations
) => {
  const source =
    Array.isArray(
      denominations
    )
      ? denominations
      : [];

  /*
  |--------------------------------------------------------------------------
  | Build a quantity map
  |--------------------------------------------------------------------------
  */

  const quantityMap =
    new Map();

  for (const item of source) {
    const value =
      Number(
        item?.value
      );

    if (
      !VALID_DENOMINATIONS.includes(
        value
      )
    ) {
      continue;
    }

    quantityMap.set(
      value,
      toSafeInteger(
        item?.quantity
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Always store the canonical denomination list
  |--------------------------------------------------------------------------
  */

  return VALID_DENOMINATIONS.map(
    (value) => {
      const quantity =
        quantityMap.get(
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
| Calculate Totals
|--------------------------------------------------------------------------
|
| Frontend totals are display-only.
| These server calculations are authoritative.
|
|--------------------------------------------------------------------------
*/

const calculateTotals = ({
  denominations = [],

  pcvCash = 0,
  pcvInvoices = 0,

  swipeCard = 0,
  mdsKey = 0,
  refund = 0,
  deposits = 0,
  receipt = 0,
  others = 0,

  expectedCash = 0,
}) => {
  const normalizedDenominations =
    normalizeDenominations(
      denominations
    );

  const safePcvCash =
    toSafeNumber(
      pcvCash
    );

  const safePcvInvoices =
    toSafeNumber(
      pcvInvoices
    );

  const safeSwipeCard =
    toSafeNumber(
      swipeCard
    );

  const safeMdsKey =
    toSafeNumber(
      mdsKey
    );

  const safeRefund =
    toSafeNumber(
      refund
    );

  const safeDeposits =
    toSafeNumber(
      deposits
    );

  const safeReceipt =
    toSafeNumber(
      receipt
    );

  const safeOthers =
    toSafeNumber(
      others
    );

  const cashTotal =
    normalizedDenominations.reduce(
      (sum, item) =>
        sum +
        Number(
          item.total || 0
        ),
      0
    );

  const pcvTotal =
    safePcvCash +
    safePcvInvoices;

  const otherTotal =
    safeSwipeCard +
    safeMdsKey +
    safeRefund +
    safeDeposits +
    safeReceipt +
    safeOthers;

  const grandTotal =
    cashTotal +
    pcvTotal +
    otherTotal;

  /*
  |--------------------------------------------------------------------------
  | Current Cash Turnover form has no expected-cash input.
  |--------------------------------------------------------------------------
  |
  | Until a separate trusted expected cash source is added,
  | expectedCash remains 0.
  |
  */

  const safeExpectedCash =
    toSafeNumber(
      expectedCash
    );

  const actualCash =
    grandTotal;

  const variance =
    actualCash -
    safeExpectedCash;

  return {
    denominations:
      normalizedDenominations,

    pcvCash:
      safePcvCash,

    pcvInvoices:
      safePcvInvoices,

    swipeCard:
      safeSwipeCard,

    mdsKey:
      safeMdsKey,

    refund:
      safeRefund,

    deposits:
      safeDeposits,

    receipt:
      safeReceipt,

    others:
      safeOthers,

    cashTotal,
    pcvTotal,
    otherTotal,
    grandTotal,

    actualCash,

    expectedCash:
      safeExpectedCash,

    variance,
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

  const obj =
    typeof record.toObject ===
    "function"
      ? record.toObject()
      : record;

  return {
    ...obj,

    id:
      String(
        obj?._id || ""
      ),

    _id:
      String(
        obj?._id || ""
      ),

    storeId:
      getObjectIdString(
        obj?.storeId
      ),
  };
};

/*
|--------------------------------------------------------------------------
| Resolve Store
|--------------------------------------------------------------------------
|
| Store user:
| req.user.storeId
|
| Admin:
| req.body.storeId
|
|--------------------------------------------------------------------------
*/

const resolveStore =
  async (req) => {
    let storeId = "";

    if (isAdminAccount(req)) {
      storeId =
        getObjectIdString(
          req.body?.storeId
        );

      if (!storeId) {
        throw new Error(
          "Store is required for administrator-created Cash Turnover records."
        );
      }
    } else {
      storeId =
        getObjectIdString(
          req?.user?.storeId
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
        "Invalid store ID."
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

    const status =
      cleanString(
        store?.status
      ).toLowerCase();

    if (
      status &&
      status !== "active"
    ) {
      throw new Error(
        "This store is not active."
      );
    }

    return store;
  };

/*
|--------------------------------------------------------------------------
| Creator Information
|--------------------------------------------------------------------------
*/

const getCreatorInfo = (
  req
) => {
  const uid =
    cleanString(
      req?.firebaseUser?.uid ||
        req?.user?.firebaseUid ||
        req?.user?.uid
    );

  const name =
    cleanString(
      req?.user?.displayName ||
        req?.user?.fullName ||
        req?.user?.name ||
        req?.firebaseUser?.name ||
        ""
    );

  const email =
    cleanString(
      req?.user?.email ||
        req?.firebaseUser?.email ||
        ""
    ).toLowerCase();

  return {
    createdByUid: uid,
    createdByName:
      name,
    createdByEmail:
      email,
  };
};

/*
|--------------------------------------------------------------------------
| Reviewer Information
|--------------------------------------------------------------------------
*/

const getReviewerInfo = (
  req
) => {
  return {
    reviewedByUid:
      cleanString(
        req?.firebaseUser?.uid ||
          req?.user?.firebaseUid ||
          req?.user?.uid
      ),

    reviewedByName:
      cleanString(
        req?.user?.displayName ||
          req?.user?.fullName ||
          req?.user?.name ||
          req?.firebaseUser?.name ||
          ""
      ),

    reviewedAt:
      new Date(),
  };
};

/*
|--------------------------------------------------------------------------
| Completion Information
|--------------------------------------------------------------------------
*/

const getCompletionInfo = (
  req
) => {
  return {
    completedByUid:
      cleanString(
        req?.firebaseUser?.uid ||
          req?.user?.firebaseUid ||
          req?.user?.uid
      ),

    completedByName:
      cleanString(
        req?.user?.displayName ||
          req?.user?.fullName ||
          req?.user?.name ||
          req?.firebaseUser?.name ||
          ""
      ),

    completedAt:
      new Date(),
  };
};

/*
|--------------------------------------------------------------------------
| GET ALL CASH TURNOVERS
|--------------------------------------------------------------------------
|
| GET /api/cash-turnovers
|
|--------------------------------------------------------------------------
*/

export const getCashTurnovers =
  async (req, res) => {
    try {
      const {
        storeId,
        storeNumber,
        status,
        shift,
        businessDate,
        search,

        page = 1,
        limit = 50,
      } = req.query;

      const filter = {};

      /*
      |--------------------------------------------------------------------------
      | Store Scoping
      |--------------------------------------------------------------------------
      */

      if (
        isAdminAccount(req)
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
            storeId;
        }

        if (
          cleanString(
            storeNumber
          )
        ) {
          filter.storeNumber =
            cleanString(
              storeNumber
            );
        }
      } else {
        const userStoreId =
          getObjectIdString(
            req?.user?.storeId
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
              success: false,
              message:
                "Your account is not linked to a valid store.",
            });
        }

        filter.storeId =
          userStoreId;
      }

      /*
      |--------------------------------------------------------------------------
      | Status
      |--------------------------------------------------------------------------
      */

      if (
        status &&
        VALID_STATUSES.includes(
          status
        )
      ) {
        filter.status =
          status;
      }

      /*
      |--------------------------------------------------------------------------
      | Shift
      |--------------------------------------------------------------------------
      */

      if (
        shift &&
        VALID_SHIFTS.includes(
          shift
        )
      ) {
        filter.shift =
          shift;
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
          !Number.isNaN(
            start.getTime()
          )
        ) {
          filter.businessDate =
            {
              $gte: start,
              $lte: end,
            };
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Search
      |--------------------------------------------------------------------------
      */

      const searchValue =
        escapeRegex(
          search
        );

      if (
        searchValue
      ) {
        const regex =
          new RegExp(
            searchValue,
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
            managerName:
              regex,
          },
          {
            preparedBy:
              regex,
          },
          {
            receivedBy:
              regex,
          },
          {
            verifiedBy:
              regex,
          },
          {
            remarks:
              regex,
          },
        ];
      }

      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const pageNumber =
        Math.max(
          1,
          Number(page) ||
            1
        );

      const limitNumber =
        Math.min(
          200,
          Math.max(
            1,
            Number(limit) ||
              50
          )
        );

      const skip =
        (pageNumber - 1) *
        limitNumber;

      const [
        records,
        total,
      ] =
        await Promise.all([
          CashTurnover.find(
            filter
          )
            .sort({
              businessDate:
                -1,
              createdAt: -1,
            })
            .skip(skip)
            .limit(
              limitNumber
            ),

          CashTurnover.countDocuments(
            filter
          ),
        ]);

      return res
        .status(200)
        .json({
          success: true,

          records:
            records.map(
              formatRecord
            ),

          pagination: {
            page:
              pageNumber,

            limit:
              limitNumber,

            total,

            pages:
              Math.ceil(
                total /
                  limitNumber
              ),
          },
        });
    } catch (error) {
      console.error(
        "Get Cash Turnovers Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Could not load Cash Turnover records.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| GET SINGLE CASH TURNOVER
|--------------------------------------------------------------------------
|
| GET /api/cash-turnovers/:id
|
|--------------------------------------------------------------------------
*/

export const getCashTurnover =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid Cash Turnover ID.",
          });
      }

      const record =
        await CashTurnover.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Cash Turnover record not found.",
          });
      }

      if (
        !checkStoreAccess(
          req,
          record.storeId
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "You do not have permission to view this Cash Turnover record.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Get Cash Turnover Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Could not load Cash Turnover record.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| CREATE CASH TURNOVER
|--------------------------------------------------------------------------
|
| POST /api/cash-turnovers
|
|--------------------------------------------------------------------------
*/

export const createCashTurnover =
  async (req, res) => {
    try {
      const {
        businessDate,
        shift,

        preparedBy,
        receivedBy,
        verifiedBy,

        denominations,

        pcvCash,
        pcvInvoices,

        swipeCard,
        mdsKey,
        refund,
        deposits,
        receipt,
        others,

        remarks,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Validate Business Date
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | Validate Shift
      |--------------------------------------------------------------------------
      */

      if (
        !VALID_SHIFTS.includes(
          shift
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Shift must be OP, MID, or CL.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Validate People
      |--------------------------------------------------------------------------
      */

      const safePreparedBy =
        cleanString(
          preparedBy
        );

      const safeReceivedBy =
        cleanString(
          receivedBy
        );

      const safeVerifiedBy =
        cleanString(
          verifiedBy
        );

      if (
        !safePreparedBy
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Prepared By is required.",
          });
      }

      if (
        !safeReceivedBy
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Received By is required.",
          });
      }

      if (
        !safeVerifiedBy
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Verified By SM is required.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Resolve Authenticated Store
      |--------------------------------------------------------------------------
      */

      const store =
        await resolveStore(
          req
        );

      /*
      |--------------------------------------------------------------------------
      | Server Calculations
      |--------------------------------------------------------------------------
      */

      const totals =
        calculateTotals({
          denominations,

          pcvCash,
          pcvInvoices,

          swipeCard,
          mdsKey,
          refund,
          deposits,
          receipt,
          others,

          expectedCash:
            0,
        });

      /*
      |--------------------------------------------------------------------------
      | Creator
      |--------------------------------------------------------------------------
      */

      const creator =
        getCreatorInfo(
          req
        );

      if (
        !creator.createdByUid
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Authenticated user ID is missing.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Create Record
      |--------------------------------------------------------------------------
      */

      const record =
        await CashTurnover.create(
          {
            /*
            |--------------------------------------------------------------------------
            | Server-Derived Store
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
            | Submitted Data
            |--------------------------------------------------------------------------
            */

            businessDate:
              parsedDate,

            shift,

            managerName:
              safeVerifiedBy,

            preparedBy:
              safePreparedBy,

            receivedBy:
              safeReceivedBy,

            verifiedBy:
              safeVerifiedBy,

            remarks:
              cleanString(
                remarks
              ),

            /*
            |--------------------------------------------------------------------------
            | Server-Calculated Cash Data
            |--------------------------------------------------------------------------
            */

            ...totals,

            /*
            |--------------------------------------------------------------------------
            | Workflow
            |--------------------------------------------------------------------------
            */

            status:
              "Pending",

            /*
            |--------------------------------------------------------------------------
            | Creator
            |--------------------------------------------------------------------------
            */

            ...creator,

            submittedAt:
              new Date(),
          }
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Cash Turnover created successfully.",

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Create Cash Turnover Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error?.message ||
            "Could not create Cash Turnover record.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE CASH TURNOVER
|--------------------------------------------------------------------------
|
| PUT /api/cash-turnovers/:id
|
|--------------------------------------------------------------------------
*/

export const updateCashTurnover =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid Cash Turnover ID.",
          });
      }

      const record =
        await CashTurnover.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Cash Turnover record not found.",
          });
      }

      if (
        !checkStoreAccess(
          req,
          record.storeId
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "You do not have permission to update this Cash Turnover record.",
          });
      }

      const admin =
        isAdminAccount(
          req
        );

      /*
      |--------------------------------------------------------------------------
      | Store Editing Rules
      |--------------------------------------------------------------------------
      */

      if (
        !admin &&
        record.status ===
          "Completed"
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Completed Cash Turnover records cannot be edited.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Editable Cash Data
      |--------------------------------------------------------------------------
      |
      | Store users can edit submitted cash data only while Pending.
      |
      */

      const isPending =
        record.status ===
        "Pending";

      if (
        admin ||
        isPending
      ) {
        if (
          req.body.businessDate !==
          undefined
        ) {
          const parsedDate =
            new Date(
              req.body
                .businessDate
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
          req.body.shift !==
          undefined
        ) {
          if (
            !VALID_SHIFTS.includes(
              req.body.shift
            )
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,
                message:
                  "Shift must be OP, MID, or CL.",
              });
          }

          record.shift =
            req.body.shift;
        }

        if (
          req.body.preparedBy !==
          undefined
        ) {
          const value =
            cleanString(
              req.body
                .preparedBy
            );

          if (!value) {
            return res
              .status(400)
              .json({
                success:
                  false,
                message:
                  "Prepared By is required.",
              });
          }

          record.preparedBy =
            value;
        }

        if (
          req.body.receivedBy !==
          undefined
        ) {
          const value =
            cleanString(
              req.body
                .receivedBy
            );

          if (!value) {
            return res
              .status(400)
              .json({
                success:
                  false,
                message:
                  "Received By is required.",
              });
          }

          record.receivedBy =
            value;
        }

        if (
          req.body.verifiedBy !==
          undefined
        ) {
          const value =
            cleanString(
              req.body
                .verifiedBy
            );

          if (!value) {
            return res
              .status(400)
              .json({
                success:
                  false,
                message:
                  "Verified By SM is required.",
              });
          }

          record.verifiedBy =
            value;

          record.managerName =
            value;
        }

        if (
          req.body.remarks !==
          undefined
        ) {
          record.remarks =
            cleanString(
              req.body
                .remarks
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Recalculate Monetary Values
        |--------------------------------------------------------------------------
        */

        const hasCashChanges =
          [
            "denominations",
            "pcvCash",
            "pcvInvoices",
            "swipeCard",
            "mdsKey",
            "refund",
            "deposits",
            "receipt",
            "others",
          ].some(
            (field) =>
              req.body[
                field
              ] !== undefined
          );

        if (hasCashChanges) {
          const totals =
            calculateTotals({
              denominations:
                req.body
                  .denominations !==
                undefined
                  ? req.body
                      .denominations
                  : record.denominations,

              pcvCash:
                req.body
                  .pcvCash !==
                undefined
                  ? req.body
                      .pcvCash
                  : record.pcvCash,

              pcvInvoices:
                req.body
                  .pcvInvoices !==
                undefined
                  ? req.body
                      .pcvInvoices
                  : record.pcvInvoices,

              swipeCard:
                req.body
                  .swipeCard !==
                undefined
                  ? req.body
                      .swipeCard
                  : record.swipeCard,

              mdsKey:
                req.body
                  .mdsKey !==
                undefined
                  ? req.body
                      .mdsKey
                  : record.mdsKey,

              refund:
                req.body
                  .refund !==
                undefined
                  ? req.body
                      .refund
                  : record.refund,

              deposits:
                req.body
                  .deposits !==
                undefined
                  ? req.body
                      .deposits
                  : record.deposits,

              receipt:
                req.body
                  .receipt !==
                undefined
                  ? req.body
                      .receipt
                  : record.receipt,

              others:
                req.body
                  .others !==
                undefined
                  ? req.body
                      .others
                  : record.others,

              expectedCash:
                record.expectedCash ||
                0,
            });

          Object.assign(
            record,
            totals
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Admin Review Fields
      |--------------------------------------------------------------------------
      */

      if (admin) {
        if (
          req.body.adminComment !==
          undefined
        ) {
          record.adminComment =
            cleanString(
              req.body
                .adminComment
            );
        }

        if (
          req.body.failureReason !==
          undefined
        ) {
          record.failureReason =
            cleanString(
              req.body
                .failureReason
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Admin Workflow
        |--------------------------------------------------------------------------
        |
        | Admin may:
        |
        | Pending -> Reviewed
        | Pending -> Failed
        | Reviewed -> Failed
        | Failed -> Reviewed
        |
        | Admin does NOT directly mark Completed.
        |
        */

        if (
          req.body.status !==
          undefined
        ) {
          const nextStatus =
            cleanString(
              req.body.status
            );

          if (
            !VALID_STATUSES.includes(
              nextStatus
            )
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,
                message:
                  "Invalid Cash Turnover status.",
              });
          }

          if (
            nextStatus ===
            "Completed"
          ) {
            return res
              .status(403)
              .json({
                success:
                  false,
                message:
                  "Administrators review Cash Turnover records. Completion must follow the completion workflow.",
              });
          }

          if (
            record.status ===
              "Completed"
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,
                message:
                  "Completed records cannot be moved back to another status.",
              });
          }

          if (
            nextStatus ===
            "Failed"
          ) {
            const reason =
              cleanString(
                req.body
                  .failureReason ||
                  record.failureReason
              );

            if (!reason) {
              return res
                .status(400)
                .json({
                  success:
                    false,
                  message:
                    "Failure reason is required when failing a Cash Turnover record.",
                });
            }

            record.failureReason =
              reason;

            Object.assign(
              record,
              getReviewerInfo(
                req
              )
            );
          }

          if (
            nextStatus ===
            "Reviewed"
          ) {
            record.failureReason =
              "";

            Object.assign(
              record,
              getReviewerInfo(
                req
              )
            );
          }

          record.status =
            nextStatus;
        }
      } else {
        /*
        |--------------------------------------------------------------------------
        | Store Status Workflow
        |--------------------------------------------------------------------------
        |
        | Store may only:
        |
        | Reviewed -> Completed
        |
        */

        if (
          req.body.status !==
          undefined
        ) {
          const nextStatus =
            cleanString(
              req.body.status
            );

          if (
            nextStatus !==
            "Completed"
          ) {
            return res
              .status(403)
              .json({
                success:
                  false,
                message:
                  "Store users cannot change the review status.",
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
                  "Only Reviewed Cash Turnover records can be completed.",
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
          success: true,

          message:
            "Cash Turnover updated successfully.",

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Update Cash Turnover Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error?.message ||
            "Could not update Cash Turnover record.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE CASH TURNOVER
|--------------------------------------------------------------------------
|
| DELETE /api/cash-turnovers/:id
|
|--------------------------------------------------------------------------
*/

export const deleteCashTurnover =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid Cash Turnover ID.",
          });
      }

      const record =
        await CashTurnover.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Cash Turnover record not found.",
          });
      }

      if (
        !checkStoreAccess(
          req,
          record.storeId
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "You do not have permission to delete this Cash Turnover record.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Completed records
      |--------------------------------------------------------------------------
      */

      if (
        !isAdminAccount(req) &&
        record.status ===
          "Completed"
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Completed Cash Turnover records cannot be deleted by store users.",
          });
      }

      await record.deleteOne();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Cash Turnover deleted successfully.",
        });
    } catch (error) {
      console.error(
        "Delete Cash Turnover Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Could not delete Cash Turnover record.",
        });
    }
  };