import mongoose from "mongoose";
import FoodSafetyVerification from "../models/FoodSafetyVerification.js";
import Store from "../models/Store.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const getAccountType = (user) => {
  if (!user) return null;

  if (user.accountType) {
    return String(user.accountType).toLowerCase();
  }

  if (
    String(user.role || "").toLowerCase() === "admin"
  ) {
    return "admin";
  }

  return "store";
};

const isAdmin = (user) => {
  return getAccountType(user) === "admin";
};

const getUserStoreId = (user) => {
  if (!user?.storeId) return null;

  return user.storeId?._id || user.storeId;
};

const normalizeId = (value) => {
  if (!value) return null;

  return String(
    value?._id ||
    value
  );
};

/*
|--------------------------------------------------------------------------
| Normalize MongoDB document
|--------------------------------------------------------------------------
*/

const normalizeVerification = (record) => {
  if (!record) return null;

  const data = record.toObject
    ? record.toObject()
    : record;

  const mongoId =
    data._id ||
    data.id;

  return {
    ...data,

    // Always expose both
    // MongoDB ID formats.
    id: mongoId
      ? String(mongoId)
      : null,

    _id: mongoId
      ? String(mongoId)
      : null,

    storeId: data.storeId
      ? normalizeId(data.storeId)
      : null,
  };
};

/*
|--------------------------------------------------------------------------
| Store scope
|--------------------------------------------------------------------------
*/

const getStoreScope = (user) => {
  if (isAdmin(user)) {
    return {};
  }

  const storeId = getUserStoreId(user);

  if (!storeId) {
    return null;
  }

  return {
    storeId,
  };
};

/*
|--------------------------------------------------------------------------
| Resolve authenticated user's store
|--------------------------------------------------------------------------
*/

const resolveUserStore = async (user) => {
  if (isAdmin(user)) {
    return null;
  }

  const storeId = getUserStoreId(user);

  if (!storeId) {
    throw new Error(
      "Your account is not assigned to a store."
    );
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      storeId
    )
  ) {
    throw new Error(
      "Your assigned store ID is invalid."
    );
  }

  const store =
    await Store.findById(storeId);

  if (!store) {
    throw new Error(
      "Your assigned store could not be found."
    );
  }

  return store;
};

/*
|--------------------------------------------------------------------------
| Convert temperature to Celsius
|--------------------------------------------------------------------------
*/

const toCelsius = (
  temperature,
  unit = "C"
) => {
  const value =
    Number(temperature);

  if (!Number.isFinite(value)) {
    return null;
  }

  if (
    String(unit).toUpperCase() === "F"
  ) {
    return (value - 32) * 5 / 9;
  }

  return value;
};

/*
|--------------------------------------------------------------------------
| Food Safety Verification Rules
|--------------------------------------------------------------------------
*/

const QUESTION_RULES = {
  FS1: {
    title: "Pest and Infestation Check",

    evaluate: (answer) => {
      return (
        answer ===
        "no-visible-infestation"
      );
    },
  },

  FS2: {
    title: "Beef Patty Temperature",

    minimumTemperature: 69,

    evaluate: (
      answer,
      temperature,
      unit
    ) => {
      return (
        answer === "yes" &&
        toCelsius(
          temperature,
          unit
        ) >= 69
      );
    },
  },

  FS3: {
    title: "Raw Chicken Temperature",

    minimumTemperature: 74,

    evaluate: (
      answer,
      temperature,
      unit
    ) => {
      return (
        answer === "yes" &&
        toCelsius(
          temperature,
          unit
        ) >= 74
      );
    },
  },

  FS4: {
    title: "Filet-O-Fish Temperature",

    minimumTemperature: 71,

    evaluate: (
      answer,
      temperature,
      unit
    ) => {
      return (
        answer === "yes" &&
        toCelsius(
          temperature,
          unit
        ) >= 71
      );
    },
  },

  FS5: {
    title: "Breakfast Sausage Temperature",

    minimumTemperature: 69,

    evaluate: (
      answer,
      temperature,
      unit
    ) => {
      return (
        answer === "yes" &&
        toCelsius(
          temperature,
          unit
        ) >= 69
      );
    },
  },

  FS6: {
    title: "Round Egg Verification",

    minimumTemperature: 69,

    evaluate: (
      answer,
      temperature,
      unit
    ) => {
      return (
        answer === "yes" &&
        toCelsius(
          temperature,
          unit
        ) >= 69
      );
    },
  },

  FS7: {
    title:
      "Manager Food Safety Knowledge",

    evaluate: (answer) => {
      return (
        answer ===
        "manager-certified-and-trained"
      );
    },
  },

  FS8: {
    title:
      "Critical Product Shelf-Life",

    evaluate: (answer) => {
      return (
        answer ===
        "no-expired-products"
      );
    },
  },
};

/*
|--------------------------------------------------------------------------
| Calculate individual question
|--------------------------------------------------------------------------
*/

const calculateQuestionResult = (
  questionId,
  answerData = {}
) => {
  const rule =
    QUESTION_RULES[questionId];

  if (!rule) {
    return {
      questionId,
      code: questionId,
      title: questionId,
      answer:
        answerData.answer || "",
      temperature:
        answerData.temperature ?? "",
      temperatureUnit:
        answerData.temperatureUnit || "C",
      remarks:
        answerData.remarks || "",
      correctiveAction:
        answerData.correctiveAction || "",
      passed: false,
    };
  }

  const answer =
    String(
      answerData.answer || ""
    ).trim();

  const temperature =
    answerData.temperature ?? "";

  const temperatureUnit =
    String(
      answerData.temperatureUnit || "C"
    ).toUpperCase() === "F"
      ? "F"
      : "C";

  const passed =
    rule.evaluate(
      answer,
      temperature,
      temperatureUnit
    );

  return {
    questionId,
    code: questionId,
    title: rule.title,

    answer,

    temperature,

    temperatureUnit,

    remarks:
      answerData.remarks || "",

    correctiveAction:
      answerData.correctiveAction || "",

    passed: Boolean(passed),
  };
};

/*
|--------------------------------------------------------------------------
| Calculate entire verification
|--------------------------------------------------------------------------
*/

const calculateVerificationResults = (
  answers = {}
) => {
  const questionIds = Object.keys(
    QUESTION_RULES
  );

  const questionResults =
    questionIds.map(
      (questionId) =>
        calculateQuestionResult(
          questionId,
          answers?.[questionId] || {}
        )
    );

  const totalQuestions =
    questionResults.length;

  const answeredQuestions =
    questionResults.filter(
      (item) =>
        String(
          item.answer || ""
        ).trim() !== ""
    ).length;

  const passed =
    questionResults.filter(
      (item) => item.passed
    ).length;

  const failed =
    questionResults.filter(
      (item) =>
        String(
          item.answer || ""
        ).trim() !== "" &&
        !item.passed
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
  } else if (failed <= 2) {
    complianceStatus =
      "Corrective Action Required";
  } else {
    complianceStatus =
      "Critical";
  }

  const failedItems =
    questionResults.filter(
      (item) => item.answer && !item.passed
    );

  return {
    questionResults,
    failedItems,

    totalQuestions,
    answeredQuestions,

    passed,
    failed,
    unanswered,

    completionPercentage,
    score,

    complianceStatus,
  };
};

/*
|--------------------------------------------------------------------------
| Validate verification
|--------------------------------------------------------------------------
*/

const validateVerification = ({
  businessDate,
  shift,
  managerName,
  answers,
}) => {
  if (!businessDate) {
    return "Business date is required.";
  }

  if (
    !["Opening", "Mid", "Closing"].includes(
      shift
    )
  ) {
    return "Valid shift is required.";
  }

  if (
    !managerName ||
    !String(managerName).trim()
  ) {
    return "Manager name is required.";
  }

  if (
    !answers ||
    typeof answers !== "object"
  ) {
    return "Verification answers are required.";
  }

  return null;
};

/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

export const createVerification =
  async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Only Store Accounts create
      |--------------------------------------------------------------------------
      */

      if (isAdmin(user)) {
        return res.status(403).json({
          success: false,
          message:
            "Admin accounts cannot submit store verification records.",
        });
      }

      const {
        businessDate,
        shift,
        verificationTime,
        managerName,
        answers,
        generalRemarks,
      } = req.body;

      const validationError =
        validateVerification({
          businessDate,
          shift,
          managerName,
          answers,
        });

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Resolve store from authenticated account
      |--------------------------------------------------------------------------
      */

      const store =
        await resolveUserStore(user);

      /*
      |--------------------------------------------------------------------------
      | Calculate results on backend
      |--------------------------------------------------------------------------
      */

      const results =
        calculateVerificationResults(
          answers
        );

      const record =
        await FoodSafetyVerification.create({
          formType:
            "Food Safety Procedures Verification",

          verificationCode:
            "FS1-FS8",

          storeId: store._id,

          storeNumber:
            store.storeNumber,

          storeName:
            store.storeName,

          businessDate:
            new Date(businessDate),

          shift,

          verificationTime:
            verificationTime || "",

          managerName:
            String(managerName).trim(),

          answers,

          questionResults:
            results.questionResults,

          failedItems:
            results.failedItems,

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

          generalRemarks:
            generalRemarks || "",

          status:
            results.unanswered > 0
              ? "Pending"
              : results.failed > 0
              ? "Failed"
              : "Completed",

          createdByUid:
            user.firebaseUid,

          createdByName:
            user.displayName || "",

          createdByEmail:
            user.email || "",

          submittedAt:
            new Date(),
        });

      await record.populate(
        "storeId",
        "storeNumber storeName contact email city region"
      );

      return res.status(201).json({
        success: true,
        message:
          "Food Safety Verification submitted successfully.",

        verification:
          normalizeVerification(record),
      });
    } catch (error) {
      console.error(
        "Create Verification Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to create verification.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GET ALL
|--------------------------------------------------------------------------
*/

export const getVerifications =
  async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user is required.",
        });
      }

      const {
        status,
        shift,
        storeNumber,
        businessDate,
        createdByUid,
      } = req.query;

      const filter = {};

      /*
      |--------------------------------------------------------------------------
      | Store security
      |--------------------------------------------------------------------------
      */

      if (!isAdmin(user)) {
        const storeId =
          getUserStoreId(user);

        if (!storeId) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
        }

        filter.storeId = storeId;
      }

      /*
      |--------------------------------------------------------------------------
      | Filters
      |--------------------------------------------------------------------------
      */

      if (status) {
        filter.status = status;
      }

      if (shift) {
        filter.shift = shift;
      }

      if (businessDate) {
        filter.businessDate =
          new Date(businessDate);
      }

      if (createdByUid) {
        filter.createdByUid =
          createdByUid;
      }

      /*
      |--------------------------------------------------------------------------
      | Store number
      |--------------------------------------------------------------------------
      */

      if (
        storeNumber &&
        isAdmin(user)
      ) {
        filter.storeNumber =
          String(storeNumber).trim();
      }

      const records =
        await FoodSafetyVerification
          .find(filter)
          .populate(
            "storeId",
            "storeNumber storeName contact email city region"
          )
          .sort({
            businessDate: -1,
            createdAt: -1,
          });

      const verifications =
        records.map(
          normalizeVerification
        );

      return res.status(200).json({
        success: true,

        count:
          verifications.length,

        verifications,
      });
    } catch (error) {
      console.error(
        "Get Verifications Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch verification records.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| GET SINGLE
|--------------------------------------------------------------------------
*/

export const getSingleVerification =
  async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      /*
      |--------------------------------------------------------------------------
      | Validate MongoDB ID
      |--------------------------------------------------------------------------
      */

      if (
        !id ||
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification ID.",
        });
      }

      const filter = {
        _id: id,
      };

      /*
      |--------------------------------------------------------------------------
      | Store account can ONLY access own store
      |--------------------------------------------------------------------------
      */

      if (!isAdmin(user)) {
        const storeId =
          getUserStoreId(user);

        if (!storeId) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
        }

        filter.storeId = storeId;
      }

      const record =
        await FoodSafetyVerification
          .findOne(filter)
          .populate(
            "storeId",
            "storeNumber storeName contact email city region"
          );

      if (!record) {
        return res.status(404).json({
          success: false,
          message:
            "Food Safety Verification record not found.",
        });
      }

      return res.status(200).json({
        success: true,

        verification:
          normalizeVerification(record),
      });
    } catch (error) {
      console.error(
        "Get Single Verification Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch verification.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

export const updateVerification =
  async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      if (
        !id ||
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification ID.",
        });
      }

      const filter = {
        _id: id,
      };

      /*
      |--------------------------------------------------------------------------
      | Store security
      |--------------------------------------------------------------------------
      */

      if (!isAdmin(user)) {
        const storeId =
          getUserStoreId(user);

        if (!storeId) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
        }

        filter.storeId = storeId;
      }

      const record =
        await FoodSafetyVerification.findOne(
          filter
        );

      if (!record) {
        return res.status(404).json({
          success: false,
          message:
            "Food Safety Verification record not found.",
        });
      }

      const {
        businessDate,
        shift,
        verificationTime,
        managerName,
        answers,
        generalRemarks,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Update regular fields
      |--------------------------------------------------------------------------
      */

      if (businessDate !== undefined) {
        record.businessDate =
          new Date(businessDate);
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

        record.shift = shift;
      }

      if (
        verificationTime !== undefined
      ) {
        record.verificationTime =
          verificationTime;
      }

      if (
        managerName !== undefined
      ) {
        record.managerName =
          String(managerName).trim();
      }

      if (
        generalRemarks !== undefined
      ) {
        record.generalRemarks =
          generalRemarks;
      }

      /*
      |--------------------------------------------------------------------------
      | Recalculate if answers changed
      |--------------------------------------------------------------------------
      */

      if (answers !== undefined) {
        const results =
          calculateVerificationResults(
            answers
          );

        record.answers =
          answers;

        record.questionResults =
          results.questionResults;

        record.failedItems =
          results.failedItems;

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

        /*
        |--------------------------------------------------------------------------
        | Automatically determine operational status
        |--------------------------------------------------------------------------
        */

        if (
          results.unanswered > 0
        ) {
          record.status =
            "Pending";
        } else if (
          results.failed > 0
        ) {
          record.status =
            "Failed";
        } else {
          record.status =
            "Completed";
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Admin review
      |--------------------------------------------------------------------------
      */

      if (
        isAdmin(user) &&
        req.body.status !== undefined
      ) {
        const allowedStatuses = [
          "Pending",
          "Completed",
          "Failed",
          "Reviewed",
        ];

        if (
          !allowedStatuses.includes(
            req.body.status
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid verification status.",
          });
        }

        record.status =
          req.body.status;
      }

      await record.save();

      await record.populate(
        "storeId",
        "storeNumber storeName contact email city region"
      );

      return res.status(200).json({
        success: true,
        message:
          "Food Safety Verification updated successfully.",

        verification:
          normalizeVerification(record),
      });
    } catch (error) {
      console.error(
        "Update Verification Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to update verification.",
      });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

export const deleteVerification =
  async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;

      if (
        !id ||
        !mongoose.Types.ObjectId.isValid(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid verification ID.",
        });
      }

      const filter = {
        _id: id,
      };

      /*
      |--------------------------------------------------------------------------
      | Store account security
      |--------------------------------------------------------------------------
      */

      if (!isAdmin(user)) {
        const storeId =
          getUserStoreId(user);

        if (!storeId) {
          return res.status(403).json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
        }

        filter.storeId = storeId;
      }

      const record =
        await FoodSafetyVerification.findOne(
          filter
        );

      if (!record) {
        return res.status(404).json({
          success: false,
          message:
            "Food Safety Verification record not found.",
        });
      }

      await record.deleteOne();

      return res.status(200).json({
        success: true,
        message:
          "Food Safety Verification deleted successfully.",
        id: String(id),
      });
    } catch (error) {
      console.error(
        "Delete Verification Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to delete verification.",
      });
    }
  };