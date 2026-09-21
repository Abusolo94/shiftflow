// import express from "express";

// import authenticate from "../middleware/authenticate.js";

// import {
//   getMe,
// } from "../controllers/authController.js";

// const router =
//   express.Router();

// router.get(
//   "/me",
//   authenticate,
//   getMe
// );

// export default router;


import express from "express";

import authenticate from "../middleware/authenticate.js";
import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";

import {
  getMe,
  registerStoreAccount,
} from "../controllers/authController.js";

const router = express.Router();

// ======================================================
// REGISTER STORE ACCOUNT
// Firebase account exists, MongoDB user does not yet exist
// POST /api/auth/register
// ======================================================

router.post(
  "/register",
  verifyFirebaseToken,
  registerStoreAccount
);

// ======================================================
// GET CURRENT LOGGED-IN ACCOUNT
// Firebase + MongoDB account required
// GET /api/auth/me
// ======================================================

router.get(
  "/me",
  authenticate,
  getMe
);

export default router;