import {
  firebaseAuth,
} from "../config/firebaseAdmin.js";

import User from "../models/User.js";

const authenticate = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication token is required.",
        });
    }

    const token =
      authHeader.substring(7);

    const decoded =
      await firebaseAuth.verifyIdToken(
        token
      );

    const account =
      await User.findOne({
        firebaseUid:
          decoded.uid,
      }).populate("storeId");

    if (!account) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Your Firebase account is not registered in ShiftFlow.",
        });
    }

    if (
      account.status !==
      "Active"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "This account is not active.",
        });
    }

    req.firebaseUser =
      decoded;

    req.user =
      account;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return res
      .status(401)
      .json({
        success: false,
        message:
          "Invalid or expired authentication token.",
      });
  }
};

export default authenticate;