import express from "express";

import {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  archiveNotification,
  deleteNotification,
} from "../controllers/notificationController.js";

import authenticate from "../middleware/authenticate.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Protect All Notification Routes
|--------------------------------------------------------------------------
|
| Firebase token is verified first.
| authenticate should attach:
|
| req.firebaseUser
| req.user
|--------------------------------------------------------------------------
*/

router.use(authenticate);

/*
|--------------------------------------------------------------------------
| Notification Routes
|--------------------------------------------------------------------------
*/

/*
| Get all notifications
|
| Admin:
|   GET /api/notifications
|   GET /api/notifications?storeId=...
|
| Store:
|   Receives only its own store notifications
|   plus "All Stores" notifications.
*/

router.get(
  "/",
  getNotifications
);

/*
| Get one notification
*/

router.get(
  "/:id",
  getNotificationById
);

/*
| Create notification
|
| Admin only
*/

router.post(
  "/",
  createNotification
);

/*
| Update notification
|
| Admin only
*/

router.put(
  "/:id",
  updateNotification
);

/*
| Archive notification
|
| Admin only
*/

router.patch(
  "/:id/archive",
  archiveNotification
);

/*
| Delete notification
|
| Admin only
*/

router.delete(
  "/:id",
  deleteNotification
);

export default router;