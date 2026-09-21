import mongoose from "mongoose";

import Issue from "../models/Issue.js";
import Store from "../models/Store.js";

// ======================================================
// ACCOUNT TYPE
// ======================================================

const getAccountType = (user) => {
  if (!user) {
    return null;
  }

  if (user.accountType) {
    return user.accountType.toLowerCase();
  }

  if (
    user.role?.toLowerCase() ===
    "admin"
  ) {
    return "admin";
  }

  return "store";
};

// ======================================================
// RESOLVE STORE ID
// ======================================================

const getUserStoreId = (user) => {
  if (!user) {
    return null;
  }

  return (
    user.storeId?._id ||
    user.storeId ||
    null
  );
};

// ======================================================
// STORE SCOPE
// ======================================================

const getStoreScope = (user) => {
  const accountType =
    getAccountType(user);

  // Admin can see all stores
  if (
    accountType === "admin"
  ) {
    return {};
  }

  const storeId =
    getUserStoreId(user);

  if (!storeId) {
    return null;
  }

  return {
    storeId,
  };
};

// ======================================================
// NORMALIZE ISSUE
// ======================================================

const normalizeIssue = (issue) => {
  if (!issue) {
    return null;
  }

  const data =
    issue.toObject
      ? issue.toObject()
      : issue;

  return {
    ...data,

    id:
      data._id?.toString() ||
      data.id,

    _id:
      data._id?.toString() ||
      data._id,

    storeId:
      data.storeId?._id?.toString() ||
      data.storeId?.toString() ||
      null,
  };
};

// ======================================================
// GET ISSUES
// ======================================================

export const getIssues =
  async (req, res) => {
    try {
      const scope =
        getStoreScope(
          req.user
        );

      if (!scope) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
      }

      const {
        status,
        storeNumber,
        priority,
        assignedTo,
      } = req.query;

      const filter = {
        ...scope,
      };

      // Admin can filter by store number
      if (
        storeNumber &&
        getAccountType(
          req.user
        ) === "admin"
      ) {
        filter.storeNumber =
          storeNumber.trim();
      }

      if (status) {
        filter.status = status;
      }

      if (priority) {
        filter.priority =
          priority;
      }

      if (assignedTo) {
        filter.assignedTo =
          assignedTo;
      }

      const issues =
        await Issue.find(
          filter
        )
          .sort({
            createdAt: -1,
          })
          .populate(
            "storeId",
            "storeNumber storeName"
          );

      const normalizedIssues =
        issues.map(
          normalizeIssue
        );

      return res.json({
        success: true,

        count:
          normalizedIssues.length,

        issues:
          normalizedIssues,
      });
    } catch (error) {
      console.error(
        "Get Issues:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to fetch issues.",
        });
    }
  };

// ======================================================
// GET SINGLE ISSUE
// ======================================================

export const getSingleIssue =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid issue ID.",
          });
      }

      const scope =
        getStoreScope(
          req.user
        );

      if (!scope) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
      }

      const issue =
        await Issue.findOne({
          _id: id,
          ...scope,
        }).populate(
          "storeId",
          "storeNumber storeName"
        );

      if (!issue) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Issue not found or you are not authorized to access it.",
          });
      }

      return res.json({
        success: true,
        issue:
          normalizeIssue(
            issue
          ),
      });
    } catch (error) {
      console.error(
        "Get Single Issue:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to fetch issue.",
        });
    }
  };

// ======================================================
// CREATE ISSUE
// ======================================================

export const createIssue =
  async (req, res) => {
    try {
      const accountType =
        getAccountType(
          req.user
        );

      let store = null;

      // ======================================
      // ADMIN
      // ======================================

      if (
        accountType === "admin"
      ) {
        if (
          !req.body.storeId
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Admin must select a store.",
            });
        }

        if (
          !mongoose.Types.ObjectId.isValid(
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

        store =
          await Store.findById(
            req.body.storeId
          );
      }

      // ======================================
      // STORE ACCOUNT
      // ======================================

      else {
        const storeId =
          getUserStoreId(
            req.user
          );

        if (!storeId) {
          return res
            .status(403)
            .json({
              success: false,
              message:
                "Your account is not assigned to a store.",
            });
        }

        store =
          await Store.findById(
            storeId
          );
      }

      if (!store) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Store could not be found.",
          });
      }

      // ======================================
      // VALIDATION
      // ======================================

      if (
        !req.body.title ||
        !req.body.title.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Issue title is required.",
          });
      }

      // ======================================
      // CREATE
      // ======================================

      const issue =
        await Issue.create({
          storeId:
            store._id,

          storeNumber:
            store.storeNumber,

          storeName:
            store.storeName,

          title:
            req.body.title.trim(),

          description:
            req.body.description
              ?.trim() || "",

          category:
            req.body.category
              ?.trim() || "",

          location:
            req.body.location
              ?.trim() || "",

          priority:
            req.body.priority ||
            "Medium",

          status:
            "Open",

          reportedByUid:
            req.firebaseUser
              ?.uid || "",

          reportedByName:
            req.user
              ?.displayName ||
            req.firebaseUser
              ?.name ||
            "",

          reportedByEmail:
            req.user
              ?.email ||
            req.firebaseUser
              ?.email ||
            "",
        });

      await issue.populate(
        "storeId",
        "storeNumber storeName"
      );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Issue created successfully.",
          issue:
            normalizeIssue(
              issue
            ),
        });
    } catch (error) {
      console.error(
        "Create Issue:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to create issue.",
        });
    }
  };

// ======================================================
// UPDATE ISSUE
// ======================================================

export const updateIssue =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid issue ID.",
          });
      }

      const scope =
        getStoreScope(
          req.user
        );

      if (!scope) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
      }

      const issue =
        await Issue.findOne({
          _id: id,
          ...scope,
        });

      if (!issue) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Issue not found or you are not authorized to modify it.",
          });
      }

      // ======================================
      // ALLOWED FIELDS
      // ======================================

      const allowedFields = [
        "title",
        "description",
        "category",
        "location",
        "priority",
        "status",
        "assignedTo",
        "assignedToUid",
        "resolution",
      ];

      allowedFields.forEach(
        (field) => {
          if (
            req.body[field] !==
            undefined
          ) {
            issue[field] =
              req.body[field];
          }
        }
      );

      // ======================================
      // ASSIGNMENT
      // ======================================

      if (
        req.body.assignedTo !==
        undefined
      ) {
        if (
          req.body.assignedTo
        ) {
          issue.assignedAt =
            new Date();
        } else {
          issue.assignedAt =
            null;

          issue.assignedToUid =
            "";
        }
      }

      // ======================================
      // RESOLUTION
      // ======================================

      if (
        req.body.status ===
          "Resolved" ||
        req.body.status ===
          "Closed"
      ) {
        if (
          !issue.resolvedAt
        ) {
          issue.resolvedAt =
            new Date();
        }

        issue.resolvedByUid =
          req.firebaseUser
            ?.uid || "";

        issue.resolvedByName =
          req.user
            ?.displayName ||
          req.firebaseUser
            ?.name ||
          "";
      }

      // ======================================
      // REOPEN ISSUE
      // ======================================

      if (
        req.body.status ===
          "Open" ||
        req.body.status ===
          "In Progress"
      ) {
        issue.resolvedAt =
          null;

        issue.resolvedByUid =
          "";

        issue.resolvedByName =
          "";
      }

      await issue.save();

      await issue.populate(
        "storeId",
        "storeNumber storeName"
      );

      return res.json({
        success: true,
        message:
          "Issue updated successfully.",
        issue:
          normalizeIssue(
            issue
          ),
      });
    } catch (error) {
      console.error(
        "Update Issue:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update issue.",
        });
    }
  };

// ======================================================
// DELETE ISSUE
// ======================================================

export const deleteIssue =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid issue ID.",
          });
      }

      const scope =
        getStoreScope(
          req.user
        );

      if (!scope) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Your account is not assigned to a store.",
          });
      }

      const issue =
        await Issue.findOne({
          _id: id,
          ...scope,
        });

      if (!issue) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Issue not found or you are not authorized to delete it.",
          });
      }

      await Issue.deleteOne({
        _id: id,
      });

      return res.json({
        success: true,
        message:
          "Issue deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Issue:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to delete issue.",
        });
    }
  };