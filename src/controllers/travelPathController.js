import mongoose from "mongoose";

import TravelPath from "../models/TravelPath.js";
import Store from "../models/Store.js";

/*
|--------------------------------------------------------------------------
| Canonical Travel Path Structure
|--------------------------------------------------------------------------
|
| Never trust section titles, item labels, scores, totals, store identity,
| or creator identity from the browser.
|
| The frontend may submit status/comment values, but the backend decides
| which sections/items are valid.
|
*/

const TRAVEL_PATH_STRUCTURE = [
  {
    sectionId: "exterior",
    sectionTitle: "Exterior",
    items: [
      {
        itemId: "parkingAreaClean",
        itemLabel:
          "Parking area clean and litter-free",
      },
      {
        itemId: "driveThruLaneClean",
        itemLabel:
          "Drive-Thru lane clean",
      },
      {
        itemId: "menuBoardsFunctioning",
        itemLabel:
          "Menu boards functioning",
      },
      {
        itemId: "digitalScreensWorking",
        itemLabel:
          "Digital screens working",
      },
      {
        itemId:
          "exteriorLightingOperational",
        itemLabel:
          "Exterior lighting operational",
      },
      {
        itemId: "landscapingMaintained",
        itemLabel:
          "Landscaping maintained",
      },
      {
        itemId:
          "wasteBinsNotOverflowing",
        itemLabel:
          "Waste bins not overflowing",
      },
      {
        itemId:
          "restaurantBrandingGoodCondition",
        itemLabel:
          "Restaurant branding in good condition",
      },
    ],
  },

  {
    sectionId: "diningArea",
    sectionTitle: "Dining Area",
    items: [
      {
        itemId: "diningRoomClean",
        itemLabel:
          "Dining room clean",
      },
      {
        itemId: "tablesSanitized",
        itemLabel:
          "Tables sanitized",
      },
      {
        itemId: "floorsCleanDry",
        itemLabel:
          "Floors clean and dry",
      },
      {
        itemId:
          "condimentStationStocked",
        itemLabel:
          "Condiment station stocked",
      },
      {
        itemId: "allLightsWorking",
        itemLabel:
          "All lights working properly",
      },
      {
        itemId:
          "restroomsCleanStocked",
        itemLabel:
          "Restrooms clean and fully stocked",
      },
      {
        itemId:
          "lobbyCleanersVisible",
        itemLabel:
          "Lobby cleaners visible during peak and maintaining hygiene",
      },
      {
        itemId: "playlandClean",
        itemLabel:
          "Playland cleanliness and free from any obstacle",
      },
      {
        itemId:
          "lobbyCurtainClean",
        itemLabel:
          "Lobby curtain clean and in good condition",
      },
    ],
  },

  {
    sectionId: "frontCounter",
    sectionTitle:
      "Front Counter & Kiosk",
    items: [
      {
        itemId:
          "registersOperational",
        itemLabel:
          "Registers operational",
      },
      {
        itemId:
          "selfOrderKiosksFunctioning",
        itemLabel:
          "Self-order kiosks functioning",
      },
      {
        itemId:
          "loyaltyPromotionCommunicated",
        itemLabel:
          "Loyalty promotion communicated",
      },
      {
        itemId:
          "suggestiveSellingObserved",
        itemLabel:
          "Suggestive selling observed",
      },
      {
        itemId:
          "greetingStandardFollowed",
        itemLabel:
          "Greeting standard followed",
      },
      {
        itemId:
          "orderAccuracyMaintained",
        itemLabel:
          "Order accuracy maintained",
      },
      {
        itemId:
          "queueManagedEffectively",
        itemLabel:
          "Queue managed effectively",
      },
    ],
  },

  {
    sectionId: "driveThru",
    sectionTitle: "Drive-Thru",
    items: [
      {
        itemId: "dtGreetingsFollowed",
        itemLabel:
          "DT greetings followed",
      },
      {
        itemId: "askAskTellFollowed",
        itemLabel:
          "Ask–Ask–Tell process followed",
      },
      {
        itemId:
          "headsetsFunctioning",
        itemLabel:
          "Headsets functioning",
      },
      {
        itemId:
          "oepeTargetAchieved",
        itemLabel:
          "Order End Present End target achieved",
      },
      {
        itemId:
          "tetTargetAchieved",
        itemLabel:
          "Total Experience Time target achieved",
      },
      {
        itemId:
          "pullForwardProcessFollowed",
        itemLabel:
          "Proper Pull Forward/Fast Forward process followed",
      },
      {
        itemId:
          "noUnnecessaryOrderBumping",
        itemLabel:
          "No unnecessary order bumping",
      },
      {
        itemId:
          "dtScreensTimersWorking",
        itemLabel:
          "DT screens and timers working",
      },
      {
        itemId:
          "codScannerWorking",
        itemLabel:
          "COD scanner working properly",
      },
    ],
  },

  {
    sectionId: "fryStation",
    sectionTitle: "Fry Station",
    items: [
      {
        itemId: "fryVatsUtilized",
        itemLabel:
          "Fry vats fully utilized during peak",
      },
      {
        itemId:
          "oilQualityAcceptable",
        itemLabel:
          "Oil quality acceptable",
      },
      {
        itemId:
          "friesSaltedCorrectly",
        itemLabel:
          "Fries salted correctly",
      },
      {
        itemId:
          "holdingTimesFollowed",
        itemLabel:
          "Holding times followed",
      },
      {
        itemId: "fryStationClean",
        itemLabel:
          "Fry station clean",
      },
      {
        itemId:
          "eProductionScreenFollowed",
        itemLabel:
          "E-Production Screen followed",
      },
    ],
  },

  {
    sectionId:
      "kitchenOperations",
    sectionTitle:
      "Kitchen Operations",
    items: [
      {
        itemId: "sideTwoOperating",
        itemLabel:
          "Side 2 operating when production reaches target",
      },
      {
        itemId:
          "eProductionFollowed",
        itemLabel:
          "E-Production procedure followed",
      },
      {
        itemId:
          "kvsOperatingCorrectly",
        itemLabel:
          "KVS operating correctly",
      },
      {
        itemId: "lookCookFollowed",
        itemLabel:
          "Look & Cook followed",
      },
      {
        itemId:
          "productHoldingTimesCorrect",
        itemLabel:
          "Correct product holding times",
      },
      {
        itemId:
          "productFreshnessMaintained",
        itemLabel:
          "Product freshness maintained",
      },
      {
        itemId:
          "buildStandardsFollowed",
        itemLabel:
          "Build standards followed",
      },
      {
        itemId:
          "properAssemblySequence",
        itemLabel:
          "Proper assembly sequence followed",
      },
      {
        itemId:
          "correctBumpingProcedure",
        itemLabel:
          "Correct bumping procedure followed",
      },
      {
        itemId:
          "toastingProcedureFollowed",
        itemLabel:
          "Toasting procedure followed",
      },
      {
        itemId:
          "noProductionBottlenecks",
        itemLabel:
          "No production bottlenecks",
      },
    ],
  },

  {
    sectionId: "foodSafety",
    sectionTitle: "Food Safety",
    items: [
      {
        itemId:
          "handwashingObserved",
        itemLabel:
          "Handwashing observed",
      },
      {
        itemId:
          "glovesChangedCorrectly",
        itemLabel:
          "Gloves changed correctly",
      },
      {
        itemId:
          "sanitizerConcentrationVerified",
        itemLabel:
          "Sanitizer concentration verified",
      },
      {
        itemId:
          "temperatureLogsComplete",
        itemLabel:
          "Temperature logs complete",
      },
      {
        itemId:
          "foodRotationFollowed",
        itemLabel:
          "Food rotation followed",
      },
      {
        itemId:
          "dateLabelsAccurate",
        itemLabel:
          "Date labels accurate",
      },
      {
        itemId:
          "noExpiredProducts",
        itemLabel:
          "No expired products",
      },
      {
        itemId:
          "pestControlMaintained",
        itemLabel:
          "Pest control standards maintained",
      },
      {
        itemId:
          "employeeHygiene",
        itemLabel:
          "Employee hygiene maintained",
      },
    ],
  },

  {
    sectionId: "equipment",
    sectionTitle: "Equipment",
    items: [
      {
        itemId:
          "grillOperational",
        itemLabel:
          "Grill operational",
      },
      {
        itemId:
          "fryersOperational",
        itemLabel:
          "Fryers operational",
      },
      {
        itemId: "uhcFunctioning",
        itemLabel:
          "UHC functioning",
      },
      {
        itemId:
          "iceMachineClean",
        itemLabel:
          "Ice machine clean",
      },
      {
        itemId:
          "beverageEquipmentWorking",
        itemLabel:
          "Beverage equipment working",
      },
      {
        itemId:
          "absMachineFunctioning",
        itemLabel:
          "ABS machine functioning",
      },
      {
        itemId:
          "refrigerationWithinStandard",
        itemLabel:
          "Refrigeration temperature within standard",
      },
      {
        itemId:
          "maintenanceIssuesReported",
        itemLabel:
          "Maintenance issues reported",
      },
    ],
  },

  {
    sectionId:
      "servicePerformance",
    sectionTitle:
      "Service Performance",
    items: [
      {
        itemId: "tet",
        itemLabel:
          "TET — Total Experience Time",
      },
      {
        itemId: "oepe",
        itemLabel:
          "OEPE — Order End Present End",
      },
      {
        itemId: "r2p",
        itemLabel:
          "R2P — Receipt to Present",
      },
      {
        itemId: "kvsTime",
        itemLabel:
          "KVS Time",
      },
    ],
  },
];

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const VALID_ITEM_STATUSES = [
  "",
  "pass",
  "attention",
  "fail",
];

const VALID_RECORD_STATUSES = [
  "Pending",
  "Reviewed",
  "Failed",
  "Completed",
];

const VALID_SHIFTS = [
  "Opening",
  "Mid",
  "Closing",
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
    typeof value === "string"
  ) {
    return value;
  }

  if (value?._id) {
    return String(value._id);
  }

  return String(value);
};

const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    value
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
      req.user?.accountType || ""
    )
      .trim()
      .toLowerCase() ===
    "admin"
  );
};

/*
|--------------------------------------------------------------------------
| Store Access Check
|--------------------------------------------------------------------------
*/

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
| Normalize Incoming Checklist
|--------------------------------------------------------------------------
|
| Supports either:
|
| 1. New array format:
|
| sections: [
|   {
|     sectionId: "exterior",
|     items: [
|       {
|         itemId: "parkingAreaClean",
|         status: "pass",
|         comment: ""
|       }
|     ]
|   }
| ]
|
| OR
|
| 2. Current frontend nested-object format:
|
| checklist: {
|   exterior: {
|     parkingAreaClean: {
|       status: "pass",
|       comment: ""
|     }
|   }
| }
|
*/

const normalizeChecklist = (
  body
) => {
  const submittedSections =
    Array.isArray(
      body?.sections
    )
      ? body.sections
      : [];

  const submittedChecklist =
    body?.checklist &&
    typeof body.checklist ===
      "object"
      ? body.checklist
      : {};

  return TRAVEL_PATH_STRUCTURE.map(
    (canonicalSection) => {
      const submittedSection =
        submittedSections.find(
          (section) =>
            section?.sectionId ===
            canonicalSection.sectionId
        );

      const items =
        canonicalSection.items.map(
          (canonicalItem) => {
            let submittedItem =
              null;

            if (
              submittedSection &&
              Array.isArray(
                submittedSection.items
              )
            ) {
              submittedItem =
                submittedSection.items.find(
                  (item) =>
                    item?.itemId ===
                    canonicalItem.itemId
                );
            }

            if (!submittedItem) {
              submittedItem =
                submittedChecklist?.[
                  canonicalSection
                    .sectionId
                ]?.[
                  canonicalItem
                    .itemId
                ] || null;
            }

            let status =
              String(
                submittedItem
                  ?.status || ""
              )
                .trim()
                .toLowerCase();

            if (
              !VALID_ITEM_STATUSES.includes(
                status
              )
            ) {
              status = "";
            }

            const comment =
              String(
                submittedItem
                  ?.comment || ""
              ).trim();

            return {
              itemId:
                canonicalItem.itemId,

              itemLabel:
                canonicalItem.itemLabel,

              status,

              comment,
            };
          }
        );

      return {
        sectionId:
          canonicalSection.sectionId,

        sectionTitle:
          canonicalSection.sectionTitle,

        items,
      };
    }
  );
};

/*
|--------------------------------------------------------------------------
| Calculate Statistics
|--------------------------------------------------------------------------
*/

const calculateStatistics = (
  sections
) => {
  let totalItems = 0;
  let reviewedItems = 0;
  let passed = 0;
  let failed = 0;
  let needsAttention = 0;
  let unreviewed = 0;

  for (const section of sections) {
    for (const item of section.items) {
      totalItems += 1;

      if (
        item.status === "pass"
      ) {
        passed += 1;
        reviewedItems += 1;
      } else if (
        item.status === "fail"
      ) {
        failed += 1;
        reviewedItems += 1;
      } else if (
        item.status ===
        "attention"
      ) {
        needsAttention += 1;
        reviewedItems += 1;
      } else {
        unreviewed += 1;
      }
    }
  }

  const completionPercentage =
    totalItems > 0
      ? Math.round(
          (reviewedItems /
            totalItems) *
            100
        )
      : 0;

  const score =
    totalItems > 0
      ? Math.round(
          ((passed +
            needsAttention *
              0.5) /
            totalItems) *
            100
        )
      : 0;

  let performance =
    "Critical";

  if (score >= 95) {
    performance =
      "Excellent";
  } else if (score >= 90) {
    performance =
      "Very Good";
  } else if (score >= 80) {
    performance = "Good";
  } else if (score >= 70) {
    performance =
      "Needs Improvement";
  }

  return {
    totalItems,
    reviewedItems,
    passed,
    failed,
    needsAttention,
    unreviewed,
    completionPercentage,
    score,
    performance,
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
| GET /api/travel-path
|--------------------------------------------------------------------------
*/

export const getTravelPathRecords =
  async (req, res) => {
    try {
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
            req.user?.storeId
          );

        if (
          !userStoreId ||
          !isValidObjectId(
            userStoreId
          )
        ) {
          return res.status(403).json(
            {
              success: false,
              message:
                "Your account is not connected to a valid store.",
            }
          );
        }

        query.storeId =
          userStoreId;
      } else {
        /*
        Admin filters
        */

        if (
          req.query.storeId
        ) {
          if (
            !isValidObjectId(
              req.query.storeId
            )
          ) {
            return res.status(400).json(
              {
                success: false,
                message:
                  "Invalid store ID.",
              }
            );
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
      | Status Filter
      |--------------------------------------------------------------------------
      */

      if (
        req.query.status
      ) {
        if (
          !VALID_RECORD_STATUSES.includes(
            req.query.status
          )
        ) {
          return res.status(400).json(
            {
              success: false,
              message:
                "Invalid Travel Path status.",
            }
          );
        }

        query.status =
          req.query.status;
      }

      /*
      |--------------------------------------------------------------------------
      | Shift Filter
      |--------------------------------------------------------------------------
      */

      if (
        req.query.shift
      ) {
        if (
          !VALID_SHIFTS.includes(
            req.query.shift
          )
        ) {
          return res.status(400).json(
            {
              success: false,
              message:
                "Invalid shift.",
            }
          );
        }

        query.shift =
          req.query.shift;
      }

      /*
      |--------------------------------------------------------------------------
      | Business Date Filter
      |--------------------------------------------------------------------------
      */

      if (
        req.query.businessDate
      ) {
        const start =
          new Date(
            req.query.businessDate
          );

        if (
          Number.isNaN(
            start.getTime()
          )
        ) {
          return res.status(400).json(
            {
              success: false,
              message:
                "Invalid business date.",
            }
          );
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
              managerName: {
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
          TravelPath.find(
            query
          )
            .sort({
              businessDate: -1,
              createdAt: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean(),

          TravelPath.countDocuments(
            query
          ),
        ]);

      return res.status(200).json(
        {
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
                total /
                  limit
              ),
          },
        }
      );
    } catch (error) {
      console.error(
        "Get Travel Path Records Error:",
        error
      );

      return res.status(500).json(
        {
          success: false,
          message:
            "Unable to load Travel Path records.",
        }
      );
    }
  };

/*
|--------------------------------------------------------------------------
| GET /api/travel-path/:id
|--------------------------------------------------------------------------
*/

export const getTravelPathRecord =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json(
          {
            success: false,
            message:
              "Invalid Travel Path record ID.",
          }
        );
      }

      const record =
        await TravelPath.findById(
          id
        );

      if (!record) {
        return res.status(404).json(
          {
            success: false,
            message:
              "Travel Path record not found.",
          }
        );
      }

      if (
        !checkStoreAccess(
          req,
          record
        )
      ) {
        return res.status(403).json(
          {
            success: false,
            message:
              "You are not authorized to access this Travel Path record.",
          }
        );
      }

      return res.status(200).json(
        {
          success: true,
          record:
            formatRecord(
              record
            ),
        }
      );
    } catch (error) {
      console.error(
        "Get Travel Path Record Error:",
        error
      );

      return res.status(500).json(
        {
          success: false,
          message:
            "Unable to load Travel Path record.",
        }
      );
    }
  };

/*
|--------------------------------------------------------------------------
| POST /api/travel-path
|--------------------------------------------------------------------------
*/

export const createTravelPathRecord =
  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Validate Required Fields
      |--------------------------------------------------------------------------
      */

      const businessDate =
        req.body?.businessDate;

      const shift =
        String(
          req.body?.shift ||
            ""
        ).trim();

      const managerName =
        String(
          req.body
            ?.managerName ||
            ""
        ).trim();

      const remarks =
        String(
          req.body?.remarks ||
            ""
        ).trim();

      if (!businessDate) {
        return res.status(400).json(
          {
            success: false,
            message:
              "Business date is required.",
          }
        );
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
        return res.status(400).json(
          {
            success: false,
            message:
              "Invalid business date.",
          }
        );
      }

      if (
        !VALID_SHIFTS.includes(
          shift
        )
      ) {
        return res.status(400).json(
          {
            success: false,
            message:
              "A valid shift is required.",
          }
        );
      }

      if (!managerName) {
        return res.status(400).json(
          {
            success: false,
            message:
              "Manager name is required.",
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Resolve Store
      |--------------------------------------------------------------------------
      */

      let storeId = "";

      /*
      Store accounts always use
      their authenticated store.
      */

      if (
        !isAdminAccount(req)
      ) {
        storeId =
          getObjectIdString(
            req.user?.storeId
          );
      } else {
        /*
        Admin creation is allowed
        only if a storeId is supplied.
        */

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
        return res.status(400).json(
          {
            success: false,
            message:
              isAdminAccount(req)
                ? "A valid storeId is required when an administrator creates a Travel Path record."
                : "Your account is not connected to a valid store.",
          }
        );
      }

      const store =
        await Store.findById(
          storeId
        );

      if (!store) {
        return res.status(404).json(
          {
            success: false,
            message:
              "Store not found.",
          }
        );
      }

      if (
        store.status !==
        "Active"
      ) {
        return res.status(403).json(
          {
            success: false,
            message:
              "This store is not active.",
          }
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Normalize Checklist
      |--------------------------------------------------------------------------
      */

      const sections =
        normalizeChecklist(
          req.body
        );

      const statistics =
        calculateStatistics(
          sections
        );

      /*
      |--------------------------------------------------------------------------
      | Create
      |--------------------------------------------------------------------------
      */

      const record =
        await TravelPath.create(
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

            managerName,

            sections,

            ...statistics,

            remarks,

            status:
              "Pending",

            createdByUid:
              req.firebaseUser
                ?.uid ||
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

      return res.status(201).json(
        {
          success: true,

          message:
            "Travel Path checklist submitted successfully.",

          record:
            formatRecord(
              record
            ),
        }
      );
    } catch (error) {
      console.error(
        "Create Travel Path Record Error:",
        error
      );

      return res.status(500).json(
        {
          success: false,
          message:
            "Unable to create Travel Path record.",
        }
      );
    }
  };

/*
|--------------------------------------------------------------------------
| PUT /api/travel-path/:id
|--------------------------------------------------------------------------
*/

export const updateTravelPathRecord =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json(
          {
            success: false,
            message:
              "Invalid Travel Path record ID.",
          }
        );
      }

      const record =
        await TravelPath.findById(
          id
        );

      if (!record) {
        return res.status(404).json(
          {
            success: false,
            message:
              "Travel Path record not found.",
          }
        );
      }

      if (
        !checkStoreAccess(
          req,
          record
        )
      ) {
        return res.status(403).json(
          {
            success: false,
            message:
              "You are not authorized to update this Travel Path record.",
          }
        );
      }

      const admin =
        isAdminAccount(req);

      /*
      |--------------------------------------------------------------------------
      | Store Editable Fields
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
          return res.status(400).json(
            {
              success: false,
              message:
                "Invalid business date.",
            }
          );
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
          return res.status(400).json(
            {
              success: false,
              message:
                "Invalid shift.",
            }
          );
        }

        record.shift = shift;
      }

      if (
        req.body
          ?.managerName !==
        undefined
      ) {
        const managerName =
          String(
            req.body.managerName
          ).trim();

        if (!managerName) {
          return res.status(400).json(
            {
              success: false,
              message:
                "Manager name cannot be empty.",
            }
          );
        }

        record.managerName =
          managerName;
      }

      if (
        req.body?.remarks !==
        undefined
      ) {
        record.remarks =
          String(
            req.body.remarks ||
              ""
          ).trim();
      }

      /*
      |--------------------------------------------------------------------------
      | Checklist Update
      |--------------------------------------------------------------------------
      */

      if (
        req.body?.sections !==
          undefined ||
        req.body?.checklist !==
          undefined
      ) {
        const sections =
          normalizeChecklist(
            req.body
          );

        const statistics =
          calculateStatistics(
            sections
          );

        record.sections =
          sections;

        record.totalItems =
          statistics.totalItems;

        record.reviewedItems =
          statistics.reviewedItems;

        record.passed =
          statistics.passed;

        record.failed =
          statistics.failed;

        record.needsAttention =
          statistics.needsAttention;

        record.unreviewed =
          statistics.unreviewed;

        record.completionPercentage =
          statistics.completionPercentage;

        record.score =
          statistics.score;

        record.performance =
          statistics.performance;
      }

      /*
      |--------------------------------------------------------------------------
      | Admin Review Fields
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
            !VALID_RECORD_STATUSES.includes(
              nextStatus
            )
          ) {
            return res.status(400).json(
              {
                success: false,
                message:
                  "Invalid Travel Path status.",
              }
            );
          }

          /*
          Admin can:
          Pending → Reviewed
          Pending → Failed
          Failed → Reviewed
          Reviewed → Failed

          Completed should stay completed.
          */

          if (
            record.status ===
              "Completed" &&
            nextStatus !==
              "Completed"
          ) {
            return res.status(400).json(
              {
                success: false,
                message:
                  "A completed Travel Path record cannot be moved back to another status.",
              }
            );
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
              req.firebaseUser
                ?.uid ||
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
        | Store users may only move:
        |
        | Reviewed → Completed
        |
        */

        if (
          req.body?.status !==
          undefined
        ) {
          const requestedStatus =
            String(
              req.body.status
            ).trim();

          if (
            requestedStatus !==
            "Completed"
          ) {
            return res.status(403).json(
              {
                success: false,
                message:
                  "Store accounts cannot change the review status.",
              }
            );
          }

          if (
            record.status !==
            "Reviewed"
          ) {
            return res.status(400).json(
              {
                success: false,
                message:
                  "This Travel Path checklist must be reviewed before it can be completed.",
              }
            );
          }

          record.status =
            "Completed";
        }
      }

      await record.save();

      return res.status(200).json(
        {
          success: true,

          message:
            "Travel Path record updated successfully.",

          record:
            formatRecord(
              record
            ),
        }
      );
    } catch (error) {
      console.error(
        "Update Travel Path Record Error:",
        error
      );

      return res.status(500).json(
        {
          success: false,
          message:
            "Unable to update Travel Path record.",
        }
      );
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE /api/travel-path/:id
|--------------------------------------------------------------------------
*/

export const deleteTravelPathRecord =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res.status(400).json(
          {
            success: false,
            message:
              "Invalid Travel Path record ID.",
          }
        );
      }

      const record =
        await TravelPath.findById(
          id
        );

      if (!record) {
        return res.status(404).json(
          {
            success: false,
            message:
              "Travel Path record not found.",
          }
        );
      }

      if (
        !checkStoreAccess(
          req,
          record
        )
      ) {
        return res.status(403).json(
          {
            success: false,
            message:
              "You are not authorized to delete this Travel Path record.",
          }
        );
      }

      await record.deleteOne();

      return res.status(200).json(
        {
          success: true,
          message:
            "Travel Path record deleted successfully.",
        }
      );
    } catch (error) {
      console.error(
        "Delete Travel Path Record Error:",
        error
      );

      return res.status(500).json(
        {
          success: false,
          message:
            "Unable to delete Travel Path record.",
        }
      );
    }
  };