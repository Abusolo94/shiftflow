import mongoose from "mongoose";

import ShiftPlan from "../models/ShiftPlan.js";
import Store from "../models/Store.js";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const VALID_SHIFTS = [
  "Opening",
  "Mid",
  "Closing",
];

const VALID_MEAL_PERIODS = [
  "Breakfast",
  "Lunch",
  "Dinner",
];

const VALID_STATUSES = [
  "Pending",
  "Reviewed",
  "Failed",
  "Completed",
];

/*
|--------------------------------------------------------------------------
| Station Structure
|--------------------------------------------------------------------------
|
| These keys match ShiftPlanBoard.jsx exactly.
|
*/

const STATION_KEYS = [
  "drink",
  "dtot",
  "dtpb",
  "fries",
  "fryers",
  "dtotc",
  "bs",
  "pos1",
  "pos2",
  "pos3",
  "cciDrink",
  "grill1",
  "grill2",
  "buns",
  "prepTable",
  "uhc1",
  "uhc2",
  "hlz1",
  "hlz2",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

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
    return String(value._id);
  }

  if (value?.id) {
    return String(value.id);
  }

  return String(value);
};

/*
|--------------------------------------------------------------------------
| Validate Mongo ObjectId
|--------------------------------------------------------------------------
*/

const isValidObjectId = (
  value
) => {
  if (!value) {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(
    getObjectIdString(value)
  );
};

/*
|--------------------------------------------------------------------------
| Admin Check
|--------------------------------------------------------------------------
*/

const isAdminAccount = (
  req
) => {
  return (
    String(
      req?.user?.accountType ||
        ""
    )
      .trim()
      .toLowerCase() ===
    "admin"
  );
};

/*
|--------------------------------------------------------------------------
| Store Access
|--------------------------------------------------------------------------
*/

const checkStoreAccess = (
  req,
  record
) => {
  if (
    isAdminAccount(req)
  ) {
    return true;
  }

  const userStoreId =
    getObjectIdString(
      req?.user?.storeId
    );

  const recordStoreId =
    getObjectIdString(
      record?.storeId
    );

  if (
    !userStoreId ||
    !recordStoreId
  ) {
    return false;
  }

  return (
    userStoreId ===
    recordStoreId
  );
};

/*
|--------------------------------------------------------------------------
| Safe String
|--------------------------------------------------------------------------
*/

const cleanString = (
  value
) =>
  String(
    value ?? ""
  ).trim();

/*
|--------------------------------------------------------------------------
| Normalize Crew
|--------------------------------------------------------------------------
|
| Board currently uses 10 crew slots.
|
*/

const normalizeCrew = (
  crew
) => {
  const source =
    Array.isArray(crew)
      ? crew
      : [];

  return Array.from(
    { length: 10 },
    (_, index) =>
      cleanString(
        source[index]
      )
  );
};

/*
|--------------------------------------------------------------------------
| Normalize Stations
|--------------------------------------------------------------------------
*/

const normalizeStationCrew = (
  stationCrew
) => {
  const source =
    stationCrew &&
    typeof stationCrew ===
      "object"
      ? stationCrew
      : {};

  return STATION_KEYS.reduce(
    (
      result,
      stationKey
    ) => {
      result[stationKey] =
        cleanString(
          source[
            stationKey
          ]
        );

      return result;
    },
    {}
  );
};

/*
|--------------------------------------------------------------------------
| Normalize Secondary Duties
|--------------------------------------------------------------------------
*/

const normalizeSecondaryDuties =
  (rows) => {
    if (
      !Array.isArray(rows)
    ) {
      return [];
    }

    return rows
      .map((row) => ({
        what:
          cleanString(
            row?.what
          ),

        who:
          cleanString(
            row?.who
          ),
      }))
      .filter(
        (row) =>
          row.what ||
          row.who
      );
  };

/*
|--------------------------------------------------------------------------
| Normalize Breaks
|--------------------------------------------------------------------------
*/

const normalizeBreaks = (
  rows
) => {
  if (
    !Array.isArray(rows)
  ) {
    return [];
  }

  return rows
    .map((row) => ({
      who:
        cleanString(
          row?.who
        ),

      when:
        cleanString(
          row?.when
        ),
    }))
    .filter(
      (row) =>
        row.who ||
        row.when
    );
};

/*
|--------------------------------------------------------------------------
| Normalize Actions
|--------------------------------------------------------------------------
*/

const normalizeActions = (
  rows
) => {
  if (
    !Array.isArray(rows)
  ) {
    return [];
  }

  return rows
    .map((row) => ({
      what:
        cleanString(
          row?.what
        ),

      who:
        cleanString(
          row?.who
        ),

      when:
        cleanString(
          row?.when
        ),
    }))
    .filter(
      (row) =>
        row.what ||
        row.who ||
        row.when
    );
};

/*
|--------------------------------------------------------------------------
| Calculate Plan Statistics
|--------------------------------------------------------------------------
*/

const calculateStatistics = ({
  crew,
  stationCrew,
}) => {
  const totalCrew =
    crew.filter(
      (name) =>
        cleanString(name)
    ).length;

  const totalStations =
    Object.values(
      stationCrew
    ).filter(
      (name) =>
        cleanString(name)
    ).length;

  const availableStations =
    STATION_KEYS.length;

  const unassignedStations =
    Math.max(
      availableStations -
        totalStations,
      0
    );

  const stationCoverage =
    availableStations > 0
      ? Math.round(
          (totalStations /
            availableStations) *
            100
        )
      : 0;

  return {
    totalCrew,
    totalStations,
    availableStations,
    unassignedStations,
    stationCoverage,
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

  const data =
    typeof record.toObject ===
    "function"
      ? record.toObject()
      : record;

  return {
    ...data,

    id:
      getObjectIdString(
        data._id
      ),

    _id:
      getObjectIdString(
        data._id
      ),

    storeId:
      getObjectIdString(
        data.storeId
      ),
  };
};

/*
|--------------------------------------------------------------------------
| Resolve Store
|--------------------------------------------------------------------------
|
| Store users:
|     store comes from authenticated MongoDB user.
|
| Admin:
|     admin must provide an explicit Mongo storeId when creating for a store.
|
*/

const resolveStore = async (
  req
) => {
  let storeId;

  if (
    isAdminAccount(req)
  ) {
    storeId =
      getObjectIdString(
        req.body?.storeId
      );

    if (!storeId) {
      throw new Error(
        "STORE_ID_REQUIRED"
      );
    }
  } else {
    storeId =
      getObjectIdString(
        req?.user?.storeId
      );

    if (!storeId) {
      throw new Error(
        "STORE_ACCOUNT_REQUIRED"
      );
    }
  }

  if (
    !isValidObjectId(
      storeId
    )
  ) {
    throw new Error(
      "INVALID_STORE_ID"
    );
  }

  const store =
    await Store.findById(
      storeId
    );

  if (!store) {
    throw new Error(
      "STORE_NOT_FOUND"
    );
  }

  if (
    String(
      store.status ||
        ""
    )
      .trim()
      .toLowerCase() !==
    "active"
  ) {
    throw new Error(
      "STORE_INACTIVE"
    );
  }

  return store;
};

/*
|--------------------------------------------------------------------------
| GET /api/shift-plans
|--------------------------------------------------------------------------
*/

export const getShiftPlans =
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 50,

        storeId,
        storeNumber,

        status,
        shift,
        mealPeriod,

        businessDate,

        search,
      } = req.query;

      const query = {};

      /*
      |--------------------------------------------------------------------------
      | Store Scope
      |--------------------------------------------------------------------------
      */

      if (
        !isAdminAccount(req)
      ) {
        const userStoreId =
          getObjectIdString(
            req?.user
              ?.storeId
          );

        if (
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

        query.storeId =
          userStoreId;
      } else {
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

          query.storeId =
            storeId;
        }

        if (
          storeNumber
        ) {
          query.storeNumber =
            cleanString(
              storeNumber
            );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Filters
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
                "Invalid Shift Plan status.",
            });
        }

        query.status =
          status;
      }

      if (shift) {
        if (
          !VALID_SHIFTS.includes(
            shift
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid shift.",
            });
        }

        query.shift =
          shift;
      }

      if (
        mealPeriod
      ) {
        if (
          !VALID_MEAL_PERIODS.includes(
            mealPeriod
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid meal period.",
            });
        }

        query.mealPeriod =
          mealPeriod;
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
            businessDate
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

        const end =
          new Date(start);

        end.setDate(
          end.getDate() +
            1
        );

        query.businessDate =
          {
            $gte: start,
            $lt: end,
          };
      }

      /*
      |--------------------------------------------------------------------------
      | Search
      |--------------------------------------------------------------------------
      */

      if (
        cleanString(
          search
        )
      ) {
        const term =
          cleanString(
            search
          );

        query.$or = [
          {
            storeName: {
              $regex:
                term,
              $options:
                "i",
            },
          },

          {
            storeNumber: {
              $regex:
                term,
              $options:
                "i",
            },
          },

          {
            productionManager:
              {
                $regex:
                  term,

                $options:
                  "i",
              },
          },

          {
            serviceManager:
              {
                $regex:
                  term,

                $options:
                  "i",
              },
          },

          {
            createdByName:
              {
                $regex:
                  term,

                $options:
                  "i",
              },
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
          Number(page) ||
            1,
          1
        );

      const pageLimit =
        Math.min(
          Math.max(
            Number(
              limit
            ) || 50,
            1
          ),
          200
        );

      const skip =
        (pageNumber -
          1) *
        pageLimit;

      const [
        records,
        total,
      ] =
        await Promise.all([
          ShiftPlan.find(
            query
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

          ShiftPlan.countDocuments(
            query
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
        "Get Shift Plans Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to load Shift Plan records.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| GET /api/shift-plans/:id
|--------------------------------------------------------------------------
*/

export const getShiftPlan =
  async (req, res) => {
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
              "Invalid Shift Plan ID.",
          });
      }

      const record =
        await ShiftPlan.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Shift Plan not found.",
          });
      }

      if (
        !checkStoreAccess(
          req,
          record
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "You do not have access to this Shift Plan.",
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
        "Get Shift Plan Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to load the Shift Plan.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| POST /api/shift-plans
|--------------------------------------------------------------------------
*/

export const createShiftPlan =
  async (req, res) => {
    try {
      const {
        businessDate,

        shift,

        mealPeriod,

        productionManager,

        serviceManager,

        crew,

        stationCrew,

        secondaryDuties,

        breaks,

        actions,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Basic Validation
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
            success:
              false,

            message:
              "Invalid business date.",
          });
      }

      if (
        !VALID_SHIFTS.includes(
          shift
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Select a valid shift.",
          });
      }

      if (
        !VALID_MEAL_PERIODS.includes(
          mealPeriod
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Select Breakfast, Lunch or Dinner.",
          });
      }

      const cleanProductionManager =
        cleanString(
          productionManager
        );

      const cleanServiceManager =
        cleanString(
          serviceManager
        );

      if (
        !cleanProductionManager &&
        !cleanServiceManager
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Enter at least one production or service manager.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Resolve Authenticated Store
      |--------------------------------------------------------------------------
      */

      let store;

      try {
        store =
          await resolveStore(
            req
          );
      } catch (
        storeError
      ) {
        switch (
          storeError.message
        ) {
          case "STORE_ID_REQUIRED":
            return res
              .status(400)
              .json({
                success:
                  false,

                message:
                  "A store must be selected.",
              });

          case "STORE_ACCOUNT_REQUIRED":
            return res
              .status(403)
              .json({
                success:
                  false,

                message:
                  "Your account is not linked to a store.",
              });

          case "INVALID_STORE_ID":
            return res
              .status(400)
              .json({
                success:
                  false,

                message:
                  "Invalid store ID.",
              });

          case "STORE_NOT_FOUND":
            return res
              .status(404)
              .json({
                success:
                  false,

                message:
                  "Store not found.",
              });

          case "STORE_INACTIVE":
            return res
              .status(403)
              .json({
                success:
                  false,

                message:
                  "This store account is not active.",
              });

          default:
            throw storeError;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Normalize Board Data
      |--------------------------------------------------------------------------
      */

      const normalizedCrew =
        normalizeCrew(
          crew
        );

      const normalizedStationCrew =
        normalizeStationCrew(
          stationCrew
        );

      const normalizedSecondaryDuties =
        normalizeSecondaryDuties(
          secondaryDuties
        );

      const normalizedBreaks =
        normalizeBreaks(
          breaks
        );

      const normalizedActions =
        normalizeActions(
          actions
        );

      /*
      |--------------------------------------------------------------------------
      | Server-calculated Statistics
      |--------------------------------------------------------------------------
      */

      const statistics =
        calculateStatistics({
          crew:
            normalizedCrew,

          stationCrew:
            normalizedStationCrew,
        });

      /*
      |--------------------------------------------------------------------------
      | Create MongoDB Record
      |--------------------------------------------------------------------------
      */

      const record =
        await ShiftPlan.create(
          {
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

            businessDate:
              parsedDate,

            shift,

            mealPeriod,

            productionManager:
              cleanProductionManager,

            serviceManager:
              cleanServiceManager,

            crew:
              normalizedCrew,

            stationCrew:
              normalizedStationCrew,

            secondaryDuties:
              normalizedSecondaryDuties,

            breaks:
              normalizedBreaks,

            actions:
              normalizedActions,

            /*
            |--------------------------------------------------------------------------
            | Server-generated Stats
            |--------------------------------------------------------------------------
            */

            ...statistics,

            /*
            |--------------------------------------------------------------------------
            | Workflow
            |--------------------------------------------------------------------------
            */

            status:
              "Pending",

            /*
            |--------------------------------------------------------------------------
            | Creator Identity
            |--------------------------------------------------------------------------
            |
            | Derived from Firebase token + MongoDB user.
            |
            */

            createdByUid:
              cleanString(
                req
                  ?.firebaseUser
                  ?.uid
              ),

            createdByName:
              cleanString(
                req?.user
                  ?.displayName ||
                  req?.user
                    ?.fullName ||
                  req
                    ?.firebaseUser
                    ?.name ||
                  req
                    ?.firebaseUser
                    ?.email
              ),

            createdByEmail:
              cleanString(
                req
                  ?.firebaseUser
                  ?.email ||
                  req?.user
                    ?.email
              ),

            submittedAt:
              new Date(),
          }
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Shift Plan created successfully.",

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Create Shift Plan Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to create the Shift Plan.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| PUT /api/shift-plans/:id
|--------------------------------------------------------------------------
*/

export const updateShiftPlan =
  async (req, res) => {
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
              "Invalid Shift Plan ID.",
          });
      }

      const record =
        await ShiftPlan.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Shift Plan not found.",
          });
      }

      if (
        !checkStoreAccess(
          req,
          record
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "You do not have access to this Shift Plan.",
          });
      }

      const admin =
        isAdminAccount(req);

      /*
      |--------------------------------------------------------------------------
      | Completed Records Locked
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
              "Completed Shift Plans cannot be edited.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Store Data Updates
      |--------------------------------------------------------------------------
      |
      | Store users may edit board content only while Pending.
      |
      */

      const wantsBoardUpdate =
        req.body
          ?.businessDate !==
          undefined ||
        req.body?.shift !==
          undefined ||
        req.body
          ?.mealPeriod !==
          undefined ||
        req.body
          ?.productionManager !==
          undefined ||
        req.body
          ?.serviceManager !==
          undefined ||
        req.body?.crew !==
          undefined ||
        req.body
          ?.stationCrew !==
          undefined ||
        req.body
          ?.secondaryDuties !==
          undefined ||
        req.body?.breaks !==
          undefined ||
        req.body?.actions !==
          undefined;

      if (
        !admin &&
        wantsBoardUpdate &&
        record.status !==
          "Pending"
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Only Pending Shift Plans can be edited.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Business Date
      |--------------------------------------------------------------------------
      */

      if (
        req.body
          ?.businessDate !==
        undefined
      ) {
        const date =
          new Date(
            req.body
              .businessDate
          );

        if (
          Number.isNaN(
            date.getTime()
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
          date;
      }

      /*
      |--------------------------------------------------------------------------
      | Shift
      |--------------------------------------------------------------------------
      */

      if (
        req.body?.shift !==
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
                "Invalid shift.",
            });
        }

        record.shift =
          req.body.shift;
      }

      /*
      |--------------------------------------------------------------------------
      | Meal Period
      |--------------------------------------------------------------------------
      */

      if (
        req.body
          ?.mealPeriod !==
        undefined
      ) {
        if (
          !VALID_MEAL_PERIODS.includes(
            req.body
              .mealPeriod
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid meal period.",
            });
        }

        record.mealPeriod =
          req.body.mealPeriod;
      }

      /*
      |--------------------------------------------------------------------------
      | Managers
      |--------------------------------------------------------------------------
      */

      if (
        req.body
          ?.productionManager !==
        undefined
      ) {
        record.productionManager =
          cleanString(
            req.body
              .productionManager
          );
      }

      if (
        req.body
          ?.serviceManager !==
        undefined
      ) {
        record.serviceManager =
          cleanString(
            req.body
              .serviceManager
          );
      }

      if (
        !cleanString(
          record.productionManager
        ) &&
        !cleanString(
          record.serviceManager
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Enter at least one production or service manager.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Crew
      |--------------------------------------------------------------------------
      */

      if (
        req.body?.crew !==
        undefined
      ) {
        record.crew =
          normalizeCrew(
            req.body.crew
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Stations
      |--------------------------------------------------------------------------
      */

      if (
        req.body
          ?.stationCrew !==
        undefined
      ) {
        record.stationCrew =
          normalizeStationCrew(
            req.body
              .stationCrew
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Secondary Duties
      |--------------------------------------------------------------------------
      */

      if (
        req.body
          ?.secondaryDuties !==
        undefined
      ) {
        record.secondaryDuties =
          normalizeSecondaryDuties(
            req.body
              .secondaryDuties
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Breaks
      |--------------------------------------------------------------------------
      */

      if (
        req.body?.breaks !==
        undefined
      ) {
        record.breaks =
          normalizeBreaks(
            req.body.breaks
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Actions
      |--------------------------------------------------------------------------
      */

      if (
        req.body?.actions !==
        undefined
      ) {
        record.actions =
          normalizeActions(
            req.body.actions
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Recalculate Statistics
      |--------------------------------------------------------------------------
      */

      if (
        wantsBoardUpdate
      ) {
        const statistics =
          calculateStatistics(
            {
              crew:
                Array.isArray(
                  record.crew
                )
                  ? record.crew
                  : [],

              stationCrew:
                record.stationCrew ||
                {},
            }
          );

        record.totalCrew =
          statistics.totalCrew;

        record.totalStations =
          statistics.totalStations;

        record.availableStations =
          statistics.availableStations;

        record.unassignedStations =
          statistics.unassignedStations;

        record.stationCoverage =
          statistics.stationCoverage;
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
            cleanString(
              req.body
                .adminComment
            );
        }

        if (
          req.body
            ?.failureReason !==
          undefined
        ) {
          record.failureReason =
            cleanString(
              req.body
                .failureReason
            );
        }

        if (
          req.body?.status !==
          undefined
        ) {
          const nextStatus =
            req.body.status;

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
                  "Invalid Shift Plan status.",
              });
          }

          if (
            record.status ===
              "Completed" &&
            nextStatus !==
              "Completed"
          ) {
            return res
              .status(400)
              .json({
                success:
                  false,

                message:
                  "A completed Shift Plan cannot move back to another status.",
              });
          }

          if (
            nextStatus ===
            "Failed"
          ) {
            const reason =
              cleanString(
                req.body
                  ?.failureReason ||
                  record.failureReason
              );

            if (!reason) {
              return res
                .status(400)
                .json({
                  success:
                    false,

                  message:
                    "Failure reason is required when marking a Shift Plan as Failed.",
                });
            }

            record.failureReason =
              reason;
          }

          if (
            nextStatus ===
              "Reviewed" ||
            nextStatus ===
              "Failed"
          ) {
            record.reviewedByUid =
              cleanString(
                req
                  ?.firebaseUser
                  ?.uid
              );

            record.reviewedByName =
              cleanString(
                req?.user
                  ?.displayName ||
                  req?.user
                    ?.fullName ||
                  req
                    ?.firebaseUser
                    ?.name ||
                  req
                    ?.firebaseUser
                    ?.email
              );

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

          record.status =
            nextStatus;
        }
      } else if (
        req.body?.status !==
        undefined
      ) {
        /*
        |--------------------------------------------------------------------------
        | Store Completion
        |--------------------------------------------------------------------------
        */

        if (
          req.body.status !==
          "Completed"
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "Store accounts cannot change the Shift Plan review status.",
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
                "Only a Reviewed Shift Plan can be completed.",
            });
        }

        record.status =
          "Completed";

        record.completedAt =
          new Date();

        record.completedByUid =
          cleanString(
            req
              ?.firebaseUser
              ?.uid
          );

        record.completedByName =
          cleanString(
            req?.user
              ?.displayName ||
              req?.user
                ?.fullName ||
              req
                ?.firebaseUser
                ?.name ||
              req
                ?.firebaseUser
                ?.email
          );
      }

      await record.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Shift Plan updated successfully.",

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Update Shift Plan Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to update the Shift Plan.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE /api/shift-plans/:id
|--------------------------------------------------------------------------
*/

export const deleteShiftPlan =
  async (req, res) => {
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
              "Invalid Shift Plan ID.",
          });
      }

      const record =
        await ShiftPlan.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Shift Plan not found.",
          });
      }

      if (
        !checkStoreAccess(
          req,
          record
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "You do not have permission to delete this Shift Plan.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Optional Safety Rule
      |--------------------------------------------------------------------------
      |
      | Store users cannot delete completed records.
      |
      */

      if (
        !isAdminAccount(
          req
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
              "Completed Shift Plans cannot be deleted by store accounts.",
          });
      }

      await record.deleteOne();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Shift Plan deleted successfully.",

          id,
        });
    } catch (error) {
      console.error(
        "Delete Shift Plan Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to delete the Shift Plan.",
        });
    }
  };