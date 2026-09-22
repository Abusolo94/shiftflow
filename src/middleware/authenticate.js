// import {
//   firebaseAuth,
// } from "../config/firebaseAdmin.js";

// import User from "../models/User.js";

// const authenticate = async (
//   req,
//   res,
//   next
// ) => {
//   try {
//     const authHeader =
//       req.headers.authorization;

//     if (
//       !authHeader ||
//       !authHeader.startsWith(
//         "Bearer "
//       )
//     ) {
//       return res
//         .status(401)
//         .json({
//           success: false,
//           message:
//             "Authentication token is required.",
//         });
//     }

//     const token =
//       authHeader.substring(7);

//     const decoded =
//       await firebaseAuth.verifyIdToken(
//         token
//       );

//     const account =
//       await User.findOne({
//         firebaseUid:
//           decoded.uid,
//       }).populate("storeId");

//     if (!account) {
//       return res
//         .status(403)
//         .json({
//           success: false,
//           message:
//             "Your Firebase account is not registered in ShiftFlow.",
//         });
//     }

//     if (
//       account.status !==
//       "Active"
//     ) {
//       return res
//         .status(403)
//         .json({
//           success: false,
//           message:
//             "This account is not active.",
//         });
//     }

//     req.firebaseUser =
//       decoded;

//     req.user =
//       account;

//     next();
//   } catch (error) {
//     console.error(
//       "Authentication error:",
//       error
//     );

//     return res
//       .status(401)
//       .json({
//         success: false,
//         message:
//           "Invalid or expired authentication token.",
//       });
//   }
// };

// export default authenticate;


import {
  firebaseAuth,
} from "../config/firebaseAdmin.js";

import User from "../models/User.js";

const authenticate = async (
  req,
  res,
  next
) => {
  /*
  |--------------------------------------------------------------------------
  | 1. Check Authorization header
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | 2. Extract token
  |--------------------------------------------------------------------------
  */

  const token =
    authHeader
      .substring(7)
      .trim();

  if (!token) {
    return res
      .status(401)
      .json({
        success: false,
        message:
          "Authentication token is empty.",
      });
  }

  let decoded;

  /*
  |--------------------------------------------------------------------------
  | 3. Verify Firebase ID token
  |--------------------------------------------------------------------------
  */

  try {
    decoded =
      await firebaseAuth.verifyIdToken(
        token
      );

    console.log(
      "Firebase token verified:",
      {
        uid: decoded.uid,
        email:
          decoded.email ||
          null,
        aud:
          decoded.aud ||
          null,
      }
    );
  } catch (error) {
    console.error(
      "Firebase token verification failed:",
      {
        code:
          error?.code ||
          "UNKNOWN",
        message:
          error?.message ||
          "Unknown Firebase authentication error",
      }
    );

    return res
      .status(401)
      .json({
        success: false,
        message:
          "Invalid or expired Firebase authentication token.",
      });
  }

  /*
  |--------------------------------------------------------------------------
  | 4. Find ShiftFlow account
  |--------------------------------------------------------------------------
  */

  let account;

  try {
    account =
      await User.findOne({
        firebaseUid:
          decoded.uid,
      }).populate(
        "storeId"
      );
  } catch (error) {
    console.error(
      "ShiftFlow account lookup failed:",
      {
        uid:
          decoded.uid,
        message:
          error?.message ||
          "Unknown database error",
      }
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Unable to load ShiftFlow account.",
      });
  }

  /*
  |--------------------------------------------------------------------------
  | 5. Account must exist
  |--------------------------------------------------------------------------
  */

  if (!account) {
    console.warn(
      "ShiftFlow account not found:",
      {
        firebaseUid:
          decoded.uid,
        email:
          decoded.email ||
          null,
      }
    );

    return res
      .status(403)
      .json({
        success: false,
        message:
          "Your Firebase account is not registered in ShiftFlow.",
      });
  }

  /*
  |--------------------------------------------------------------------------
  | 6. Account must be active
  |--------------------------------------------------------------------------
  */

  if (
    account.status !==
    "Active"
  ) {
    console.warn(
      "Inactive ShiftFlow account:",
      {
        accountId:
          account._id,
        firebaseUid:
          decoded.uid,
        status:
          account.status,
      }
    );

    return res
      .status(403)
      .json({
        success: false,
        message:
          "This account is not active.",
      });
  }

  /*
  |--------------------------------------------------------------------------
  | 7. Attach authenticated user
  |--------------------------------------------------------------------------
  */

  req.firebaseUser =
    decoded;

  req.user =
    account;

  console.log(
    "ShiftFlow authentication successful:",
    {
      uid:
        decoded.uid,
      accountId:
        account._id,
      accountType:
        account.accountType ||
        account.role ||
        null,
      storeId:
        account.storeId?._id ||
        account.storeId ||
        null,
    }
  );

  /*
  |--------------------------------------------------------------------------
  | 8. Continue
  |--------------------------------------------------------------------------
  */

  next();
};

export default authenticate;