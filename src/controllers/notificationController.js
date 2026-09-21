import mongoose from "mongoose";

import Notification from "../models/Notification.js";
import Store from "../models/Store.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const cleanString = (value) =>
  String(value ?? "").trim();

const normalize = (value) =>
  cleanString(value).toLowerCase();

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

  return String(value);
};

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(
    getObjectIdString(value)
  );

const isAdminAccount = (user) => {
  const role =
    normalize(user?.role);

  const accountType =
    normalize(
      user?.accountType
    );

  return (
    role === "admin" ||
    accountType === "admin"
  );
};

const getCreatorInfo = (req) => ({
  createdByUid:
    req.user?.firebaseUid ||
    req.firebaseUser?.uid ||
    "",

  createdByName:
    req.user?.displayName ||
    req.user?.name ||
    "Administrator",
});

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const VALID_TYPES = [
  "General",
  "Shift",
  "Issue",
  "Food Safety",
  "Maintenance",
  "Cash",
  "System",
];

const VALID_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const VALID_AUDIENCES = [
  "All Stores",
  "Store",
  "Admins",
];

const VALID_STATUSES = [
  "Active",
  "Archived",
];

/*
|--------------------------------------------------------------------------
| Format
|--------------------------------------------------------------------------
*/

const formatNotification = (
  record
) => ({
  id:
    String(record._id),

  _id:
    record._id,

  storeId:
    record.storeId,

  title:
    record.title,

  message:
    record.message,

  type:
    record.type,

  priority:
    record.priority,

  audience:
    record.audience,

  status:
    record.status,

  createdByUid:
    record.createdByUid,

  createdByName:
    record.createdByName,

  createdAt:
    record.createdAt,

  updatedAt:
    record.updatedAt,
});

/*
|--------------------------------------------------------------------------
| GET ALL NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export const getNotifications =
  async (req, res) => {
    try {
      const page =
        Math.max(
          1,
          Number(
            req.query.page
          ) || 1
        );

      const limit =
        Math.min(
          200,
          Math.max(
            1,
            Number(
              req.query.limit
            ) || 50
          )
        );

      const query = {};

      /*
      |--------------------------------------------------------------------------
      | Admin Access
      |--------------------------------------------------------------------------
      */

      if (
        isAdminAccount(
          req.user
        )
      ) {
        if (
          req.query.storeId
        ) {
          if (
            !isValidObjectId(
              req.query.storeId
            )
          ) {
            return res
              .status(400)
              .json({
                success: false,
                message:
                  "Invalid store ID.",
              });
          }

          query.storeId =
            req.query.storeId;
        }
      } else {
        /*
        |--------------------------------------------------------------------------
        | Store Access
        |--------------------------------------------------------------------------
        */

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
          return res
            .status(403)
            .json({
              success: false,
              message:
                "Store account is not linked to a valid store.",
            });
        }

        query.$or = [
          {
            storeId,
          },

          {
            audience:
              "All Stores",
          },
        ];
      }

      /*
      |--------------------------------------------------------------------------
      | Optional Filters
      |--------------------------------------------------------------------------
      */

      if (
        req.query.status
      ) {
        const status =
          cleanString(
            req.query.status
          );

        if (
          !VALID_STATUSES.includes(
            status
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid notification status.",
            });
        }

        query.status =
          status;
      }

      if (
        req.query.type
      ) {
        const type =
          cleanString(
            req.query.type
          );

        if (
          !VALID_TYPES.includes(
            type
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid notification type.",
            });
        }

        query.type =
          type;
      }

      if (
        req.query.priority
      ) {
        const priority =
          cleanString(
            req.query.priority
          );

        if (
          !VALID_PRIORITIES.includes(
            priority
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid notification priority.",
            });
        }

        query.priority =
          priority;
      }

      if (
        req.query.audience
      ) {
        const audience =
          cleanString(
            req.query.audience
          );

        if (
          !VALID_AUDIENCES.includes(
            audience
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid notification audience.",
            });
        }

        query.audience =
          audience;
      }

      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const skip =
        (page - 1) *
        limit;

      const [
        records,
        total,
      ] =
        await Promise.all([
          Notification.find(
            query
          )
            .populate(
              "storeId",
              "storeNumber storeName"
            )
            .sort({
              createdAt: -1,
            })
            .skip(skip)
            .limit(limit),

          Notification.countDocuments(
            query
          ),
        ]);

      return res
        .status(200)
        .json({
          success: true,

          records:
            records.map(
              formatNotification
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
        });
    } catch (error) {
      console.error(
        "Get Notifications Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load notifications.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| GET SINGLE NOTIFICATION
|--------------------------------------------------------------------------
*/

export const getNotificationById =
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
              "Invalid notification ID.",
          });
      }

      const notification =
        await Notification.findById(
          id
        ).populate(
          "storeId",
          "storeNumber storeName"
        );

      if (!notification) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Notification not found.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Store Access Control
      |--------------------------------------------------------------------------
      */

      if (
        !isAdminAccount(
          req.user
        )
      ) {
        const userStoreId =
          getObjectIdString(
            req.user?.storeId
          );

        const notificationStoreId =
          getObjectIdString(
            notification.storeId
          );

        const allowed =
          notification.audience ===
            "All Stores" ||
          userStoreId ===
            notificationStoreId;

        if (!allowed) {
          return res
            .status(403)
            .json({
              success: false,
              message:
                "You cannot access this notification.",
            });
        }
      }

      return res
        .status(200)
        .json({
          success: true,

          record:
            formatNotification(
              notification
            ),
        });
    } catch (error) {
      console.error(
        "Get Notification Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load notification.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| CREATE NOTIFICATION
|--------------------------------------------------------------------------
*/

export const createNotification =
  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Admin Only
      |--------------------------------------------------------------------------
      */

      if (
        !isAdminAccount(
          req.user
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Only administrators can create notifications.",
          });
      }

      const {
        title,
        message,
        type = "General",
        priority = "Medium",
        audience = "Store",
        storeId,
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Required Fields
      |--------------------------------------------------------------------------
      */

      if (
        !cleanString(title)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Notification title is required.",
          });
      }

      if (
        !cleanString(
          message
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Notification message is required.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Validate Enums
      |--------------------------------------------------------------------------
      */

      if (
        !VALID_TYPES.includes(
          type
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid notification type.",
          });
      }

      if (
        !VALID_PRIORITIES.includes(
          priority
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid notification priority.",
          });
      }

      if (
        !VALID_AUDIENCES.includes(
          audience
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid notification audience.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Resolve Store
      |--------------------------------------------------------------------------
      */

      let resolvedStoreId =
        null;

      if (
        audience ===
        "Store"
      ) {
        if (
          !storeId ||
          !isValidObjectId(
            storeId
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "A valid store is required for Store notifications.",
            });
        }

        const store =
          await Store.findById(
            storeId
          ).select(
            "_id storeNumber storeName"
          );

        if (!store) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                "Store not found.",
            });
        }

        resolvedStoreId =
          store._id;
      }

      /*
      |--------------------------------------------------------------------------
      | Create
      |--------------------------------------------------------------------------
      */

      const creator =
        getCreatorInfo(req);

      const notification =
        await Notification.create(
          {
            storeId:
              resolvedStoreId,

            title:
              cleanString(
                title
              ),

            message:
              cleanString(
                message
              ),

            type,

            priority,

            audience,

            status:
              "Active",

            ...creator,
          }
        );

      await notification.populate(
        "storeId",
        "storeNumber storeName"
      );

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Notification created successfully.",

          record:
            formatNotification(
              notification
            ),
        });
    } catch (error) {
      console.error(
        "Create Notification Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to create notification.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| UPDATE NOTIFICATION
|--------------------------------------------------------------------------
*/

export const updateNotification =
  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Admin Only
      |--------------------------------------------------------------------------
      */

      if (
        !isAdminAccount(
          req.user
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Only administrators can update notifications.",
          });
      }

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
              "Invalid notification ID.",
          });
      }

      const notification =
        await Notification.findById(
          id
        );

      if (!notification) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Notification not found.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Safe Updates
      |--------------------------------------------------------------------------
      */

      if (
        req.body.title !==
        undefined
      ) {
        const title =
          cleanString(
            req.body.title
          );

        if (!title) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Notification title cannot be empty.",
            });
        }

        notification.title =
          title;
      }

      if (
        req.body.message !==
        undefined
      ) {
        const message =
          cleanString(
            req.body.message
          );

        if (!message) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Notification message cannot be empty.",
            });
        }

        notification.message =
          message;
      }

      if (
        req.body.type !==
        undefined
      ) {
        if (
          !VALID_TYPES.includes(
            req.body.type
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid notification type.",
            });
        }

        notification.type =
          req.body.type;
      }

      if (
        req.body.priority !==
        undefined
      ) {
        if (
          !VALID_PRIORITIES.includes(
            req.body.priority
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid notification priority.",
            });
        }

        notification.priority =
          req.body.priority;
      }

      if (
        req.body.status !==
        undefined
      ) {
        if (
          !VALID_STATUSES.includes(
            req.body.status
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid notification status.",
            });
        }

        notification.status =
          req.body.status;
      }

      /*
      |--------------------------------------------------------------------------
      | Audience / Store Update
      |--------------------------------------------------------------------------
      */

      if (
        req.body.audience !==
        undefined
      ) {
        if (
          !VALID_AUDIENCES.includes(
            req.body.audience
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid notification audience.",
            });
        }

        notification.audience =
          req.body.audience;

        if (
          req.body.audience !==
          "Store"
        ) {
          notification.storeId =
            null;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Store Assignment
      |--------------------------------------------------------------------------
      */

      if (
        notification.audience ===
        "Store" &&
        req.body.storeId !==
          undefined
      ) {
        if (
          !isValidObjectId(
            req.body.storeId
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid store ID.",
            });
        }

        const store =
          await Store.findById(
            req.body.storeId
          ).select("_id");

        if (!store) {
          return res
            .status(404)
            .json({
              success: false,
              message:
                "Store not found.",
            });
        }

        notification.storeId =
          store._id;
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent Store Audience Without Store
      |--------------------------------------------------------------------------
      */

      if (
        notification.audience ===
          "Store" &&
        !notification.storeId
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Store notifications require a store.",
          });
      }

      await notification.save();

      await notification.populate(
        "storeId",
        "storeNumber storeName"
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Notification updated successfully.",

          record:
            formatNotification(
              notification
            ),
        });
    } catch (error) {
      console.error(
        "Update Notification Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update notification.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| ARCHIVE NOTIFICATION
|--------------------------------------------------------------------------
*/

export const archiveNotification =
  async (req, res) => {
    try {
      if (
        !isAdminAccount(
          req.user
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Only administrators can archive notifications.",
          });
      }

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
              "Invalid notification ID.",
          });
      }

      const notification =
        await Notification.findByIdAndUpdate(
          id,
          {
            status:
              "Archived",
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(
          "storeId",
          "storeNumber storeName"
        );

      if (!notification) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Notification not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Notification archived successfully.",

          record:
            formatNotification(
              notification
            ),
        });
    } catch (error) {
      console.error(
        "Archive Notification Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to archive notification.",
        });
    }
  };

/*
|--------------------------------------------------------------------------
| DELETE NOTIFICATION
|--------------------------------------------------------------------------
*/

export const deleteNotification =
  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Admin Only
      |--------------------------------------------------------------------------
      */

      if (
        !isAdminAccount(
          req.user
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Only administrators can delete notifications.",
          });
      }

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
              "Invalid notification ID.",
          });
      }

      const notification =
        await Notification.findByIdAndDelete(
          id
        );

      if (!notification) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Notification not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Notification deleted successfully.",
        });
    } catch (error) {
      console.error(
        "Delete Notification Error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to delete notification.",
        });
    }
  };