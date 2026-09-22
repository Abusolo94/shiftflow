


import User from "../models/User.js";
import Store from "../models/Store.js";

// ======================================================
// GET CURRENT LOGGED-IN ACCOUNT
// GET /api/auth/me
// ======================================================

export const getMe = async (req, res) => {
  try {
    const account = req.user;

    const store =
      account.storeId &&
      typeof account.storeId === "object"
        ? account.storeId
        : null;

    return res.status(200).json({
      success: true,

      user: {
        id: account._id,

        firebaseUid:
          account.firebaseUid,

        displayName:
          account.displayName,

        email:
          account.email,

        accountType:
          account.accountType,

        role:
          account.role,

        status:
          account.status,

        storeId:
          store?._id ||
          account.storeId ||
          null,

        storeNumber:
          store?.storeNumber ||
          account.storeNumber ||
          "",

        storeName:
          store?.storeName ||
          account.storeName ||
          "",

        contact:
          account.contact ||
          "",

        usersAllowed:
          account.usersAllowed ||
          [],

        lastLogin:
          account.lastLogin,

        createdAt:
          account.createdAt,

        updatedAt:
          account.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Get current account error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load account.",
    });
  }
};

// ======================================================
// REGISTER STORE ACCOUNT
// POST /api/auth/register
//
// Firebase account already exists at this point.
// The Firebase token is verified before this controller.
// ======================================================

export const registerStoreAccount = async (
  req,
  res
) => {
  let createdStore = null;

  try {
    const firebaseUser =
      req.firebaseUser;

    if (!firebaseUser?.uid) {
      return res.status(401).json({
        success: false,
        message:
          "Firebase authentication is required.",
      });
    }

    const {
      storeNumber,
      storeName,
      contact,
      email,
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!storeNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Store number is required.",
      });
    }

    if (!storeName?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Store name is required.",
      });
    }

    const firebaseEmail =
      firebaseUser.email
        ?.trim()
        .toLowerCase();

    if (!firebaseEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Firebase account does not have an email address.",
      });
    }

    // Do not trust a different email sent from React.
    if (
      email &&
      email.trim().toLowerCase() !==
        firebaseEmail
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Registration email does not match the authenticated Firebase account.",
      });
    }

    // ==================================================
    // CHECK FIREBASE UID
    // ==================================================

    const existingUid =
      await User.findOne({
        firebaseUid:
          firebaseUser.uid,
      });

    if (existingUid) {
      return res.status(409).json({
        success: false,
        message:
          "This Firebase account is already registered.",
      });
    }

    // ==================================================
    // CHECK EMAIL
    // ==================================================

    const existingEmail =
      await User.findOne({
        email:
          firebaseEmail,
      });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already registered.",
      });
    }

    // ==================================================
    // CHECK STORE NUMBER
    // ==================================================

    const cleanStoreNumber =
      storeNumber.trim();

    const existingStore =
      await Store.findOne({
        storeNumber:
          cleanStoreNumber,
      });

    if (existingStore) {
      return res.status(409).json({
        success: false,
        message:
          "A store with this store number already exists.",
      });
    }

    // ==================================================
    // CREATE STORE
    // ==================================================

    createdStore =
      await Store.create({
        storeNumber:
          cleanStoreNumber,

        storeName:
          storeName.trim(),

        contact:
          contact?.trim() ||
          "",

        email:
          firebaseEmail,

        status:
          "Active",
      });

    // ==================================================
    // CREATE MONGODB USER
    //
    // IMPORTANT:
    // accountType is forced to store.
    // React cannot create an admin.
    // ==================================================

    const account =
      await User.create({
        firebaseUid:
          firebaseUser.uid,

        displayName:
          storeName.trim(),

        email:
          firebaseEmail,

        accountType:
          "store",

        role:
          "Store Account",

        storeId:
          createdStore._id,

        storeNumber:
          cleanStoreNumber,

        storeName:
          storeName.trim(),

        contact:
          contact?.trim() ||
          "",

        usersAllowed: [
          "Store Manager",
          "Shift Manager",
        ],

        status:
          "Active",

        lastLogin:
          new Date(),
      });

    // ==================================================
    // POPULATE STORE
    // ==================================================

    await account.populate(
      "storeId"
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Store account registered successfully.",

      user: {
        id:
          account._id,

        firebaseUid:
          account.firebaseUid,

        displayName:
          account.displayName,

        email:
          account.email,

        accountType:
          account.accountType,

        role:
          account.role,

        status:
          account.status,

        storeId:
          account.storeId?._id ||
          null,

        storeNumber:
          account.storeId
            ?.storeNumber ||
          account.storeNumber,

        storeName:
          account.storeId
            ?.storeName ||
          account.storeName,

        contact:
          account.contact,

        usersAllowed:
          account.usersAllowed,
      },
    });
  } catch (error) {
    console.error(
      "Store registration error:",
      error
    );

    // If Store was created but User creation failed,
    // remove the orphan Store document.
    if (createdStore?._id) {
      try {
        await Store.findByIdAndDelete(
          createdStore._id
        );
      } catch (
        cleanupError
      ) {
        console.error(
          "Store cleanup error:",
          cleanupError
        );
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account or store with these details already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to register store account.",
    });
  }
};