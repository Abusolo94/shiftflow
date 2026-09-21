import {
  firebaseAuth,
} from "../config/firebaseAdmin.js";

// ======================================================
// VERIFY FIREBASE ID TOKEN
// ======================================================

const verifyFirebaseToken = async (
  req,
  res,
  next
) => {
  try {
    const authHeader =
      req.headers.authorization;

    // ==================================================
    // CHECK AUTHORIZATION HEADER
    // ==================================================

    if (!authHeader) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authorization token is required.",
        });
    }

    // ==================================================
    // CHECK BEARER FORMAT
    // ==================================================

    if (
      !authHeader.startsWith(
        "Bearer "
      )
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Invalid authorization format.",
        });
    }

    // ==================================================
    // EXTRACT TOKEN
    // ==================================================

    const token =
      authHeader.substring(7);

    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Firebase authentication token is missing.",
        });
    }

    // ==================================================
    // VERIFY TOKEN WITH FIREBASE ADMIN
    // ==================================================

    const decodedToken =
      await firebaseAuth.verifyIdToken(
        token
      );

    // ==================================================
    // ATTACH FIREBASE USER TO REQUEST
    // ==================================================

    req.firebaseUser = {
      uid:
        decodedToken.uid,

      email:
        decodedToken.email ||
        "",

      name:
        decodedToken.name ||
        "",

      emailVerified:
        decodedToken.email_verified ||
        false,
    };

    next();
  } catch (error) {
    console.error(
      "Firebase token verification failed:",
      error.message
    );

    return res
      .status(401)
      .json({
        success: false,
        message:
          "Invalid or expired Firebase authentication token.",
      });
  }
};

export default verifyFirebaseToken;