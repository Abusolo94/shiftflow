import Store from "../models/Store.js";
import User from "../models/User.js";

// ======================================================
// GET ALL STORES
// ADMIN ONLY
// ======================================================

export const getStores = async (
  req,
  res
) => {
  try {
    const stores =
      await Store.find()
        .sort({
          createdAt: -1,
        });

    return res.json({
      success: true,
      count:
        stores.length,
      stores,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error.message,
      });
  }
};

// ======================================================
// GET SINGLE STORE
// ======================================================

export const getStoreById =
  async (req, res) => {
    try {
      const store =
        await Store.findById(
          req.params.id
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

      if (
        req.user.accountType !==
          "admin" &&
        String(
          req.user.storeId?._id ||
            req.user.storeId
        ) !==
          String(store._id)
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "You cannot access this store.",
          });
      }

      return res.json({
        success: true,
        store,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
        });
    }
  };

// ======================================================
// CREATE STORE
// ADMIN ONLY
// ======================================================

export const createStore =
  async (req, res) => {
    try {
      const {
        storeNumber,
        storeName,
        contact,
        email,
        city,
        region,
        status,
      } = req.body;

      if (
        !storeNumber ||
        !storeName
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Store number and store name are required.",
          });
      }

      const existing =
        await Store.findOne({
          storeNumber:
            String(
              storeNumber
            ).trim(),
        });

      if (existing) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Store number already exists.",
          });
      }

      const store =
        await Store.create({
          storeNumber:
            String(
              storeNumber
            ).trim(),

          storeName:
            storeName.trim(),

          contact,
          email,
          city,
          region,
          status:
            status ||
            "Active",
        });

      return res
        .status(201)
        .json({
          success: true,
          store,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
        });
    }
  };

// ======================================================
// UPDATE STORE
// ADMIN ONLY
// ======================================================

export const updateStore =
  async (req, res) => {
    try {
      const store =
        await Store.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
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

      return res.json({
        success: true,
        store,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
        });
    }
  };

// ======================================================
// DELETE STORE
// ADMIN ONLY
// ======================================================

export const deleteStore =
  async (req, res) => {
    try {
      const store =
        await Store.findById(
          req.params.id
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

      const accountExists =
        await User.exists({
          storeId:
            store._id,
        });

      if (accountExists) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "This store still has user accounts assigned to it.",
          });
      }

      await store.deleteOne();

      return res.json({
        success: true,
        message:
          "Store deleted.",
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error.message,
        });
    }
  };