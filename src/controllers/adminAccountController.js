// // src/controllers/adminAccountController.js

// import mongoose from "mongoose";

// import User from "../models/User.js";
// import firebaseAdmin from "../config/firebaseAdmin.js";

// /*
// |--------------------------------------------------------------------------
// | Constants
// |--------------------------------------------------------------------------
// */

// const VALID_ROLE_LEVELS = [
//   "Super Admin",
//   "System Admin",
//   "Operations Admin",
//   "Read-only Admin",
// ];

// const VALID_STATUSES = [
//   "Active",
//   "Inactive",
// ];

// const VALID_PERMISSIONS = [
//   // Stores
//   "stores.read",
//   "stores.manage",

//   // Shift Management
//   "shifts.read",
//   "shifts.manage",

//   // Issues
//   "issues.read",
//   "issues.manage",

//   // Food Safety
//   "foodSafety.read",
//   "foodSafety.review",

//   // Maintenance
//   "maintenance.read",
//   "maintenance.review",

//   // Cash Turnover
//   "cashTurnover.read",
//   "cashTurnover.review",

//   // Cash Audit
//   "cashAudit.read",
//   "cashAudit.review",

//   // Reports
//   "reports.read",
//   "analytics.read",

//   // System
//   "accounts.manage",
//   "settings.manage",
//   "auditLogs.read",
// ];

// /*
// |--------------------------------------------------------------------------
// | Helpers
// |--------------------------------------------------------------------------
// */

// const cleanString = (value) =>
//   String(value ?? "").trim();

// const normalizeEmail = (value) =>
//   cleanString(value).toLowerCase();

// const isValidObjectId = (value) =>
//   mongoose.Types.ObjectId.isValid(
//     String(value || "")
//   );

// const isAdminAccount = (user) => {
//   const role = cleanString(
//     user?.role
//   ).toLowerCase();

//   const accountType = cleanString(
//     user?.accountType
//   ).toLowerCase();

//   return (
//     role === "admin" ||
//     accountType === "admin"
//   );
// };

// const isSuperAdmin = (user) =>
//   cleanString(
//     user?.roleLevel
//   ).toLowerCase() ===
//   "super admin";

// const hasPermission = (
//   user,
//   permission
// ) => {
//   const permissions =
//     Array.isArray(
//       user?.permissions
//     )
//       ? user.permissions
//       : [];

//   return permissions.includes(
//     permission
//   );
// };

// const canManageAccounts = (
//   user
// ) =>
//   isAdminAccount(user) &&
//   (
//     isSuperAdmin(user) ||
//     hasPermission(
//       user,
//       "accounts.manage"
//     )
//   );

// const normalizePermissions = (
//   permissions
// ) => {
//   if (
//     !Array.isArray(
//       permissions
//     )
//   ) {
//     return [];
//   }

//   return [
//     ...new Set(
//       permissions
//         .map(cleanString)
//         .filter((permission) =>
//           VALID_PERMISSIONS.includes(
//             permission
//           )
//         )
//     ),
//   ];
// };

// const validatePermissions = (
//   permissions
// ) => {
//   if (
//     !Array.isArray(
//       permissions
//     )
//   ) {
//     return {
//       valid: false,
//       message:
//         "Permissions must be an array.",
//     };
//   }

//   const invalid =
//     permissions.filter(
//       (permission) =>
//         !VALID_PERMISSIONS.includes(
//           cleanString(
//             permission
//           )
//         )
//     );

//   if (invalid.length) {
//     return {
//       valid: false,

//       message:
//         `Invalid permissions: ${invalid.join(
//           ", "
//         )}`,
//     };
//   }

//   return {
//     valid: true,
//   };
// };

// const getCreatorInfo = (
//   req
// ) => ({
//   createdByUid:
//     req.user
//       ?.firebaseUid ||
//     req.firebaseUser
//       ?.uid ||
//     "",

//   createdByName:
//     req.user
//       ?.displayName ||
//     req.user
//       ?.name ||
//     req.firebaseUser
//       ?.name ||
//     "Administrator",
// });

// const formatAdmin = (
//   user
// ) => {
//   if (!user) {
//     return null;
//   }

//   const object =
//     typeof user.toObject ===
//     "function"
//       ? user.toObject()
//       : user;

//   return {
//     id:
//       String(
//         object._id
//       ),

//     _id:
//       object._id,

//     firebaseUid:
//       object.firebaseUid,

//     displayName:
//       object.displayName,

//     email:
//       object.email,

//     role:
//       object.role,

//     accountType:
//       object.accountType,

//     roleLevel:
//       object.roleLevel,

//     permissions:
//       Array.isArray(
//         object.permissions
//       )
//         ? object.permissions
//         : [],

//     status:
//       object.status,

//     createdByUid:
//       object.createdByUid,

//     createdByName:
//       object.createdByName,

//     lastLogin:
//       object.lastLogin,

//     createdAt:
//       object.createdAt,

//     updatedAt:
//       object.updatedAt,
//   };
// };

// const ensureAdminManager = (
//   req,
//   res
// ) => {
//   if (
//     !canManageAccounts(
//       req.user
//     )
//   ) {
//     res.status(403).json({
//       success: false,

//       message:
//         "You do not have permission to manage administrator accounts.",
//     });

//     return false;
//   }

//   return true;
// };

// /*
// |--------------------------------------------------------------------------
// | Get Administrator Accounts
// |--------------------------------------------------------------------------
// |
// | GET /api/admin-accounts
// |
// */

// export const getAdminAccounts =
//   async (req, res) => {
//     try {
//       if (
//         !ensureAdminManager(
//           req,
//           res
//         )
//       ) {
//         return;
//       }

//       const {
//         search,
//         status,
//         roleLevel,
//         page = 1,
//         limit = 50,
//       } = req.query;

//       const query = {
//         $or: [
//           {
//             role: "Admin",
//           },
//           {
//             accountType:
//               "admin",
//           },
//         ],
//       };

//       /*
//       |--------------------------------------------------------------------------
//       | Status
//       |--------------------------------------------------------------------------
//       */

//       if (
//         status &&
//         VALID_STATUSES.includes(
//           cleanString(status)
//         )
//       ) {
//         query.status =
//           cleanString(status);
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Role Level
//       |--------------------------------------------------------------------------
//       */

//       if (
//         roleLevel &&
//         VALID_ROLE_LEVELS.includes(
//           cleanString(
//             roleLevel
//           )
//         )
//       ) {
//         query.roleLevel =
//           cleanString(
//             roleLevel
//           );
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Search
//       |--------------------------------------------------------------------------
//       */

//       if (
//         cleanString(search)
//       ) {
//         const escaped =
//           cleanString(
//             search
//           ).replace(
//             /[.*+?^${}()|[\]\\]/g,
//             "\\$&"
//           );

//         const regex =
//           new RegExp(
//             escaped,
//             "i"
//           );

//         query.$and = [
//           {
//             $or: [
//               {
//                 displayName:
//                   regex,
//               },
//               {
//                 email: regex,
//               },
//               {
//                 roleLevel:
//                   regex,
//               },
//             ],
//           },
//         ];
//       }

//       const safePage =
//         Math.max(
//           1,
//           Number(page) || 1
//         );

//       const safeLimit =
//         Math.min(
//           100,
//           Math.max(
//             1,
//             Number(limit) ||
//               50
//           )
//         );

//       const skip =
//         (safePage - 1) *
//         safeLimit;

//       const [
//         admins,
//         total,
//       ] =
//         await Promise.all([
//           User.find(query)
//             .sort({
//               createdAt: -1,
//             })
//             .skip(skip)
//             .limit(
//               safeLimit
//             ),

//           User.countDocuments(
//             query
//           ),
//         ]);

//       return res
//         .status(200)
//         .json({
//           success: true,

//           records:
//             admins.map(
//               formatAdmin
//             ),

//           pagination: {
//             page:
//               safePage,

//             limit:
//               safeLimit,

//             total,

//             pages:
//               Math.ceil(
//                 total /
//                   safeLimit
//               ),
//           },
//         });
//     } catch (error) {
//       console.error(
//         "Get Admin Accounts Error:",
//         error
//       );

//       return res
//         .status(500)
//         .json({
//           success: false,

//           message:
//             "Unable to load administrator accounts.",
//         });
//     }
//   };

// /*
// |--------------------------------------------------------------------------
// | Get Single Administrator
// |--------------------------------------------------------------------------
// |
// | GET /api/admin-accounts/:id
// |
// */

// export const getAdminAccount =
//   async (req, res) => {
//     try {
//       if (
//         !ensureAdminManager(
//           req,
//           res
//         )
//       ) {
//         return;
//       }

//       const { id } =
//         req.params;

//       if (
//         !isValidObjectId(id)
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "Invalid administrator ID.",
//           });
//       }

//       const admin =
//         await User.findOne({
//           _id: id,

//           $or: [
//             {
//               role: "Admin",
//             },
//             {
//               accountType:
//                 "admin",
//             },
//           ],
//         });

//       if (!admin) {
//         return res
//           .status(404)
//           .json({
//             success:
//               false,

//             message:
//               "Administrator account not found.",
//           });
//       }

//       return res
//         .status(200)
//         .json({
//           success: true,

//           record:
//             formatAdmin(
//               admin
//             ),
//         });
//     } catch (error) {
//       console.error(
//         "Get Admin Account Error:",
//         error
//       );

//       return res
//         .status(500)
//         .json({
//           success: false,

//           message:
//             "Unable to load administrator account.",
//         });
//     }
//   };

// /*
// |--------------------------------------------------------------------------
// | Create Administrator
// |--------------------------------------------------------------------------
// |
// | POST /api/admin-accounts
// |
// | Browser sends:
// |
// | {
// |   displayName,
// |   email,
// |   password,
// |   roleLevel,
// |   permissions
// | }
// |
// | Backend creates:
// |
// | firebaseUid
// | role
// | accountType
// | status
// | creator metadata
// |
// */

// export const createAdminAccount =
//   async (req, res) => {
//     let createdFirebaseUid =
//       null;

//     try {
//       if (
//         !ensureAdminManager(
//           req,
//           res
//         )
//       ) {
//         return;
//       }

//       const displayName =
//         cleanString(
//           req.body
//             ?.displayName
//         );

//       const email =
//         normalizeEmail(
//           req.body?.email
//         );

//       const password =
//         String(
//           req.body
//             ?.password ||
//             ""
//         );

//       const roleLevel =
//         cleanString(
//           req.body
//             ?.roleLevel
//         );

//       const rawPermissions =
//         req.body
//           ?.permissions;

//       /*
//       |--------------------------------------------------------------------------
//       | Validation
//       |--------------------------------------------------------------------------
//       */

//       if (!displayName) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "Administrator name is required.",
//           });
//       }

//       if (
//         !email ||
//         !email.includes("@")
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "A valid email address is required.",
//           });
//       }

//       if (
//         password.length <
//         8
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "Password must be at least 8 characters.",
//           });
//       }

//       if (
//         !VALID_ROLE_LEVELS.includes(
//           roleLevel
//         )
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "Invalid administrator role level.",
//           });
//       }

//       const permissionValidation =
//         validatePermissions(
//           rawPermissions
//         );

//       if (
//         !permissionValidation.valid
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               permissionValidation.message,
//           });
//       }

//       const permissions =
//         normalizePermissions(
//           rawPermissions
//         );

//       if (
//         permissions.length ===
//         0
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "Select at least one administrator permission.",
//           });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Protect Super Admin Privileges
//       |--------------------------------------------------------------------------
//       */

//       if (
//         roleLevel ===
//           "Super Admin" &&
//         !isSuperAdmin(
//           req.user
//         )
//       ) {
//         return res
//           .status(403)
//           .json({
//             success:
//               false,

//             message:
//               "Only a Super Admin can create another Super Admin.",
//           });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Protect Account Management Permission
//       |--------------------------------------------------------------------------
//       */

//       if (
//         permissions.includes(
//           "accounts.manage"
//         ) &&
//         !isSuperAdmin(
//           req.user
//         )
//       ) {
//         return res
//           .status(403)
//           .json({
//             success:
//               false,

//             message:
//               "Only a Super Admin can grant administrator-account management permission.",
//           });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Duplicate MongoDB Email
//       |--------------------------------------------------------------------------
//       */

//       const existingUser =
//         await User.findOne({
//           email,
//         });

//       if (
//         existingUser
//       ) {
//         return res
//           .status(409)
//           .json({
//             success:
//               false,

//             message:
//               "An account already exists with this email address.",
//           });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Check Firebase Email
//       |--------------------------------------------------------------------------
//       */

//       try {
//         await firebaseAdmin
//           .auth()
//           .getUserByEmail(
//             email
//           );

//         return res
//           .status(409)
//           .json({
//             success:
//               false,

//             message:
//               "A Firebase account already exists with this email address.",
//           });
//       } catch (
//         firebaseLookupError
//       ) {
//         if (
//           firebaseLookupError
//             ?.code !==
//           "auth/user-not-found"
//         ) {
//           throw firebaseLookupError;
//         }
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Create Firebase User
//       |--------------------------------------------------------------------------
//       */

//       const firebaseUser =
//         await firebaseAdmin
//           .auth()
//           .createUser({
//             email,

//             password,

//             displayName,

//             disabled:
//               false,

//             emailVerified:
//               false,
//           });

//       createdFirebaseUid =
//         firebaseUser.uid;

//       /*
//       |--------------------------------------------------------------------------
//       | Creator Metadata
//       |--------------------------------------------------------------------------
//       */

//       const creator =
//         getCreatorInfo(
//           req
//         );

//       /*
//       |--------------------------------------------------------------------------
//       | Create MongoDB User
//       |--------------------------------------------------------------------------
//       */

//       const adminUser =
//         await User.create({
//           firebaseUid:
//             firebaseUser.uid,

//           displayName,

//           email,

//           role:
//             "Admin",

//           accountType:
//             "admin",

//           roleLevel,

//           permissions,

//           status:
//             "Active",

//           storeId:
//             null,

//           ...creator,
//         });

//       return res
//         .status(201)
//         .json({
//           success: true,

//           message:
//             "Administrator account created successfully.",

//           record:
//             formatAdmin(
//               adminUser
//             ),
//         });
//     } catch (error) {
//       console.error(
//         "Create Admin Account Error:",
//         error
//       );

//       /*
//       |--------------------------------------------------------------------------
//       | Firebase Rollback
//       |--------------------------------------------------------------------------
//       |
//       | If Firebase was created but MongoDB failed,
//       | remove Firebase account so we do not leave
//       | an orphan authentication account.
//       |
//       */

//       if (
//         createdFirebaseUid
//       ) {
//         try {
//           await firebaseAdmin
//             .auth()
//             .deleteUser(
//               createdFirebaseUid
//             );
//         } catch (
//           rollbackError
//         ) {
//           console.error(
//             "Firebase Admin Rollback Error:",
//             rollbackError
//           );
//         }
//       }

//       if (
//         error?.code ===
//         11000
//       ) {
//         return res
//           .status(409)
//           .json({
//             success:
//               false,

//             message:
//               "An administrator account with this email already exists.",
//           });
//       }

//       if (
//         String(
//           error?.code ||
//             ""
//         ).startsWith(
//           "auth/"
//         )
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               error?.message ||
//               "Unable to create Firebase administrator account.",
//           });
//       }

//       return res
//         .status(500)
//         .json({
//           success: false,

//           message:
//             "Unable to create administrator account.",
//         });
//     }
//   };

// /*
// |--------------------------------------------------------------------------
// | Update Administrator
// |--------------------------------------------------------------------------
// |
// | PUT /api/admin-accounts/:id
// |
// | Allows:
// |
// | displayName
// | roleLevel
// | permissions
// |
// | Does NOT allow browser to change:
// |
// | firebaseUid
// | role
// | accountType
// | status
// | creator identity
// |
// */

// export const updateAdminAccount =
//   async (req, res) => {
//     try {
//       if (
//         !ensureAdminManager(
//           req,
//           res
//         )
//       ) {
//         return;
//       }

//       const { id } =
//         req.params;

//       if (
//         !isValidObjectId(id)
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "Invalid administrator ID.",
//           });
//       }

//       const admin =
//         await User.findOne({
//           _id: id,

//           $or: [
//             {
//               role: "Admin",
//             },
//             {
//               accountType:
//                 "admin",
//             },
//           ],
//         });

//       if (!admin) {
//         return res
//           .status(404)
//           .json({
//             success:
//               false,

//             message:
//               "Administrator account not found.",
//           });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Display Name
//       |--------------------------------------------------------------------------
//       */

//       if (
//         req.body
//           ?.displayName !==
//         undefined
//       ) {
//         const displayName =
//           cleanString(
//             req.body
//               .displayName
//           );

//         if (!displayName) {
//           return res
//             .status(400)
//             .json({
//               success:
//                 false,

//               message:
//                 "Administrator name cannot be empty.",
//             });
//         }

//         admin.displayName =
//           displayName;
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Role Level
//       |--------------------------------------------------------------------------
//       */

//       if (
//         req.body
//           ?.roleLevel !==
//         undefined
//       ) {
//         const roleLevel =
//           cleanString(
//             req.body
//               .roleLevel
//           );

//         if (
//           !VALID_ROLE_LEVELS.includes(
//             roleLevel
//           )
//         ) {
//           return res
//             .status(400)
//             .json({
//               success:
//                 false,

//               message:
//                 "Invalid administrator role level.",
//             });
//         }

//         if (
//           roleLevel ===
//             "Super Admin" &&
//           !isSuperAdmin(
//             req.user
//           )
//         ) {
//           return res
//             .status(403)
//             .json({
//               success:
//                 false,

//               message:
//                 "Only a Super Admin can assign the Super Admin role.",
//             });
//         }

//         /*
//         |--------------------------------------------------------------------------
//         | Prevent non-super admins editing existing Super Admin
//         |--------------------------------------------------------------------------
//         */

//         if (
//           admin.roleLevel ===
//             "Super Admin" &&
//           !isSuperAdmin(
//             req.user
//           )
//         ) {
//           return res
//             .status(403)
//             .json({
//               success:
//                 false,

//               message:
//                 "Only a Super Admin can modify another Super Admin.",
//             });
//         }

//         admin.roleLevel =
//           roleLevel;
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Permissions
//       |--------------------------------------------------------------------------
//       */

//       if (
//         req.body
//           ?.permissions !==
//         undefined
//       ) {
//         const validation =
//           validatePermissions(
//             req.body
//               .permissions
//           );

//         if (
//           !validation.valid
//         ) {
//           return res
//             .status(400)
//             .json({
//               success:
//                 false,

//               message:
//                 validation.message,
//             });
//         }

//         const permissions =
//           normalizePermissions(
//             req.body
//               .permissions
//           );

//         if (
//           permissions.length ===
//           0
//         ) {
//           return res
//             .status(400)
//             .json({
//               success:
//                 false,

//               message:
//                 "Administrator must have at least one permission.",
//             });
//         }

//         if (
//           permissions.includes(
//             "accounts.manage"
//           ) &&
//           !isSuperAdmin(
//             req.user
//           )
//         ) {
//           return res
//             .status(403)
//             .json({
//               success:
//                 false,

//               message:
//                 "Only a Super Admin can grant administrator-account management permission.",
//             });
//         }

//         admin.permissions =
//           permissions;
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Keep Security Fields Fixed
//       |--------------------------------------------------------------------------
//       */

//       admin.role =
//         "Admin";

//       admin.accountType =
//         "admin";

//       await admin.save();

//       /*
//       |--------------------------------------------------------------------------
//       | Keep Firebase Display Name Synchronized
//       |--------------------------------------------------------------------------
//       */

//       try {
//         if (
//           admin.firebaseUid
//         ) {
//           await firebaseAdmin
//             .auth()
//             .updateUser(
//               admin.firebaseUid,
//               {
//                 displayName:
//                   admin.displayName,
//               }
//             );
//         }
//       } catch (
//         firebaseError
//       ) {
//         console.error(
//           "Firebase Admin Display Name Sync Error:",
//           firebaseError
//         );
//       }

//       return res
//         .status(200)
//         .json({
//           success: true,

//           message:
//             "Administrator account updated successfully.",

//           record:
//             formatAdmin(
//               admin
//             ),
//         });
//     } catch (error) {
//       console.error(
//         "Update Admin Account Error:",
//         error
//       );

//       return res
//         .status(500)
//         .json({
//           success: false,

//           message:
//             "Unable to update administrator account.",
//         });
//     }
//   };

// /*
// |--------------------------------------------------------------------------
// | Update Administrator Status
// |--------------------------------------------------------------------------
// |
// | PATCH /api/admin-accounts/:id/status
// |
// | {
// |   status: "Active" | "Inactive"
// | }
// |
// */

// export const updateAdminStatus =
//   async (req, res) => {
//     try {
//       if (
//         !ensureAdminManager(
//           req,
//           res
//         )
//       ) {
//         return;
//       }

//       const { id } =
//         req.params;

//       if (
//         !isValidObjectId(id)
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "Invalid administrator ID.",
//           });
//       }

//       const status =
//         cleanString(
//           req.body?.status
//         );

//       if (
//         !VALID_STATUSES.includes(
//           status
//         )
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "Status must be Active or Inactive.",
//           });
//       }

//       const admin =
//         await User.findOne({
//           _id: id,

//           $or: [
//             {
//               role: "Admin",
//             },
//             {
//               accountType:
//                 "admin",
//             },
//           ],
//         });

//       if (!admin) {
//         return res
//           .status(404)
//           .json({
//             success:
//               false,

//             message:
//               "Administrator account not found.",
//           });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Don't Allow Self-Deactivation
//       |--------------------------------------------------------------------------
//       */

//       const currentUid =
//         req.user
//           ?.firebaseUid ||
//         req.firebaseUser
//           ?.uid;

//       if (
//         status ===
//           "Inactive" &&
//         admin.firebaseUid ===
//           currentUid
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "You cannot deactivate your own administrator account.",
//           });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Protect Super Admin
//       |--------------------------------------------------------------------------
//       */

//       if (
//         admin.roleLevel ===
//           "Super Admin" &&
//         !isSuperAdmin(
//           req.user
//         )
//       ) {
//         return res
//           .status(403)
//           .json({
//             success:
//               false,

//             message:
//               "Only a Super Admin can change another Super Admin's status.",
//           });
//       }

//       admin.status =
//         status;

//       await admin.save();

//       /*
//       |--------------------------------------------------------------------------
//       | Firebase Disable / Enable
//       |--------------------------------------------------------------------------
//       */

//       if (
//         admin.firebaseUid
//       ) {
//         await firebaseAdmin
//           .auth()
//           .updateUser(
//             admin.firebaseUid,
//             {
//               disabled:
//                 status ===
//                 "Inactive",
//             }
//           );
//       }

//       return res
//         .status(200)
//         .json({
//           success: true,

//           message:
//             `Administrator account ${status.toLowerCase()} successfully.`,

//           record:
//             formatAdmin(
//               admin
//             ),
//         });
//     } catch (error) {
//       console.error(
//         "Update Admin Status Error:",
//         error
//       );

//       return res
//         .status(500)
//         .json({
//           success: false,

//           message:
//             "Unable to update administrator status.",
//         });
//     }
//   };

// /*
// |--------------------------------------------------------------------------
// | Delete Administrator
// |--------------------------------------------------------------------------
// |
// | DELETE /api/admin-accounts/:id
// |
// */

// export const deleteAdminAccount =
//   async (req, res) => {
//     try {
//       if (
//         !ensureAdminManager(
//           req,
//           res
//         )
//       ) {
//         return;
//       }

//       const { id } =
//         req.params;

//       if (
//         !isValidObjectId(id)
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "Invalid administrator ID.",
//           });
//       }

//       const admin =
//         await User.findOne({
//           _id: id,

//           $or: [
//             {
//               role: "Admin",
//             },
//             {
//               accountType:
//                 "admin",
//             },
//           ],
//         });

//       if (!admin) {
//         return res
//           .status(404)
//           .json({
//             success:
//               false,

//             message:
//               "Administrator account not found.",
//           });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Prevent Self Delete
//       |--------------------------------------------------------------------------
//       */

//       const currentUid =
//         req.user
//           ?.firebaseUid ||
//         req.firebaseUser
//           ?.uid;

//       if (
//         admin.firebaseUid ===
//         currentUid
//       ) {
//         return res
//           .status(400)
//           .json({
//             success:
//               false,

//             message:
//               "You cannot delete your own administrator account.",
//           });
//       }

//       /*
//       |--------------------------------------------------------------------------
//       | Protect Super Admin
//       |--------------------------------------------------------------------------
//       */

//       if (
//         admin.roleLevel ===
//           "Super Admin" &&
//         !isSuperAdmin(
//           req.user
//         )
//       ) {
//         return res
//           .status(403)
//           .json({
//             success:
//               false,

//             message:
//               "Only a Super Admin can delete another Super Admin.",
//           });
//       }

//       const firebaseUid =
//         admin.firebaseUid;

//       /*
//       |--------------------------------------------------------------------------
//       | Remove MongoDB Authorization Record First
//       |--------------------------------------------------------------------------
//       |
//       | Security reason:
//       |
//       | If Firebase deletion later fails, the Firebase login may still exist,
//       | but authenticate middleware will not find a MongoDB application
//       | account and therefore API access is denied.
//       |
//       */

//       await User.deleteOne({
//         _id:
//           admin._id,
//       });

//       /*
//       |--------------------------------------------------------------------------
//       | Remove Firebase Authentication Account
//       |--------------------------------------------------------------------------
//       */

//       if (
//         firebaseUid
//       ) {
//         try {
//           await firebaseAdmin
//             .auth()
//             .deleteUser(
//               firebaseUid
//             );
//         } catch (
//           firebaseError
//         ) {
//           console.error(
//             "Delete Firebase Admin User Error:",
//             firebaseError
//           );

//           return res
//             .status(200)
//             .json({
//               success:
//                 true,

//               warning:
//                 "MongoDB administrator access was removed, but Firebase account deletion failed. The Firebase account no longer has application authorization.",

//               message:
//                 "Administrator application access removed.",
//             });
//         }
//       }

//       return res
//         .status(200)
//         .json({
//           success: true,

//           message:
//             "Administrator account deleted successfully.",
//         });
//     } catch (error) {
//       console.error(
//         "Delete Admin Account Error:",
//         error
//       );

//       return res
//         .status(500)
//         .json({
//           success: false,

//           message:
//             "Unable to delete administrator account.",
//         });
//     }
//   };


// src/controllers/adminAccountController.js

import mongoose from "mongoose";

import User from "../models/User.js";

import {
  firebaseAuth,
} from "../config/firebaseAdmin.js";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const VALID_ROLE_LEVELS = [
  "Super Admin",
  "System Admin",
  "Operations Admin",
  "Read-only Admin",
];

const VALID_STATUSES = [
  "Active",
  "Inactive",
];

const VALID_PERMISSIONS = [
  // Stores
  "stores.read",
  "stores.manage",

  // Shift Management
  "shifts.read",
  "shifts.manage",

  // Issues
  "issues.read",
  "issues.manage",

  // Food Safety
  "foodSafety.read",
  "foodSafety.review",

  // Maintenance
  "maintenance.read",
  "maintenance.review",

  // Cash Turnover
  "cashTurnover.read",
  "cashTurnover.review",

  // Cash Audit
  "cashAudit.read",
  "cashAudit.review",

  // Reports
  "reports.read",
  "analytics.read",

  // System
  "accounts.manage",
  "settings.manage",
  "auditLogs.read",
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const cleanString = (value) =>
  String(value ?? "").trim();

const normalizeEmail = (value) =>
  cleanString(value).toLowerCase();

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(
    String(value || "")
  );

const isAdminAccount = (user) => {
  const role = cleanString(
    user?.role
  ).toLowerCase();

  const accountType = cleanString(
    user?.accountType
  ).toLowerCase();

  return (
    role === "admin" ||
    accountType === "admin"
  );
};

const isSuperAdmin = (user) =>
  cleanString(
    user?.roleLevel
  ).toLowerCase() ===
  "super admin";

const hasPermission = (
  user,
  permission
) => {
  const permissions =
    Array.isArray(
      user?.permissions
    )
      ? user.permissions
      : [];

  return permissions.includes(
    permission
  );
};

const canManageAccounts = (
  user
) =>
  isAdminAccount(user) &&
  (
    isSuperAdmin(user) ||
    hasPermission(
      user,
      "accounts.manage"
    )
  );

const normalizePermissions = (
  permissions
) => {
  if (
    !Array.isArray(
      permissions
    )
  ) {
    return [];
  }

  return [
    ...new Set(
      permissions
        .map(cleanString)
        .filter((permission) =>
          VALID_PERMISSIONS.includes(
            permission
          )
        )
    ),
  ];
};

const validatePermissions = (
  permissions
) => {
  if (
    !Array.isArray(
      permissions
    )
  ) {
    return {
      valid: false,
      message:
        "Permissions must be an array.",
    };
  }

  const invalid =
    permissions.filter(
      (permission) =>
        !VALID_PERMISSIONS.includes(
          cleanString(
            permission
          )
        )
    );

  if (invalid.length) {
    return {
      valid: false,
      message:
        `Invalid permissions: ${invalid.join(
          ", "
        )}`,
    };
  }

  return {
    valid: true,
  };
};

const getCreatorInfo = (
  req
) => ({
  createdByUid:
    req.user
      ?.firebaseUid ||
    req.firebaseUser
      ?.uid ||
    "",

  createdByName:
    req.user
      ?.displayName ||
    req.user
      ?.name ||
    req.firebaseUser
      ?.name ||
    "Administrator",
});

const formatAdmin = (
  user
) => {
  if (!user) {
    return null;
  }

  const object =
    typeof user.toObject ===
    "function"
      ? user.toObject()
      : user;

  return {
    id:
      String(
        object._id
      ),

    _id:
      object._id,

    firebaseUid:
      object.firebaseUid,

    displayName:
      object.displayName,

    email:
      object.email,

    role:
      object.role,

    accountType:
      object.accountType,

    roleLevel:
      object.roleLevel,

    permissions:
      Array.isArray(
        object.permissions
      )
        ? object.permissions
        : [],

    status:
      object.status,

    createdByUid:
      object.createdByUid,

    createdByName:
      object.createdByName,

    lastLogin:
      object.lastLogin,

    createdAt:
      object.createdAt,

    updatedAt:
      object.updatedAt,
  };
};

const ensureAdminManager = (
  req,
  res
) => {
  if (
    !canManageAccounts(
      req.user
    )
  ) {
    res.status(403).json({
      success: false,

      message:
        "You do not have permission to manage administrator accounts.",
    });

    return false;
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| Firebase Helpers
|--------------------------------------------------------------------------
*/

const getFirebaseUserByEmail =
  async (email) => {
    try {
      return await firebaseAuth
        .getUserByEmail(
          email
        );
    } catch (error) {
      if (
        error?.code ===
        "auth/user-not-found"
      ) {
        return null;
      }

      throw error;
    }
  };

const deleteFirebaseUserSafely =
  async (uid) => {
    if (!uid) {
      return;
    }

    try {
      await firebaseAuth
        .deleteUser(
          uid
        );
    } catch (error) {
      if (
        error?.code ===
        "auth/user-not-found"
      ) {
        return;
      }

      throw error;
    }
  };

/*
|--------------------------------------------------------------------------
| Get Administrator Accounts
|--------------------------------------------------------------------------
|
| GET /api/admin-accounts
|
*/

export const getAdminAccounts =
  async (req, res) => {
    try {
      if (
        !ensureAdminManager(
          req,
          res
        )
      ) {
        return;
      }

      const {
        search,
        status,
        roleLevel,
        page = 1,
        limit = 50,
      } = req.query;

      const query = {
        $or: [
          {
            role: "Admin",
          },
          {
            accountType:
              "admin",
          },
        ],
      };

      if (
        status &&
        VALID_STATUSES.includes(
          cleanString(status)
        )
      ) {
        query.status =
          cleanString(status);
      }

      if (
        roleLevel &&
        VALID_ROLE_LEVELS.includes(
          cleanString(
            roleLevel
          )
        )
      ) {
        query.roleLevel =
          cleanString(
            roleLevel
          );
      }

      if (
        cleanString(search)
      ) {
        const escaped =
          cleanString(
            search
          ).replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

        const regex =
          new RegExp(
            escaped,
            "i"
          );

        query.$and = [
          {
            $or: [
              {
                displayName:
                  regex,
              },
              {
                email:
                  regex,
              },
              {
                roleLevel:
                  regex,
              },
            ],
          },
        ];
      }

      const safePage =
        Math.max(
          1,
          Number(page) || 1
        );

      const safeLimit =
        Math.min(
          100,
          Math.max(
            1,
            Number(limit) ||
              50
          )
        );

      const skip =
        (safePage - 1) *
        safeLimit;

      const [
        admins,
        total,
      ] =
        await Promise.all([
          User.find(query)
            .sort({
              createdAt: -1,
            })
            .skip(skip)
            .limit(
              safeLimit
            ),

          User.countDocuments(
            query
          ),
        ]);

      return res
        .status(200)
        .json({
          success: true,

          records:
            admins.map(
              formatAdmin
            ),

          pagination: {
            page:
              safePage,

            limit:
              safeLimit,

            total,

            pages:
              Math.ceil(
                total /
                  safeLimit
              ),
          },
        });
    } catch (error) {
      console.error(
        "Get Admin Accounts Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to load administrator accounts.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| Get Single Administrator
|--------------------------------------------------------------------------
|
| GET /api/admin-accounts/:id
|
*/

export const getAdminAccount =
  async (req, res) => {
    try {
      if (
        !ensureAdminManager(
          req,
          res
        )
      ) {
        return;
      }

      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid administrator ID.",
          });
      }

      const admin =
        await User.findOne({
          _id: id,

          $or: [
            {
              role: "Admin",
            },
            {
              accountType:
                "admin",
            },
          ],
        });

      if (!admin) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Administrator account not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          record:
            formatAdmin(
              admin
            ),
        });
    } catch (error) {
      console.error(
        "Get Admin Account Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to load administrator account.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| Create Administrator
|--------------------------------------------------------------------------
|
| POST /api/admin-accounts
|
*/

export const createAdminAccount =
  async (req, res) => {
    let createdFirebaseUid =
      null;

    try {
      if (
        !ensureAdminManager(
          req,
          res
        )
      ) {
        return;
      }

      const displayName =
        cleanString(
          req.body
            ?.displayName
        );

      const email =
        normalizeEmail(
          req.body?.email
        );

      const password =
        String(
          req.body
            ?.password ||
            ""
        );

      const roleLevel =
        cleanString(
          req.body
            ?.roleLevel
        );

      const rawPermissions =
        req.body
          ?.permissions;

      if (!displayName) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Administrator name is required.",
          });
      }

      if (
        !email ||
        !email.includes("@")
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "A valid email address is required.",
          });
      }

      if (
        password.length <
        8
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Password must be at least 8 characters.",
          });
      }

      if (
        !VALID_ROLE_LEVELS.includes(
          roleLevel
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid administrator role level.",
          });
      }

      const permissionValidation =
        validatePermissions(
          rawPermissions
        );

      if (
        !permissionValidation.valid
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              permissionValidation.message,
          });
      }

      const permissions =
        normalizePermissions(
          rawPermissions
        );

      if (
        permissions.length ===
        0
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Select at least one administrator permission.",
          });
      }

      if (
        roleLevel ===
          "Super Admin" &&
        !isSuperAdmin(
          req.user
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Only a Super Admin can create another Super Admin.",
          });
      }

      if (
        permissions.includes(
          "accounts.manage"
        ) &&
        !isSuperAdmin(
          req.user
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Only a Super Admin can grant administrator-account management permission.",
          });
      }

      const existingUser =
        await User.findOne({
          email,
        });

      if (
        existingUser
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "An account already exists with this email address.",
          });
      }

      const existingFirebaseUser =
        await getFirebaseUserByEmail(
          email
        );

      if (
        existingFirebaseUser
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "A Firebase account already exists with this email address.",
          });
      }

      const firebaseUser =
        await firebaseAuth
          .createUser({
            email,

            password,

            displayName,

            disabled:
              false,

            emailVerified:
              false,
          });

      createdFirebaseUid =
        firebaseUser.uid;

      const creator =
        getCreatorInfo(
          req
        );

      const adminUser =
        await User.create({
          firebaseUid:
            firebaseUser.uid,

          displayName,

          email,

          role:
            "Admin",

          accountType:
            "admin",

          roleLevel,

          permissions,

          status:
            "Active",

          storeId:
            null,

          ...creator,
        });

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Administrator account created successfully.",

          record:
            formatAdmin(
              adminUser
            ),
        });
    } catch (error) {
      console.error(
        "Create Admin Account Error:",
        error
      );

      if (
        createdFirebaseUid
      ) {
        try {
          await deleteFirebaseUserSafely(
            createdFirebaseUid
          );
        } catch (
          rollbackError
        ) {
          console.error(
            "Firebase Admin Rollback Error:",
            rollbackError
          );
        }
      }

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "An administrator account with this email already exists.",
          });
      }

      if (
        error?.code ===
        "auth/email-already-exists"
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "A Firebase account already exists with this email address.",
          });
      }

      if (
        String(
          error?.code ||
            ""
        ).startsWith(
          "auth/"
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              error?.message ||
              "Unable to create Firebase administrator account.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to create administrator account.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| Update Administrator
|--------------------------------------------------------------------------
|
| PUT /api/admin-accounts/:id
|
*/

export const updateAdminAccount =
  async (req, res) => {
    try {
      if (
        !ensureAdminManager(
          req,
          res
        )
      ) {
        return;
      }

      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid administrator ID.",
          });
      }

      const admin =
        await User.findOne({
          _id: id,

          $or: [
            {
              role: "Admin",
            },
            {
              accountType:
                "admin",
            },
          ],
        });

      if (!admin) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Administrator account not found.",
          });
      }

      if (
        req.body
          ?.displayName !==
        undefined
      ) {
        const displayName =
          cleanString(
            req.body
              .displayName
          );

        if (!displayName) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Administrator name cannot be empty.",
            });
        }

        admin.displayName =
          displayName;
      }

      if (
        req.body
          ?.roleLevel !==
        undefined
      ) {
        const roleLevel =
          cleanString(
            req.body
              .roleLevel
          );

        if (
          !VALID_ROLE_LEVELS.includes(
            roleLevel
          )
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Invalid administrator role level.",
            });
        }

        if (
          roleLevel ===
            "Super Admin" &&
          !isSuperAdmin(
            req.user
          )
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "Only a Super Admin can assign the Super Admin role.",
            });
        }

        if (
          admin.roleLevel ===
            "Super Admin" &&
          !isSuperAdmin(
            req.user
          )
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "Only a Super Admin can modify another Super Admin.",
            });
        }

        admin.roleLevel =
          roleLevel;
      }

      if (
        req.body
          ?.permissions !==
        undefined
      ) {
        const validation =
          validatePermissions(
            req.body
              .permissions
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

        const permissions =
          normalizePermissions(
            req.body
              .permissions
          );

        if (
          permissions.length ===
          0
        ) {
          return res
            .status(400)
            .json({
              success:
                false,

              message:
                "Administrator must have at least one permission.",
            });
        }

        if (
          permissions.includes(
            "accounts.manage"
          ) &&
          !isSuperAdmin(
            req.user
          )
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "Only a Super Admin can grant administrator-account management permission.",
            });
        }

        admin.permissions =
          permissions;
      }

      admin.role =
        "Admin";

      admin.accountType =
        "admin";

      await admin.save();

      try {
        if (
          admin.firebaseUid
        ) {
          await firebaseAuth
            .updateUser(
              admin.firebaseUid,
              {
                displayName:
                  admin.displayName,
              }
            );
        }
      } catch (
        firebaseError
      ) {
        console.error(
          "Firebase Admin Display Name Sync Error:",
          firebaseError
        );
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Administrator account updated successfully.",

          record:
            formatAdmin(
              admin
            ),
        });
    } catch (error) {
      console.error(
        "Update Admin Account Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to update administrator account.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| Update Administrator Status
|--------------------------------------------------------------------------
|
| PATCH /api/admin-accounts/:id/status
|
*/

export const updateAdminStatus =
  async (req, res) => {
    try {
      if (
        !ensureAdminManager(
          req,
          res
        )
      ) {
        return;
      }

      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid administrator ID.",
          });
      }

      const status =
        cleanString(
          req.body?.status
        );

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
              "Status must be Active or Inactive.",
          });
      }

      const admin =
        await User.findOne({
          _id: id,

          $or: [
            {
              role: "Admin",
            },
            {
              accountType:
                "admin",
            },
          ],
        });

      if (!admin) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Administrator account not found.",
          });
      }

      const currentUid =
        req.user
          ?.firebaseUid ||
        req.firebaseUser
          ?.uid;

      if (
        status ===
          "Inactive" &&
        admin.firebaseUid ===
          currentUid
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "You cannot deactivate your own administrator account.",
          });
      }

      if (
        admin.roleLevel ===
          "Super Admin" &&
        !isSuperAdmin(
          req.user
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Only a Super Admin can change another Super Admin's status.",
          });
      }

      const previousStatus =
        admin.status;

      admin.status =
        status;

      await admin.save();

      try {
        if (
          admin.firebaseUid
        ) {
          await firebaseAuth
            .updateUser(
              admin.firebaseUid,
              {
                disabled:
                  status ===
                  "Inactive",
              }
            );
        }
      } catch (firebaseError) {
        console.error(
          "Firebase Admin Status Sync Error:",
          firebaseError
        );

        /*
        |--------------------------------------------------------------------------
        | Roll MongoDB status back if Firebase update failed
        |--------------------------------------------------------------------------
        */

        admin.status =
          previousStatus;

        await admin.save();

        return res
          .status(500)
          .json({
            success: false,

            message:
              "Unable to synchronize administrator status with Firebase Authentication.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            `Administrator account ${status.toLowerCase()} successfully.`,

          record:
            formatAdmin(
              admin
            ),
        });
    } catch (error) {
      console.error(
        "Update Admin Status Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to update administrator status.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| Delete Administrator
|--------------------------------------------------------------------------
|
| DELETE /api/admin-accounts/:id
|
*/

export const deleteAdminAccount =
  async (req, res) => {
    try {
      if (
        !ensureAdminManager(
          req,
          res
        )
      ) {
        return;
      }

      const { id } =
        req.params;

      if (
        !isValidObjectId(id)
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid administrator ID.",
          });
      }

      const admin =
        await User.findOne({
          _id: id,

          $or: [
            {
              role: "Admin",
            },
            {
              accountType:
                "admin",
            },
          ],
        });

      if (!admin) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Administrator account not found.",
          });
      }

      const currentUid =
        req.user
          ?.firebaseUid ||
        req.firebaseUser
          ?.uid;

      if (
        admin.firebaseUid ===
        currentUid
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "You cannot delete your own administrator account.",
          });
      }

      if (
        admin.roleLevel ===
          "Super Admin" &&
        !isSuperAdmin(
          req.user
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,

            message:
              "Only a Super Admin can delete another Super Admin.",
          });
      }

      const firebaseUid =
        admin.firebaseUid;

      /*
      |--------------------------------------------------------------------------
      | Delete MongoDB authorization first
      |--------------------------------------------------------------------------
      |
      | If Firebase deletion fails afterward, the account still cannot access
      | the application because authenticate middleware will not find MongoDB user.
      |
      */

      await User.deleteOne({
        _id:
          admin._id,
      });

      if (
        firebaseUid
      ) {
        try {
          await firebaseAuth
            .deleteUser(
              firebaseUid
            );
        } catch (
          firebaseError
        ) {
          console.error(
            "Delete Firebase Admin User Error:",
            firebaseError
          );

          if (
            firebaseError?.code !==
            "auth/user-not-found"
          ) {
            return res
              .status(200)
              .json({
                success:
                  true,

                warning:
                  "MongoDB administrator access was removed, but Firebase account deletion failed. The Firebase account no longer has application authorization.",

                message:
                  "Administrator application access removed.",
              });
          }
        }
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Administrator account deleted successfully.",
        });
    } catch (error) {
      console.error(
        "Delete Admin Account Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            "Unable to delete administrator account.",
        });
    }
  };