import mongoose from "mongoose";

import EmployeeMeal from "../models/EmployeeMeal.js";
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

const VALID_STATUSES = [
  "Pending",
  "Reviewed",
  "Failed",
  "Completed",
];

const VALID_POSITIONS = [
  "Crew",
  "Crew Trainer",
  "Manager",
  "Maintenance",
];

const VALID_MEAL_TYPES = [
  "Break Meal",
  "End Shift Meal",
];

/*
|--------------------------------------------------------------------------
| Helpers
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

const isAdminAccount = (req) => {
  const role = cleanString(
    req.user?.role
  ).toLowerCase();

  const accountType = cleanString(
    req.user?.accountType
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

  return (
    getObjectIdString(
      req.user?.storeId
    ) ===
    getObjectIdString(
      recordStoreId
    )
  );
};

/*
|--------------------------------------------------------------------------
| Normalize Employees
|--------------------------------------------------------------------------
*/

const normalizeEmployees = (
  employees
) => {
  if (!Array.isArray(employees)) {
    return [];
  }

  return employees
    .map((employee) => {
      const empNumber =
        cleanString(
          employee?.empNumber
        );

      const name =
        cleanString(
          employee?.name
        );

      const position =
        VALID_POSITIONS.includes(
          employee?.position
        )
          ? employee.position
          : "Crew";

      const mealType =
        VALID_MEAL_TYPES.includes(
          employee?.mealType
        )
          ? employee.mealType
          : "Break Meal";

      const meal =
        cleanString(
          employee?.meal
        );

      const drinks =
        cleanString(
          employee?.drinks
        );

      const breakDone =
        employee?.breakDone === "yes"
          ? "yes"
          : "no";

      return {
        empNumber,
        name,
        position,
        mealType,
        meal,
        drinks,
        breakDone,
      };
    })
    .filter((employee) => {
      return (
        employee.empNumber ||
        employee.name ||
        employee.meal ||
        employee.drinks
      );
    });
};

/*
|--------------------------------------------------------------------------
| Validate Employees
|--------------------------------------------------------------------------
*/

const validateEmployees = (
  employees
) => {
  if (employees.length === 0) {
    return {
      valid: false,
      message:
        "Add at least one employee.",
    };
  }

  const missingName =
    employees.find(
      (employee) =>
        !cleanString(
          employee.name
        )
    );

  if (missingName) {
    return {
      valid: false,
      message:
        "Every employee entry must have a name.",
    };
  }

  return {
    valid: true,
    message: "",
  };
};

/*
|--------------------------------------------------------------------------
| Calculate Statistics
|--------------------------------------------------------------------------
*/

const calculateStatistics = (
  employees
) => {
  const totalEmployees =
    employees.length;

  const mealsTaken =
    employees.filter(
      (employee) =>
        Boolean(
          cleanString(
            employee.meal
          )
        )
    ).length;

  const drinksTaken =
    employees.filter(
      (employee) =>
        Boolean(
          cleanString(
            employee.drinks
          )
        )
    ).length;

  const breaksDone =
    employees.filter(
      (employee) =>
        employee.breakDone === "yes"
    ).length;

  const noMeal =
    Math.max(
      0,
      totalEmployees -
        mealsTaken
    );

  const noDrink =
    Math.max(
      0,
      totalEmployees -
        drinksTaken
    );

  const mealCompletion =
    totalEmployees > 0
      ? Math.round(
          (mealsTaken /
            totalEmployees) *
            100
        )
      : 0;

  const breakCompletion =
    totalEmployees > 0
      ? Math.round(
          (breaksDone /
            totalEmployees) *
            100
        )
      : 0;

  return {
    totalEmployees,
    mealsTaken,
    drinksTaken,
    breaksDone,
    noMeal,
    noDrink,
    mealCompletion,
    breakCompletion,
  };
};

/*
|--------------------------------------------------------------------------
| Format Record
|--------------------------------------------------------------------------
*/

const formatRecord = (record) => {
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

    id: String(
      object._id
    ),

    _id: String(
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
| Resolve Store
|--------------------------------------------------------------------------
|
| Store user:
|   Always use req.user.storeId
|
| Admin:
|   Can supply req.body.storeId
|
*/

const resolveStore = async (
  req
) => {
  const admin =
    isAdminAccount(req);

  const rawStoreId =
    admin
      ? req.body?.storeId
      : req.user?.storeId;

  const storeId =
    getObjectIdString(
      rawStoreId
    );

  if (
    !storeId ||
    !isValidObjectId(
      storeId
    )
  ) {
    throw new Error(
      admin
        ? "A valid storeId is required."
        : "Your account is not connected to a valid store."
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

  const storeStatus =
    cleanString(
      store.status
    ).toLowerCase();

  if (
    storeStatus !== "active"
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

const getCreatorInfo = (req) => {
  return {
    createdByUid:
      cleanString(
        req.firebaseUser?.uid
      ),

    createdByName:
      cleanString(
        req.user?.displayName ||
          req.user?.fullName ||
          req.user?.name ||
          req.firebaseUser?.name ||
          req.firebaseUser?.email
      ),

    createdByEmail:
      cleanString(
        req.user?.email ||
          req.firebaseUser?.email
      ),
  };
};

/*
|--------------------------------------------------------------------------
| Reviewer Information
|--------------------------------------------------------------------------
*/

const getReviewerInfo = (req) => {
  return {
    reviewedByUid:
      cleanString(
        req.firebaseUser?.uid
      ),

    reviewedByName:
      cleanString(
        req.user?.displayName ||
          req.user?.fullName ||
          req.user?.name ||
          req.firebaseUser?.name ||
          req.firebaseUser?.email
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
        req.firebaseUser?.uid
      ),

    completedByName:
      cleanString(
        req.user?.displayName ||
          req.user?.fullName ||
          req.user?.name ||
          req.firebaseUser?.name ||
          req.firebaseUser?.email
      ),

    completedAt:
      new Date(),
  };
};

/*
|--------------------------------------------------------------------------
| GET /api/employee-meals
|--------------------------------------------------------------------------
*/

export const getEmployeeMeals =
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

      const query = {};

      /*
      |--------------------------------------------------------------------------
      | Security Scope
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
                  "Invalid storeId.",
              });
          }

          query.storeId =
            storeId;
        }

        if (
          cleanString(
            storeNumber
          )
        ) {
          query.storeNumber =
            cleanString(
              storeNumber
            );
        }
      } else {
        const currentStoreId =
          getObjectIdString(
            req.user?.storeId
          );

        if (
          !currentStoreId ||
          !isValidObjectId(
            currentStoreId
          )
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "Your account is not connected to a valid store.",
            });
        }

        query.storeId =
          currentStoreId;
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
        query.status =
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
        query.shift =
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
          end.getDate() + 1
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

      const searchValue =
        cleanString(search);

      if (searchValue) {
        query.$or = [
          {
            storeName: {
              $regex:
                searchValue,
              $options: "i",
            },
          },

          {
            storeNumber: {
              $regex:
                searchValue,
              $options: "i",
            },
          },

          {
            managerName: {
              $regex:
                searchValue,
              $options: "i",
            },
          },

          {
            "employees.name":
              {
                $regex:
                  searchValue,

                $options:
                  "i",
              },
          },

          {
            "employees.empNumber":
              {
                $regex:
                  searchValue,

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
          1,
          Number(page) || 1
        );

      const pageSize =
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
        pageSize;

      const [
        records,
        total,
      ] =
        await Promise.all([
          EmployeeMeal.find(
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
              pageSize
            ),

          EmployeeMeal.countDocuments(
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
              pageSize,

            total,

            pages:
              Math.ceil(
                total /
                  pageSize
              ),
          },
        });
    } catch (error) {
      console.error(
        "Get Employee Meals Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Could not load Employee Meal records.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| GET /api/employee-meals/:id
|--------------------------------------------------------------------------
*/

export const getEmployeeMeal =
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
              "Invalid Employee Meal ID.",
          });
      }

      const record =
        await EmployeeMeal.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Employee Meal record not found.",
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
              "You do not have permission to view this record.",
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
        "Get Employee Meal Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Could not load the Employee Meal record.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| POST /api/employee-meals
|--------------------------------------------------------------------------
*/

export const createEmployeeMeal =
  async (req, res) => {
    try {
      const {
        businessDate,
        shift,
        managerName,
        employees,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Date
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
      | Shift
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
              "Invalid shift.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Manager
      |--------------------------------------------------------------------------
      */

      const cleanManagerName =
        cleanString(
          managerName
        );

      if (
        !cleanManagerName
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Manager name is required.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Employees
      |--------------------------------------------------------------------------
      */

      const cleanEmployees =
        normalizeEmployees(
          employees
        );

      const employeeValidation =
        validateEmployees(
          cleanEmployees
        );

      if (
        !employeeValidation.valid
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              employeeValidation.message,
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
      | Statistics
      |--------------------------------------------------------------------------
      */

      const statistics =
        calculateStatistics(
          cleanEmployees
        );

      /*
      |--------------------------------------------------------------------------
      | Creator
      |--------------------------------------------------------------------------
      */

      const creatorInfo =
        getCreatorInfo(req);

      if (
        !creatorInfo.createdByUid
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
      | Create
      |--------------------------------------------------------------------------
      */

      const record =
        await EmployeeMeal.create(
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

            managerName:
              cleanManagerName,

            employees:
              cleanEmployees,

            ...statistics,

            status:
              "Pending",

            ...creatorInfo,

            submittedAt:
              new Date(),
          }
        );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Employee Meal record created successfully.",

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Create Employee Meal Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error?.message ||
            "Could not create Employee Meal record.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| PUT /api/employee-meals/:id
|--------------------------------------------------------------------------
*/

export const updateEmployeeMeal =
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
              "Invalid Employee Meal ID.",
          });
      }

      const record =
        await EmployeeMeal.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Employee Meal record not found.",
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
              "You do not have permission to update this record.",
          });
      }

      const admin =
        isAdminAccount(req);

      /*
      |--------------------------------------------------------------------------
      | Store Edit Lock
      |--------------------------------------------------------------------------
      */

      if (
        !admin &&
        record.status ===
          "Completed"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Completed records cannot be edited.",
          });
      }

      const mealFieldsBeingEdited =
        req.body
          ?.businessDate !==
          undefined ||
        req.body?.shift !==
          undefined ||
        req.body
          ?.managerName !==
          undefined ||
        req.body?.employees !==
          undefined;

      if (
        !admin &&
        record.status !==
          "Pending" &&
        mealFieldsBeingEdited
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Employee Meal data can only be edited while the record is Pending.",
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
      | Manager
      |--------------------------------------------------------------------------
      */

      if (
        req.body
          ?.managerName !==
        undefined
      ) {
        const cleanManagerName =
          cleanString(
            req.body
              .managerName
          );

        if (
          !cleanManagerName
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Manager name is required.",
            });
        }

        record.managerName =
          cleanManagerName;
      }

      /*
      |--------------------------------------------------------------------------
      | Employees + Statistics
      |--------------------------------------------------------------------------
      */

      if (
        req.body?.employees !==
        undefined
      ) {
        const cleanEmployees =
          normalizeEmployees(
            req.body
              .employees
          );

        const validation =
          validateEmployees(
            cleanEmployees
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

        record.employees =
          cleanEmployees;

        const statistics =
          calculateStatistics(
            cleanEmployees
          );

        record.totalEmployees =
          statistics.totalEmployees;

        record.mealsTaken =
          statistics.mealsTaken;

        record.drinksTaken =
          statistics.drinksTaken;

        record.breaksDone =
          statistics.breaksDone;

        record.noMeal =
          statistics.noMeal;

        record.noDrink =
          statistics.noDrink;

        record.mealCompletion =
          statistics.mealCompletion;

        record.breakCompletion =
          statistics.breakCompletion;
      }

      /*
      |--------------------------------------------------------------------------
      | Admin Workflow
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
                  "Invalid status.",
              });
          }

          /*
          |--------------------------------------------------------------------------
          | Completed cannot move backward
          |--------------------------------------------------------------------------
          */

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
                  "A Completed record cannot move back to another status.",
              });
          }

          /*
          |--------------------------------------------------------------------------
          | Failed Requires Reason
          |--------------------------------------------------------------------------
          */

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
                    "Failure reason is required.",
                });
            }

            record.failureReason =
              reason;
          }

          /*
          |--------------------------------------------------------------------------
          | Reviewed Clears Failure Reason
          |--------------------------------------------------------------------------
          */

          if (
            nextStatus ===
            "Reviewed"
          ) {
            record.failureReason =
              "";
          }

          /*
          |--------------------------------------------------------------------------
          | Review Metadata
          |--------------------------------------------------------------------------
          */

          if (
            nextStatus ===
              "Reviewed" ||
            nextStatus ===
              "Failed"
          ) {
            const reviewerInfo =
              getReviewerInfo(
                req
              );

            record.reviewedByUid =
              reviewerInfo.reviewedByUid;

            record.reviewedByName =
              reviewerInfo.reviewedByName;

            record.reviewedAt =
              reviewerInfo.reviewedAt;
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
        | Store Workflow
        |--------------------------------------------------------------------------
        |
        | Store can only:
        |
        | Reviewed -> Completed
        |
        */

        if (
          req.body.status !==
          "Completed"
        ) {
          return res
            .status(403)
            .json({
              success: false,

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
              success: false,

              message:
                "Only a Reviewed Employee Meal record can be marked Completed.",
            });
        }

        const completionInfo =
          getCompletionInfo(
            req
          );

        record.status =
          "Completed";

        record.completedByUid =
          completionInfo.completedByUid;

        record.completedByName =
          completionInfo.completedByName;

        record.completedAt =
          completionInfo.completedAt;
      }

      await record.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Employee Meal record updated successfully.",

          record:
            formatRecord(
              record
            ),
        });
    } catch (error) {
      console.error(
        "Update Employee Meal Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error?.message ||
            "Could not update Employee Meal record.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE /api/employee-meals/:id
|--------------------------------------------------------------------------
*/

export const deleteEmployeeMeal =
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
              "Invalid Employee Meal ID.",
          });
      }

      const record =
        await EmployeeMeal.findById(
          id
        );

      if (!record) {
        return res
          .status(404)
          .json({
            success: false,

            message:
              "Employee Meal record not found.",
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
              "You do not have permission to delete this record.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Store Delete Restriction
      |--------------------------------------------------------------------------
      */

      if (
        !isAdminAccount(req) &&
        record.status ===
          "Completed"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Completed Employee Meal records cannot be deleted.",
          });
      }

      await record.deleteOne();

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Employee Meal record deleted successfully.",
        });
    } catch (error) {
      console.error(
        "Delete Employee Meal Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error?.message ||
            "Could not delete Employee Meal record.",
        });
    }
  };