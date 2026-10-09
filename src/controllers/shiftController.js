



// import mongoose from "mongoose";

// import Shift from "../models/Shift.js";
// import Store from "../models/Store.js";

// // ======================================================
// // HELPERS
// // ======================================================

// const getAccountType = (user) => {
//   return (
//     user?.accountType ||
//     (
//       user?.role === "Admin"
//         ? "admin"
//         : user?.role === "Store Account"
//         ? "store"
//         : ""
//     )
//   )
//     .toString()
//     .toLowerCase();
// };

// // ------------------------------------------------------
// // GET USER STORE ID
// // ------------------------------------------------------
// //
// // Handles all possible formats:
// //
// // req.user.storeId = ObjectId
// // req.user.storeId = "ObjectId string"
// // req.user.storeId = populated Store object
// //
// // If storeId is missing, we try storeNumber.
// //

// const resolveUserStoreId = async (
//   user
// ) => {
//   if (!user) {
//     return null;
//   }

//   const possibleStoreId =
//     user.storeId?._id ||
//     user.storeId;

//   if (
//     possibleStoreId &&
//     mongoose.Types.ObjectId.isValid(
//       possibleStoreId
//     )
//   ) {
//     return new mongoose.Types.ObjectId(
//       possibleStoreId
//     );
//   }

//   // ----------------------------------------------------
//   // FALLBACK: STORE NUMBER
//   // ----------------------------------------------------

//   if (user.storeNumber) {
//     const store =
//       await Store.findOne({
//         storeNumber:
//           user.storeNumber
//             .toString()
//             .trim(),
//       }).select("_id");

//     if (store) {
//       return store._id;
//     }
//   }

//   return null;
// };

// // ======================================================
// // CALCULATE CHECKLIST PROGRESS
// // ======================================================

// const calculateChecklistProgress = (
//   checklist = []
// ) => {
//   let totalTasks = 0;
//   let completedTasks = 0;

//   if (!Array.isArray(checklist)) {
//     return {
//       totalTasks: 0,
//       completedTasks: 0,
//       score: 0,
//     };
//   }

//   checklist.forEach(
//     (group) => {
//       if (
//         !Array.isArray(
//           group?.sections
//         )
//       ) {
//         return;
//       }

//       group.sections.forEach(
//         (section) => {
//           if (
//             !Array.isArray(
//               section?.tasks
//             )
//           ) {
//             return;
//           }

//           section.tasks.forEach(
//             (task) => {
//               totalTasks += 1;

//               if (
//                 task?.completed === true
//               ) {
//                 completedTasks += 1;
//               }
//             }
//           );
//         }
//       );
//     }
//   );

//   const score =
//     totalTasks > 0
//       ? Math.round(
//           (completedTasks /
//             totalTasks) *
//             100
//         )
//       : 0;

//   return {
//     totalTasks,
//     completedTasks,
//     score,
//   };
// };

// // ======================================================
// // NORMALIZE SHIFT
// // ======================================================
// //
// // Calculates completion from checklist instead of
// // blindly trusting old score values.
// //

// const normalizeShift = (
//   shift
// ) => {
//   if (!shift) {
//     return shift;
//   }

//   const data =
//     typeof shift.toObject ===
//     "function"
//       ? shift.toObject()
//       : { ...shift };

//   const progress =
//     calculateChecklistProgress(
//       data.checklist
//     );

//   /*
//    * If the shift actually has checklist
//    * tasks, checklist is the source of truth.
//    */
//   if (
//     progress.totalTasks > 0
//   ) {
//     data.totalTasks =
//       progress.totalTasks;

//     data.completedTasks =
//       progress.completedTasks;

//     data.score =
//       progress.score;
//   }

//   return data;
// };

// // ======================================================
// // GET ALL SHIFTS
// // ======================================================

// export const getShifts = async (
//   req,
//   res
// ) => {
//   try {
//     const {
//       storeNumber,
//       status,
//     } = req.query;

//     const accountType =
//       getAccountType(
//         req.user
//       );

//     const filter = {};

//     // ==================================================
//     // STORE ACCOUNT
//     // ==================================================

//     if (
//       accountType === "store"
//     ) {
//       const userStoreId =
//         await resolveUserStoreId(
//           req.user
//         );

//       if (!userStoreId) {
//         return res.status(403).json({
//           success: false,
//           message:
//             "Your account is not assigned to a valid store.",
//         });
//       }

//       filter.storeId =
//         userStoreId;
//     }

//     // ==================================================
//     // ADMIN
//     // ==================================================

//     if (
//       accountType === "admin" &&
//       storeNumber
//     ) {
//       filter.storeNumber =
//         storeNumber
//           .toString()
//           .trim();
//     }

//     // ==================================================
//     // STATUS
//     // ==================================================

//     if (status) {
//       filter.status =
//         status;
//     }

//     const shifts =
//       await Shift.find(filter)
//         .sort({
//           createdAt: -1,
//         })
//         .lean();

//     const normalizedShifts =
//       shifts.map(
//         normalizeShift
//       );

//     return res.json({
//       success: true,
//       count:
//         normalizedShifts.length,
//       shifts:
//         normalizedShifts,
//     });
//   } catch (error) {
//     console.error(
//       "Get shifts error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message:
//         "Failed to fetch shifts.",
//     });
//   }
// };

// // ======================================================
// // GET SINGLE SHIFT
// // ======================================================

// export const getSingleShift =
//   async (req, res) => {
//     try {
//       const { id } =
//         req.params;

//       // ------------------------------------------------
//       // VALIDATE ID
//       // ------------------------------------------------

//       if (
//         !mongoose.Types.ObjectId.isValid(
//           id
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid shift ID.",
//         });
//       }

//       // ------------------------------------------------
//       // FIND SHIFT
//       // ------------------------------------------------

//       const shift =
//         await Shift.findById(
//           id
//         ).lean();

//       if (!shift) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Shift not found.",
//         });
//       }

//       const accountType =
//         getAccountType(
//           req.user
//         );

//       // =================================================
//       // STORE ACCOUNT SECURITY
//       // =================================================

//       if (
//         accountType === "store"
//       ) {
//         const userStoreId =
//           await resolveUserStoreId(
//             req.user
//           );

//         if (!userStoreId) {
//           return res.status(403).json({
//             success: false,
//             message:
//               "Your account is not assigned to a valid store.",
//           });
//         }

//         const shiftStoreId =
//           shift.storeId?._id ||
//           shift.storeId;

//         if (!shiftStoreId) {
//           return res.status(403).json({
//             success: false,
//             message:
//               "This shift is not assigned to a store.",
//           });
//         }

//         const userStoreIdString =
//           userStoreId.toString();

//         const shiftStoreIdString =
//           shiftStoreId.toString();

//         console.log(
//           "========== SHIFT ACCESS =========="
//         );

//         console.log(
//           "Account type:",
//           accountType
//         );

//         console.log(
//           "User store ID:",
//           userStoreIdString
//         );

//         console.log(
//           "Shift store ID:",
//           shiftStoreIdString
//         );

//         console.log(
//           "Same store:",
//           userStoreIdString ===
//             shiftStoreIdString
//         );

//         console.log(
//           "==================================="
//         );

//         if (
//           userStoreIdString !==
//           shiftStoreIdString
//         ) {
//           return res.status(403).json({
//             success: false,
//             message:
//               "You are not authorized to access this shift.",
//           });
//         }
//       }

//       // =================================================
//       // NORMALIZE
//       // =================================================

//       const normalizedShift =
//         normalizeShift(
//           shift
//         );

//       return res.json({
//         success: true,
//         shift:
//           normalizedShift,
//       });
//     } catch (error) {
//       console.error(
//         "Get single shift error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Failed to fetch shift.",
//       });
//     }
//   };

// // ======================================================
// // CREATE SHIFT
// // ======================================================

// export const createShift =
//   async (req, res) => {
//     try {
//       const {
//         title,
//         shiftDate,
//         startTime,
//         endTime,
//         shiftType,
//         managerName,
//         managerUid,
//         notes,
//         issues,
//         handover,
//         checklist,
//         tasks,
//       } = req.body;

//       // =================================================
//       // VALIDATION
//       // =================================================

//       if (!shiftDate) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Shift date is required.",
//         });
//       }

//       if (!startTime) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Start time is required.",
//         });
//       }

//       if (!endTime) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "End time is required.",
//         });
//       }

//       // =================================================
//       // DETERMINE STORE
//       // =================================================

//       let store = null;

//       const accountType =
//         getAccountType(
//           req.user
//         );

//       // -------------------------------------------------
//       // STORE ACCOUNT
//       // -------------------------------------------------

//       if (
//         accountType === "store"
//       ) {
//         const userStoreId =
//           await resolveUserStoreId(
//             req.user
//           );

//         if (!userStoreId) {
//           return res.status(403).json({
//             success: false,
//             message:
//               "Your account is not assigned to a valid store.",
//           });
//         }

//         store =
//           await Store.findById(
//             userStoreId
//           );
//       }

//       // -------------------------------------------------
//       // ADMIN
//       // -------------------------------------------------

//       if (
//         accountType === "admin"
//       ) {
//         const {
//           storeId,
//           storeNumber,
//         } = req.body;

//         if (storeId) {
//           if (
//             !mongoose.Types.ObjectId.isValid(
//               storeId
//             )
//           ) {
//             return res.status(400).json({
//               success: false,
//               message:
//                 "Invalid store ID.",
//             });
//           }

//           store =
//             await Store.findById(
//               storeId
//             );
//         } else if (
//           storeNumber
//         ) {
//           store =
//             await Store.findOne({
//               storeNumber:
//                 storeNumber
//                   .toString()
//                   .trim(),
//             });
//         }
//       }

//       // =================================================
//       // STORE VALIDATION
//       // =================================================

//       if (!store) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "A valid store is required to create a shift.",
//         });
//       }

//       // =================================================
//       // CHECKLIST
//       // =================================================

//       const safeChecklist =
//         Array.isArray(
//           checklist
//         )
//           ? checklist
//           : [];

//       const progress =
//         calculateChecklistProgress(
//           safeChecklist
//         );

//       // =================================================
//       // CREATE
//       // =================================================

//       const shift =
//         await Shift.create({
//           storeId:
//             store._id,

//           storeNumber:
//             store.storeNumber,

//           storeName:
//             store.storeName,

//           title:
//             title?.trim() ||
//             `${shiftType?.trim() || "Regular"} Shift`,

//           shiftDate:
//             new Date(
//               shiftDate
//             ),

//           startTime:
//             startTime.trim(),

//           endTime:
//             endTime.trim(),

//           shiftType:
//             shiftType?.trim() ||
//             "Regular",

//           managerName:
//             managerName?.trim() ||
//             "",

//           managerUid:
//             managerUid?.trim() ||
//             "",

//           notes:
//             notes?.trim() ||
//             "",

//           issues:
//             typeof issues ===
//             "string"
//               ? issues.trim()
//               : "",

//           handover:
//             handover?.trim() ||
//             "",

//           checklist:
//             safeChecklist,

//           tasks:
//             tasks || {},

//           completedTasks:
//             progress.completedTasks,

//           totalTasks:
//             progress.totalTasks,

//           score:
//             progress.score,

//           status:
//             "Pending",

//           createdByUid:
//             req.firebaseUser.uid,

//           createdByName:
//             req.firebaseUser.name ||
//             req.user.displayName ||
//             "",

//           createdByEmail:
//             req.firebaseUser.email ||
//             req.user.email ||
//             "",
//         });

//       return res.status(201).json({
//         success: true,
//         message:
//           "Shift created successfully.",
//         shift:
//           normalizeShift(
//             shift
//           ),
//       });
//     } catch (error) {
//       console.error(
//         "Create shift error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Failed to create shift.",
//       });
//     }
//   };

// // ======================================================
// // UPDATE SHIFT
// // ======================================================

// export const updateShift =
//   async (req, res) => {
//     try {
//       const { id } =
//         req.params;

//       if (
//         !mongoose.Types.ObjectId.isValid(
//           id
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid shift ID.",
//         });
//       }

//       const shift =
//         await Shift.findById(
//           id
//         );

//       if (!shift) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Shift not found.",
//         });
//       }

//       const accountType =
//         getAccountType(
//           req.user
//         );

//       // =================================================
//       // STORE SECURITY
//       // =================================================

//       if (
//         accountType === "store"
//       ) {
//         const userStoreId =
//           await resolveUserStoreId(
//             req.user
//           );

//         const shiftStoreId =
//           shift.storeId?._id ||
//           shift.storeId;

//         if (
//           !userStoreId ||
//           !shiftStoreId ||
//           userStoreId.toString() !==
//             shiftStoreId.toString()
//         ) {
//           return res.status(403).json({
//             success: false,
//             message:
//               "You are not authorized to update this shift.",
//           });
//         }
//       }

//       // =================================================
//       // SAFE FIELDS
//       // =================================================

//       const allowedFields = [
//         "title",
//         "businessDate",
//         "startTime",
//         "endTime",
//         "shiftType",
//         "managerName",
//         "managerUid",
//         "notes",
//         "issues",
//         "handover",
//         "checklist",
//         "tasks",
//         "managerComment",
//         "verified",
//       ];

//       allowedFields.forEach(
//         (field) => {
//           if (
//             req.body[field] !==
//             undefined
//           ) {
//             shift[field] =
//               req.body[field];
//           }
//         }
//       );

//       // =================================================
//       // CHECKLIST PROGRESS
//       // =================================================

//       if (
//         req.body.checklist !==
//         undefined
//       ) {
//         const progress =
//           calculateChecklistProgress(
//             shift.checklist
//           );

//         shift.totalTasks =
//           progress.totalTasks;

//         shift.completedTasks =
//           progress.completedTasks;

//         shift.score =
//           progress.score;
//       }

//       // =================================================
//       // STATUS
//       // =================================================

//       if (
//         req.body.status !==
//         undefined
//       ) {
//         shift.status =
//           req.body.status;
//       }

//       // =================================================
//       // APPROVED
//       // =================================================

//       if (
//         req.body.status ===
//         "Approved"
//       ) {
//         shift.approvedByUid =
//           req.firebaseUser.uid;

//         shift.approvedByName =
//           req.firebaseUser.name ||
//           req.user.displayName ||
//           "";

//         shift.approvedAt =
//           new Date();
//       }

//       // =================================================
//       // COMPLETED
//       // =================================================

//       if (
//         req.body.status ===
//         "Completed"
//       ) {
//         shift.completedAt =
//           new Date();
//       }

//       await shift.save();

//       return res.json({
//         success: true,
//         message:
//           "Shift updated successfully.",
//         shift:
//           normalizeShift(
//             shift
//           ),
//       });
//     } catch (error) {
//       console.error(
//         "Update shift error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Failed to update shift.",
//       });
//     }
//   };

// // ======================================================
// // DELETE SHIFT
// // ======================================================

// export const deleteShift =
//   async (req, res) => {
//     try {
//       const { id } =
//         req.params;

//       if (
//         !mongoose.Types.ObjectId.isValid(
//           id
//         )
//       ) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid shift ID.",
//         });
//       }

//       const shift =
//         await Shift.findById(
//           id
//         );

//       if (!shift) {
//         return res.status(404).json({
//           success: false,
//           message:
//             "Shift not found.",
//         });
//       }

//       const accountType =
//         getAccountType(
//           req.user
//         );

//       // =================================================
//       // STORE SECURITY
//       // =================================================

//       if (
//         accountType === "store"
//       ) {
//         const userStoreId =
//           await resolveUserStoreId(
//             req.user
//           );

//         const shiftStoreId =
//           shift.storeId?._id ||
//           shift.storeId;

//         if (
//           !userStoreId ||
//           !shiftStoreId ||
//           userStoreId.toString() !==
//             shiftStoreId.toString()
//         ) {
//           return res.status(403).json({
//             success: false,
//             message:
//               "You are not authorized to delete this shift.",
//           });
//         }
//       }

//       await Shift.findByIdAndDelete(
//         id
//       );

//       return res.json({
//         success: true,
//         message:
//           "Shift deleted successfully.",
//       });
//     } catch (error) {
//       console.error(
//         "Delete shift error:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         message:
//           "Failed to delete shift.",
//       });
//     }
//   };



import mongoose from "mongoose";
import Shift from "../models/Shift.js";
import Store from "../models/Store.js";

/* =========================================================
   HELPERS
========================================================= */

const str = (value) =>
  value === null || value === undefined
    ? ""
    : String(value).trim();

const getAccountType = (user) => {
  const type = str(user?.accountType || user?.role).toLowerCase();

  if (["admin", "superadmin", "super admin"].includes(type)) {
    return "admin";
  }

  if (["store", "store account"].includes(type)) {
    return "store";
  }

  return "";
};

const getFirebaseUid = (req) =>
  str(
    req.firebaseUser?.uid ||
    req.user?.firebaseUid ||
    req.user?.uid
  );

const getActorName = (req) =>
  str(
    req.firebaseUser?.name ||
    req.user?.displayName ||
    req.user?.fullName ||
    req.user?.name
  );

const getActorEmail = (req) =>
  str(req.firebaseUser?.email || req.user?.email).toLowerCase();

const isValidId = (id) =>
  mongoose.isValidObjectId(id);

const sendError = (res, status, message) =>
  res.status(status).json({
    success: false,
    message,
  });

const handleError = (res, error, operation) => {
  console.error(`[SHIFT ${operation} ERROR]`, {
    name: error.name,
    message: error.message,
    stack: error.stack,
    errors: error.errors
      ? Object.fromEntries(
          Object.entries(error.errors).map(([field, detail]) => [
            field,
            detail.message,
          ])
        )
      : undefined,
  });

  if (error.name === "ValidationError") {
    return sendError(
      res,
      400,
      Object.values(error.errors)
        .map((item) => item.message)
        .join("; ")
    );
  }

  if (error.name === "CastError") {
    return sendError(res, 400, `Invalid value for ${error.path}.`);
  }

  return sendError(res, 500, `Failed to ${operation.toLowerCase()} shift.`);
};

/* =========================================================
   STORE RESOLUTION
========================================================= */

const resolveUserStoreId = async (user) => {
  if (!user) return null;

  const rawStoreId = user.storeId?._id || user.storeId;

  if (rawStoreId && isValidId(rawStoreId)) {
    const store = await Store.findById(rawStoreId).select("_id");
    if (store) return store._id;
  }

  const storeNumber = str(user.storeNumber);

  if (storeNumber) {
    const store = await Store.findOne({
      storeNumber,
    }).select("_id");

    if (store) return store._id;
  }

  return null;
};

const resolveRequestedStore = async (req, accountType) => {
  if (accountType === "store") {
    const storeId = await resolveUserStoreId(req.user);

    return storeId ? Store.findById(storeId) : null;
  }

  if (accountType === "admin") {
    const rawId = req.body.storeId?._id || req.body.storeId;

    if (rawId) {
      if (!isValidId(rawId)) return null;
      return Store.findById(rawId);
    }

    const storeNumber = str(req.body.storeNumber);

    if (storeNumber) {
      return Store.findOne({ storeNumber });
    }

    // Admin account may also be assigned to a store.
    const assignedStoreId = await resolveUserStoreId(req.user);

    if (assignedStoreId) {
      return Store.findById(assignedStoreId);
    }
  }

  return null;
};

const canAccessShift = async (req, shift, accountType) => {
  if (accountType === "admin") return true;
  if (accountType !== "store") return false;

  const userStoreId = await resolveUserStoreId(req.user);

  return Boolean(
    userStoreId &&
    shift.storeId &&
    String(userStoreId) === String(shift.storeId?._id || shift.storeId)
  );
};

/* =========================================================
   CHECKLIST NORMALIZATION

   Converts frontend:
   { id, title, completed }

   Into schema-compatible:
   { id, task, title, completed }
========================================================= */

const normalizeChecklist = (checklist = []) => {
  if (!Array.isArray(checklist)) return [];

  return checklist.map((group, groupIndex) => ({
    title: str(group?.title || `Checklist ${groupIndex + 1}`),

    sections: Array.isArray(group?.sections)
      ? group.sections.map((section, sectionIndex) => ({
          area: str(
            section?.area ||
            section?.title ||
            `Section ${sectionIndex + 1}`
          ),

          tasks: Array.isArray(section?.tasks)
            ? section.tasks.map((item, taskIndex) => {
                const label =
                  typeof item === "string"
                    ? item
                    : item?.task ||
                      item?.title ||
                      item?.label ||
                      item?.name ||
                      "";

                return {
                  id: str(
                    typeof item === "object" && item !== null
                      ? item.id ||
                        item.taskId ||
                        `${groupIndex}-${sectionIndex}-${taskIndex}`
                      : `${groupIndex}-${sectionIndex}-${taskIndex}`
                  ),
                  task: str(label),
                  title: str(label),
                  completed:
                    typeof item === "object" &&
                    item !== null &&
                    item.completed === true,
                };
              })
            : [],
        }))
      : [],
  }));
};

const calculateChecklistProgress = (checklist = []) => {
  let totalTasks = 0;
  let completedTasks = 0;

  for (const group of checklist) {
    for (const section of group.sections || []) {
      for (const task of section.tasks || []) {
        totalTasks++;

        if (task.completed === true) {
          completedTasks++;
        }
      }
    }
  }

  return {
    totalTasks,
    completedTasks,
    score: totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0,
  };
};

const normalizeShift = (shift) => {
  if (!shift) return null;

  const data =
    typeof shift.toObject === "function"
      ? shift.toObject({ virtuals: true })
      : { ...shift };

  data.id = str(data._id);

  if (data.tasks instanceof Map) {
    data.tasks = Object.fromEntries(data.tasks);
  }

  if (Array.isArray(data.checklist) && data.checklist.length) {
    const progress = calculateChecklistProgress(data.checklist);

    Object.assign(data, progress);
  }

  data.checklistScore = data.score || 0;
  data.completionPercentage = data.score || 0;

  return data;
};

const normalizeTasksMap = (tasks) => {
  if (!tasks || typeof tasks !== "object" || Array.isArray(tasks)) {
    return {};
  }

  const source = tasks instanceof Map
    ? Object.fromEntries(tasks)
    : tasks;

  const result = {};

  for (const [key, value] of Object.entries(source)) {
    // Mongoose Map keys cannot contain "." or begin with "$".
    if (!key || key.includes(".") || key.startsWith("$")) continue;

    result[key] = value === true;
  }

  return result;
};

const parseShiftDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const validateChecklist = (checklist) => {
  for (const group of checklist) {
    for (const section of group.sections) {
      for (const task of section.tasks) {
        if (!task.task) {
          return "Every checklist task must have a description.";
        }
      }
    }
  }

  return null;
};

const VALID_STATUSES = [
  "Draft",
  "Pending",
  "Approved",
  "Rejected",
  "In Progress",
  "Completed",
  "Cancelled",
];

/* =========================================================
   GET ALL SHIFTS
========================================================= */

export const getShifts = async (req, res) => {
  try {
    const accountType = getAccountType(req.user);

    if (!accountType) {
      return sendError(res, 403, "Unauthorized account type.");
    }

    const filter = {};

    if (accountType === "store") {
      const storeId = await resolveUserStoreId(req.user);

      if (!storeId) {
        return sendError(res, 403, "Your account has no valid store.");
      }

      filter.storeId = storeId;
    }

    if (accountType === "admin") {
      if (req.query.storeNumber) {
        filter.storeNumber = str(req.query.storeNumber);
      }

      if (req.query.storeId) {
        if (!isValidId(req.query.storeId)) {
          return sendError(res, 400, "Invalid store ID.");
        }

        filter.storeId = req.query.storeId;
      }
    }

    if (req.query.status) {
      const status = str(req.query.status);

      if (!VALID_STATUSES.includes(status)) {
        return sendError(res, 400, "Invalid shift status.");
      }

      filter.status = status;
    }

    const shifts = await Shift.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const results = shifts.map(normalizeShift);

    return res.status(200).json({
      success: true,
      count: results.length,
      shifts: results,
    });
  } catch (error) {
    return handleError(res, error, "Fetch");
  }
};

/* =========================================================
   GET SINGLE SHIFT
========================================================= */

export const getSingleShift = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid shift ID.");
    }

    const accountType = getAccountType(req.user);

    if (!accountType) {
      return sendError(res, 403, "Unauthorized account type.");
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return sendError(res, 404, "Shift not found.");
    }

    if (!(await canAccessShift(req, shift, accountType))) {
      return sendError(
        res,
        403,
        "You are not authorized to access this shift."
      );
    }

    return res.status(200).json({
      success: true,
      shift: normalizeShift(shift),
    });
  } catch (error) {
    return handleError(res, error, "Fetch");
  }
};

/* =========================================================
   CREATE SHIFT
========================================================= */

export const createShift = async (req, res) => {
  try {
    const accountType = getAccountType(req.user);

    if (!accountType) {
      return sendError(res, 403, "Unauthorized account type.");
    }

    const creatorUid = getFirebaseUid(req);

    if (!creatorUid) {
      return sendError(
        res,
        401,
        "Authentication UID is missing. Please sign in again."
      );
    }

    const {
      title,
      shiftType,
      managerName,
      managerUid,
      startTime,
      endTime,
      notes,
      issues,
      handover,
      checklist,
      tasks,
    } = req.body;

    const shiftDate = parseShiftDate(
      req.body.shiftDate || req.body.businessDate
    );

    if (!shiftDate) {
      return sendError(res, 400, "A valid business date is required.");
    }

    if (!str(startTime)) {
      return sendError(res, 400, "Start time is required.");
    }

    if (!str(endTime)) {
      return sendError(res, 400, "End time is required.");
    }

    const store = await resolveRequestedStore(req, accountType);

    if (!store) {
      return sendError(
        res,
        400,
        "A valid store is required to create a shift."
      );
    }

    const safeChecklist = normalizeChecklist(checklist);

    const checklistError = validateChecklist(safeChecklist);

    if (checklistError) {
      return sendError(res, 400, checklistError);
    }

    const progress = calculateChecklistProgress(safeChecklist);

    const shift = await Shift.create({
      storeId: store._id,
      storeNumber: str(store.storeNumber),
      storeName: str(store.storeName),

      title: str(title) || `${str(shiftType) || "Regular"} Shift`,
      shiftDate,
      startTime: str(startTime),
      endTime: str(endTime),
      shiftType: str(shiftType) || "Regular",

      managerName: str(managerName),
      managerUid: str(managerUid),

      notes: str(notes),
      issues: str(issues),
      handover: str(handover),

      checklist: safeChecklist,
      tasks: normalizeTasksMap(tasks),

      totalTasks: progress.totalTasks,
      completedTasks: progress.completedTasks,
      score: progress.score,

      status: "Pending",

      createdByUid: creatorUid,
      createdBy: getActorName(req),
      createdByName: getActorName(req),
      createdByEmail: getActorEmail(req),
    });

    return res.status(201).json({
      success: true,
      message: "Shift created successfully.",
      shift: normalizeShift(shift),
    });
  } catch (error) {
    return handleError(res, error, "Create");
  }
};

/* =========================================================
   UPDATE SHIFT
========================================================= */

export const updateShift = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid shift ID.");
    }

    const accountType = getAccountType(req.user);

    if (!accountType) {
      return sendError(res, 403, "Unauthorized account type.");
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return sendError(res, 404, "Shift not found.");
    }

    if (!(await canAccessShift(req, shift, accountType))) {
      return sendError(
        res,
        403,
        "You are not authorized to update this shift."
      );
    }

    const allowedFields = [
      "title",
      "startTime",
      "endTime",
      "shiftType",
      "managerName",
      "managerUid",
      "notes",
      "issues",
      "handover",
      "managerComment",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        shift[field] = str(req.body[field]);
      }
    }

    if (
      req.body.shiftDate !== undefined ||
      req.body.businessDate !== undefined
    ) {
      const date = parseShiftDate(
        req.body.shiftDate || req.body.businessDate
      );

      if (!date) {
        return sendError(res, 400, "Invalid business date.");
      }

      shift.shiftDate = date;
    }

    if (req.body.checklist !== undefined) {
      if (!Array.isArray(req.body.checklist)) {
        return sendError(res, 400, "Checklist must be an array.");
      }

      const safeChecklist = normalizeChecklist(req.body.checklist);

      const checklistError = validateChecklist(safeChecklist);

      if (checklistError) {
        return sendError(res, 400, checklistError);
      }

      shift.checklist = safeChecklist;

      const progress = calculateChecklistProgress(safeChecklist);

      shift.totalTasks = progress.totalTasks;
      shift.completedTasks = progress.completedTasks;
      shift.score = progress.score;
    }

    if (req.body.tasks !== undefined) {
      shift.tasks = normalizeTasksMap(req.body.tasks);
    }

    // Verification is an administrative action.
    if (req.body.verified !== undefined) {
      if (accountType !== "admin") {
        return sendError(
          res,
          403,
          "Only administrators can verify shifts."
        );
      }

      if (typeof req.body.verified !== "boolean") {
        return sendError(res, 400, "Verified must be a boolean.");
      }

      shift.verified = req.body.verified;
    }

    if (req.body.status !== undefined) {
      const nextStatus = str(req.body.status);

      if (!VALID_STATUSES.includes(nextStatus)) {
        return sendError(res, 400, "Invalid shift status.");
      }

      const adminOnlyStatuses = [
        "Approved",
        "Rejected",
        "Cancelled",
      ];

      if (
        adminOnlyStatuses.includes(nextStatus) &&
        accountType !== "admin"
      ) {
        return sendError(
          res,
          403,
          "Only administrators can set this shift status."
        );
      }

      // Prevent store accounts from changing an
      // already approved or rejected shift.
      if (
        accountType !== "admin" &&
        ["Approved", "Rejected", "Cancelled"].includes(shift.status) &&
        nextStatus !== shift.status
      ) {
        return sendError(
          res,
          403,
          "This shift status can only be changed by an administrator."
        );
      }

      const previousStatus = shift.status;
      shift.status = nextStatus;

      if (nextStatus === "Approved" && previousStatus !== "Approved") {
        shift.approvedByUid = getFirebaseUid(req);
        shift.approvedByName = getActorName(req);
        shift.approvedAt = new Date();
      }

      if (nextStatus === "Completed" && previousStatus !== "Completed") {
        shift.completedAt = new Date();
      }
    }

    await shift.save();

    return res.status(200).json({
      success: true,
      message: "Shift updated successfully.",
      shift: normalizeShift(shift),
    });
  } catch (error) {
    return handleError(res, error, "Update");
  }
};

/* =========================================================
   DELETE SHIFT
========================================================= */

export const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendError(res, 400, "Invalid shift ID.");
    }

    const accountType = getAccountType(req.user);

    if (!accountType) {
      return sendError(res, 403, "Unauthorized account type.");
    }

    const shift = await Shift.findById(id);

    if (!shift) {
      return sendError(res, 404, "Shift not found.");
    }

    if (!(await canAccessShift(req, shift, accountType))) {
      return sendError(
        res,
        403,
        "You are not authorized to delete this shift."
      );
    }

    // Approved or completed shifts should not be deleted
    // by store accounts.
    if (
      accountType !== "admin" &&
      ["Approved", "Completed"].includes(shift.status)
    ) {
      return sendError(
        res,
        403,
        "Only administrators can delete approved or completed shifts."
      );
    }

    await shift.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Shift deleted successfully.",
    });
  } catch (error) {
    return handleError(res, error, "Delete");
  }
};
