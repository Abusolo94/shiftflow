



// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// import morgan from "morgan";
// import rateLimit from "express-rate-limit";

// import authRoutes from "./routes/authRoutes.js";
// import storeRoutes from "./routes/storeRoutes.js";
// import issueRoutes from "./routes/issueRoutes.js";
// import shiftRoutes from "./routes/shiftRoutes.js";
// import foodSafetyRoutes from "./routes/foodSafetyRoutes.js";
// import foodSafetyVerificationRoutes from "./routes/foodSafetyVerificationRoutes.js";
// import maintenanceRoutes from "./routes/maintenanceRoutes.js";
// import restroomCleaningRoutes from "./routes/restroomCleaningRoutes.js";
// import travelPathRoutes from "./routes/travelPathRoutes.js";
// import securityChecklistRoutes from "./routes/securityChecklistRoutes.js";
// import shiftPlanRoutes from "./routes/shiftPlanRoutes.js";
// import employeeMealRoutes from "./routes/employeeMealRoutes.js";
// import cashTurnoverRoutes from "./routes/cashTurnoverRoutes.js";
// import cashAuditRoutes from "./routes/cashAuditRoutes.js";
// import adminAccountRoutes from "./routes/adminAccountRoutes.js";
// import adminSetupRoutes from "./routes/adminSetupRoutes.js";
// import notificationRoutes from "./routes/notificationRoutes.js";
// import settingsRoutes from "./routes/settingsRoutes.js";

// const app =
//   express();

// // --------------------------------------------------------------------------
// // | Trust Vercel reverse proxy
// // |--------------------------------------------------------------------------

// app.set("trust proxy", 1);

// // ======================================================
// // SECURITY
// // ======================================================

// app.use(helmet());

// app.use(
//   rateLimit({
//     windowMs:
//       15 * 60 * 1000,

//     max: 500,

//     standardHeaders: true,

//     legacyHeaders: false,
//   })
// );

// // ======================================================
// // CORS
// // ======================================================

// app.use(
//   cors({
//     origin:
//       process.env.CLIENT_URL,

//     credentials: true,
//   })
// );

// // ======================================================
// // BODY
// // ======================================================

// app.use(
//   express.json({
//     limit: "10mb",
//   })
// );

// app.use(
//   express.urlencoded({
//     extended: true,
//   })
// );

// app.use(morgan("dev"));

// // ======================================================
// // HEALTH
// // ======================================================

// app.get(
//   "/api/health",
//   (req, res) => {
//     res.json({
//       success: true,
//       message:
//         "ShiftFlow API is running.",
//     });
//   }
// );

// // ======================================================
// // ROUTES
// // ======================================================

// app.use(
//   "/api/auth",
//   authRoutes
// );

// app.use(
//   "/api/stores",
//   storeRoutes
// );

// app.use(
//   "/api/shifts",
//   shiftRoutes
// );

// app.use(
//   "/api/issues",
//   issueRoutes
// );
// app.use("/api/food-safety", foodSafetyRoutes);

// app.use(
//   "/api/food-safety-verification",
//   foodSafetyVerificationRoutes
// );

// app.use(
//   "/api/maintenance",
//   maintenanceRoutes
// );

// app.use(
//   "/api/restroom-cleaning",
//   restroomCleaningRoutes
// );


// app.use(
//   "/api/travel-path",
//   travelPathRoutes
// );


// app.use(
//   "/api/security-checklists",
//   securityChecklistRoutes
// );


// app.use(
//   "/api/shift-plans",
//   shiftPlanRoutes
// );


// app.use(
//   "/api/employee-meals",
//   employeeMealRoutes
// );

// app.use(
//   "/api/cash-turnovers",
//   cashTurnoverRoutes
// );

// app.use(
//   "/api/cash-audits",
//   cashAuditRoutes
// );

// app.use(
//   "/api/admin-accounts",
//   adminAccountRoutes
// );

// app.use(
//   "/api/admin-setup",
//   adminSetupRoutes
// );

// app.use(
//   "/api/notifications",
//   notificationRoutes
// );

// app.use(
//   "/api/settings",
//   settingsRoutes
// );

// // ======================================================
// // 404
// // ======================================================

// app.use(
//   (req, res) => {
//     res
//       .status(404)
//       .json({
//         success: false,
//         message:
//           "API route not found.",
//       });
//   }
// );

// // ======================================================
// // GLOBAL ERROR
// // ======================================================

// app.use(
//   (
//     error,
//     req,
//     res,
//     next
//   ) => {
//     console.error(error);

//     res
//       .status(
//         error.status || 500
//       )
//       .json({
//         success: false,
//         message:
//           error.message ||
//           "Internal server error.",
//       });
//   }
// );

// export default app;




import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";
import foodSafetyRoutes from "./routes/foodSafetyRoutes.js";
import foodSafetyVerificationRoutes from "./routes/foodSafetyVerificationRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import restroomCleaningRoutes from "./routes/restroomCleaningRoutes.js";
import travelPathRoutes from "./routes/travelPathRoutes.js";
import securityChecklistRoutes from "./routes/securityChecklistRoutes.js";
import shiftPlanRoutes from "./routes/shiftPlanRoutes.js";
import employeeMealRoutes from "./routes/employeeMealRoutes.js";
import cashTurnoverRoutes from "./routes/cashTurnoverRoutes.js";
import cashAuditRoutes from "./routes/cashAuditRoutes.js";
import adminAccountRoutes from "./routes/adminAccountRoutes.js";
import adminSetupRoutes from "./routes/adminSetupRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

const app = express();

// ======================================================
// TRUST VERCEL REVERSE PROXY
// ======================================================

app.set("trust proxy", 1);

// ======================================================
// SECURITY
// ======================================================

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 500,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});

app.use(limiter);

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// ======================================================
// BODY PARSERS
// ======================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ======================================================
// LOGGING
// ======================================================

app.use(morgan("dev"));

// ======================================================
// PUBLIC HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShiftFlow API is running.",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShiftFlow API is healthy.",
  });
});

// ======================================================
// DATABASE CONNECTION
// ======================================================

app.use(async (req, res, next) => {
  try {
    await connectDB();

    next();
  } catch (error) {
    console.error(
      "Database middleware error:",
      error?.message || error
    );

    return res.status(503).json({
      success: false,
      message:
        "Database connection unavailable. Please try again.",
    });
  }
});

// ======================================================
// AUTH ROUTES
// ======================================================

app.use(
  "/api/auth",
  authRoutes
);

// ======================================================
// STORE ROUTES
// ======================================================

app.use(
  "/api/stores",
  storeRoutes
);

// ======================================================
// SHIFT ROUTES
// ======================================================

app.use(
  "/api/shifts",
  shiftRoutes
);

// ======================================================
// ISSUE ROUTES
// ======================================================

app.use(
  "/api/issues",
  issueRoutes
);

// ======================================================
// FOOD SAFETY ROUTES
// ======================================================

app.use(
  "/api/food-safety",
  foodSafetyRoutes
);

app.use(
  "/api/food-safety-verification",
  foodSafetyVerificationRoutes
);

// ======================================================
// MAINTENANCE ROUTES
// ======================================================

app.use(
  "/api/maintenance",
  maintenanceRoutes
);

// ======================================================
// RESTROOM CLEANING ROUTES
// ======================================================

app.use(
  "/api/restroom-cleaning",
  restroomCleaningRoutes
);

// ======================================================
// TRAVEL PATH ROUTES
// ======================================================

app.use(
  "/api/travel-path",
  travelPathRoutes
);

// ======================================================
// SECURITY CHECKLIST ROUTES
// ======================================================

app.use(
  "/api/security-checklists",
  securityChecklistRoutes
);

// ======================================================
// SHIFT PLAN ROUTES
// ======================================================

app.use(
  "/api/shift-plans",
  shiftPlanRoutes
);

// ======================================================
// EMPLOYEE MEAL ROUTES
// ======================================================

app.use(
  "/api/employee-meals",
  employeeMealRoutes
);

// ======================================================
// CASH TURNOVER ROUTES
// ======================================================

app.use(
  "/api/cash-turnovers",
  cashTurnoverRoutes
);

// ======================================================
// CASH AUDIT ROUTES
// ======================================================

app.use(
  "/api/cash-audits",
  cashAuditRoutes
);

// ======================================================
// ADMIN ACCOUNT ROUTES
// ======================================================

app.use(
  "/api/admin-accounts",
  adminAccountRoutes
);

// ======================================================
// INITIAL ADMIN SETUP ROUTES
// ======================================================

app.use(
  "/api/admin-setup",
  adminSetupRoutes
);

// ======================================================
// NOTIFICATION ROUTES
// ======================================================

app.use(
  "/api/notifications",
  notificationRoutes
);

// ======================================================
// SETTINGS ROUTES
// ======================================================

app.use(
  "/api/settings",
  settingsRoutes
);

// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Global application error:",
      error
    );

    res
      .status(
        error.status || 500
      )
      .json({
        success: false,
        message:
          error.message ||
          "Internal server error.",
      });
  }
);

export default app;