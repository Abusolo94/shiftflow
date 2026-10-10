




// import mongoose from "mongoose";

// /* =========================================================
//    HELPERS
// ========================================================= */

// const cleanString = (value) =>
//   typeof value === "string" ? value.trim() : "";

// const getTaskLabel = (item) => {
//   if (typeof item === "string") {
//     return item.trim();
//   }

//   if (!item || typeof item !== "object") {
//     return "";
//   }

//   return cleanString(
//     item.task ||
//     item.title ||
//     item.label ||
//     item.name
//   );
// };

// /* =========================================================
//    CHECKLIST TASK SCHEMA
// ========================================================= */

// const checklistTaskSchema = new mongoose.Schema(
//   {
//     id: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     task: {
//       type: String,
//       required: [true, "Checklist task description is required."],
//       trim: true,
//     },

//     title: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     completed: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     _id: false,
//   }
// );

// /* =========================================================
//    CHECKLIST SECTION SCHEMA
// ========================================================= */

// const checklistSectionSchema = new mongoose.Schema(
//   {
//     area: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     tasks: {
//       type: [checklistTaskSchema],
//       default: [],
//     },
//   },
//   {
//     _id: false,
//   }
// );

// /* =========================================================
//    CHECKLIST GROUP SCHEMA
// ========================================================= */

// const checklistGroupSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     sections: {
//       type: [checklistSectionSchema],
//       default: [],
//     },
//   },
//   {
//     _id: false,
//   }
// );

// /* =========================================================
//    NORMALIZE CHECKLIST DATA

//    Accepts:
//    - task
//    - title
//    - label
//    - name
//    - string tasks

//    Always stores:
//    - id
//    - task
//    - title
//    - completed
// ========================================================= */

// const normalizeChecklist = (checklist) => {
//   if (!Array.isArray(checklist)) {
//     return [];
//   }

//   return checklist.map((group, groupIndex) => ({
//     title: cleanString(
//       group?.title ||
//       group?.name ||
//       `Checklist ${groupIndex + 1}`
//     ),

//     sections: Array.isArray(group?.sections)
//       ? group.sections.map((section, sectionIndex) => ({
//           area: cleanString(
//             section?.area ||
//             section?.title ||
//             section?.name ||
//             `Section ${sectionIndex + 1}`
//           ),

//           tasks: Array.isArray(section?.tasks)
//             ? section.tasks.map((item, taskIndex) => {
//                 const label = getTaskLabel(item);

//                 const id =
//                   typeof item === "object" && item !== null
//                     ? item.id || item.taskId
//                     : null;

//                 return {
//                   id: String(
//                     id ??
//                     `${groupIndex}-${sectionIndex}-${taskIndex}`
//                   ),

//                   task: label,
//                   title: label,

//                   completed:
//                     typeof item === "object" &&
//                     item !== null &&
//                     item.completed === true,
//                 };
//               })
//             : [],
//         }))
//       : [],
//   }));
// };

// /* =========================================================
//    CALCULATE CHECKLIST PROGRESS
// ========================================================= */

// const calculateChecklistProgress = (checklist = []) => {
//   let totalTasks = 0;
//   let completedTasks = 0;

//   if (!Array.isArray(checklist)) {
//     return {
//       totalTasks: 0,
//       completedTasks: 0,
//       score: 0,
//     };
//   }

//   checklist.forEach((group) => {
//     if (!Array.isArray(group?.sections)) return;

//     group.sections.forEach((section) => {
//       if (!Array.isArray(section?.tasks)) return;

//       section.tasks.forEach((task) => {
//         totalTasks += 1;

//         if (task?.completed === true) {
//           completedTasks += 1;
//         }
//       });
//     });
//   });

//   const score = totalTasks
//     ? Math.round((completedTasks / totalTasks) * 100)
//     : 0;

//   return {
//     totalTasks,
//     completedTasks,
//     score,
//   };
// };

// /* =========================================================
//    SHIFT SCHEMA
// ========================================================= */

// const shiftSchema = new mongoose.Schema(
//   {
//     /* =====================================================
//        STORE INFORMATION
//     ===================================================== */

//     storeId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Store",
//       required: [true, "Store ID is required."],
//       index: true,
//     },

//     storeNumber: {
//       type: String,
//       required: [true, "Store number is required."],
//       trim: true,
//       index: true,
//     },

//     storeName: {
//       type: String,
//       required: [true, "Store name is required."],
//       trim: true,
//     },

//     /* =====================================================
//        SHIFT INFORMATION
//     ===================================================== */

//     title: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     shiftDate: {
//       type: Date,
//       required: [true, "Shift business date is required."],
//     },

//     startTime: {
//       type: String,
//       required: [true, "Start time is required."],
//       trim: true,
//     },

//     endTime: {
//       type: String,
//       required: [true, "End time is required."],
//       trim: true,
//     },

//     shiftType: {
//       type: String,
//       trim: true,
//       default: "Regular",
//     },

//     /* =====================================================
//        MANAGER
//     ===================================================== */

//     managerName: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     managerUid: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     managerComment: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     /* =====================================================
//        CHECKLIST
//     ===================================================== */

//     checklist: {
//       type: [checklistGroupSchema],
//       default: [],
//     },

//     /* =====================================================
//        LEGACY TASK STATE

//        Example:
//        {
//          "0-0-0": true,
//          "0-0-1": false
//        }
//     ===================================================== */

//     tasks: {
//       type: Map,
//       of: Boolean,
//       default: {},
//     },

//     /* =====================================================
//        CHECKLIST PROGRESS
//     ===================================================== */

//     completedTasks: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     totalTasks: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },

//     score: {
//       type: Number,
//       default: 0,
//       min: 0,
//       max: 100,
//     },

//     /* =====================================================
//        ISSUES / HANDOVER
//     ===================================================== */

//     issues: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     handover: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     notes: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     /* =====================================================
//        STATUS
//     ===================================================== */

//     status: {
//       type: String,
//       enum: [
//         "Draft",
//         "Pending",
//         "Approved",
//         "Rejected",
//         "In Progress",
//         "Completed",
//         "Cancelled",
//       ],
//       default: "Draft",
//       index: true,
//     },

//     /* =====================================================
//        CREATOR
//     ===================================================== */

//     createdByUid: {
//       type: String,
//       required: [true, "Creator UID is required."],
//       index: true,
//     },

//     createdBy: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     createdByName: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     createdByEmail: {
//       type: String,
//       trim: true,
//       lowercase: true,
//       default: "",
//     },

//     /* =====================================================
//        APPROVAL
//     ===================================================== */

//     approvedByUid: {
//       type: String,
//       default: "",
//     },

//     approvedByName: {
//       type: String,
//       default: "",
//     },

//     approvedAt: {
//       type: Date,
//       default: null,
//     },

//     /* =====================================================
//        COMPLETION / VERIFICATION
//     ===================================================== */

//     verified: {
//       type: Boolean,
//       default: false,
//     },

//     completedAt: {
//       type: Date,
//       default: null,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /* =========================================================
//    AUTOMATIC CHECKLIST NORMALIZATION

//    Runs when assigning checklist through create/save.
// ========================================================= */

// shiftSchema.path("checklist").set(function (value) {
//   return normalizeChecklist(value);
// });

// /* =========================================================
//    AUTO CALCULATE CHECKLIST PROGRESS

//    Runs before document validation and save.
// ========================================================= */

// shiftSchema.pre("validate", function (next) {
//   try {
//     if (this.isNew || this.isModified("checklist")) {
//       const progress = calculateChecklistProgress(
//         this.checklist
//       );

//       this.totalTasks = progress.totalTasks;
//       this.completedTasks = progress.completedTasks;
//       this.score = progress.score;
//     }

//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// /* =========================================================
//    INDEXES
// ========================================================= */

// shiftSchema.index({
//   storeId: 1,
//   shiftDate: -1,
// });

// shiftSchema.index({
//   storeNumber: 1,
//   createdAt: -1,
// });

// shiftSchema.index({
//   status: 1,
//   createdAt: -1,
// });

// /* =========================================================
//    VIRTUALS
// ========================================================= */

// shiftSchema.virtual("completionPercentage").get(function () {
//   return this.score || 0;
// });

// shiftSchema.virtual("checklistScore").get(function () {
//   return this.score || 0;
// });

// /* =========================================================
//    JSON TRANSFORMATION
// ========================================================= */

// shiftSchema.set("toJSON", {
//   virtuals: true,
//   transform: (doc, ret) => {
//     ret.id = String(ret._id);

//     if (ret.tasks instanceof Map) {
//       ret.tasks = Object.fromEntries(ret.tasks);
//     }

//     return ret;
//   },
// });

// /* =========================================================
//    MODEL
// ========================================================= */

// const Shift =
//   mongoose.models.Shift ||
//   mongoose.model("Shift", shiftSchema);

// export default Shift;




import mongoose from "mongoose";

/* =========================================================
   HELPERS
========================================================= */

const cleanString = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const getTaskLabel = (item) => {
  if (typeof item === "string") {
    return item.trim();
  }

  if (!item || typeof item !== "object") {
    return "";
  }

  return cleanString(
    item.task ||
    item.title ||
    item.label ||
    item.name
  );
};

/* =========================================================
   CHECKLIST TASK SCHEMA
========================================================= */

const checklistTaskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
      default: "",
    },

    task: {
      type: String,
      required: [
        true,
        "Checklist task description is required.",
      ],
      trim: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   CHECKLIST SECTION SCHEMA
========================================================= */

const checklistSectionSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      trim: true,
      default: "",
    },

    tasks: {
      type: [checklistTaskSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   CHECKLIST GROUP SCHEMA
========================================================= */

const checklistGroupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },

    sections: {
      type: [checklistSectionSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   NORMALIZE CHECKLIST DATA

   Accepts:
   - String tasks
   - { task }
   - { title }
   - { label }
   - { name }

   Stores:
   - id
   - task
   - title
   - completed
========================================================= */

const normalizeChecklist = (checklist = []) => {
  if (!Array.isArray(checklist)) {
    return [];
  }

  return checklist.map((group, groupIndex) => ({
    title: cleanString(
      group?.title ||
      group?.name ||
      `Checklist ${groupIndex + 1}`
    ),

    sections: Array.isArray(group?.sections)
      ? group.sections.map((section, sectionIndex) => ({
          area: cleanString(
            section?.area ||
            section?.title ||
            section?.name ||
            `Section ${sectionIndex + 1}`
          ),

          tasks: Array.isArray(section?.tasks)
            ? section.tasks.map((item, taskIndex) => {
                const label = getTaskLabel(item);

                const providedId =
                  item &&
                  typeof item === "object"
                    ? item.id || item.taskId
                    : null;

                return {
                  id: cleanString(
                    providedId ??
                    `${groupIndex}-${sectionIndex}-${taskIndex}`
                  ),

                  task: label,
                  title: label,

                  completed:
                    item !== null &&
                    typeof item === "object" &&
                    item.completed === true,
                };
              })
            : [],
        }))
      : [],
  }));
};

/* =========================================================
   CALCULATE CHECKLIST PROGRESS
========================================================= */

const calculateChecklistProgress = (
  checklist = []
) => {
  let totalTasks = 0;
  let completedTasks = 0;

  if (!Array.isArray(checklist)) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      score: 0,
    };
  }

  for (const group of checklist) {
    if (!Array.isArray(group?.sections)) {
      continue;
    }

    for (const section of group.sections) {
      if (!Array.isArray(section?.tasks)) {
        continue;
      }

      for (const task of section.tasks) {
        totalTasks += 1;

        if (task?.completed === true) {
          completedTasks += 1;
        }
      }
    }
  }

  const score =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0;

  return {
    totalTasks,
    completedTasks,
    score,
  };
};

/* =========================================================
   SHIFT SCHEMA
========================================================= */

const shiftSchema = new mongoose.Schema(
  {
    /* =====================================================
       STORE INFORMATION
    ===================================================== */

    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [
        true,
        "Store ID is required.",
      ],
      index: true,
    },

    storeNumber: {
      type: String,
      required: [
        true,
        "Store number is required.",
      ],
      trim: true,
      index: true,
    },

    storeName: {
      type: String,
      required: [
        true,
        "Store name is required.",
      ],
      trim: true,
    },

    /* =====================================================
       SHIFT INFORMATION
    ===================================================== */

    title: {
      type: String,
      trim: true,
      default: "",
    },

    shiftDate: {
      type: Date,
      required: [
        true,
        "Shift business date is required.",
      ],
    },

    startTime: {
      type: String,
      required: [
        true,
        "Start time is required.",
      ],
      trim: true,
    },

    endTime: {
      type: String,
      required: [
        true,
        "End time is required.",
      ],
      trim: true,
    },

    shiftType: {
      type: String,
      trim: true,
      default: "Regular",
    },

    /* =====================================================
       SHIFT MANAGER
    ===================================================== */

    managerName: {
      type: String,
      trim: true,
      default: "",
    },

    managerUid: {
      type: String,
      trim: true,
      default: "",
    },

    managerComment: {
      type: String,
      trim: true,
      default: "",
    },

    /* =====================================================
       CHECKLIST
    ===================================================== */

    checklist: {
      type: [checklistGroupSchema],
      default: [],
    },

    /* =====================================================
       LEGACY TASK STATE
    ===================================================== */

    tasks: {
      type: Map,
      of: Boolean,
      default: {},
    },

    /* =====================================================
       CHECKLIST PROGRESS
    ===================================================== */

    totalTasks: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    /* =====================================================
       ISSUES / HANDOVER / NOTES
    ===================================================== */

    issues: {
      type: String,
      trim: true,
      default: "",
    },

    handover: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    /* =====================================================
       SHIFT STATUS
    ===================================================== */

    status: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "Approved",
        "Rejected",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "Draft",
      index: true,
    },

    /* =====================================================
       CREATOR INFORMATION
    ===================================================== */

    createdByUid: {
      type: String,
      required: [
        true,
        "Creator UID is required.",
      ],
      index: true,
    },

    createdBy: {
      type: String,
      trim: true,
      default: "",
    },

    createdByName: {
      type: String,
      trim: true,
      default: "",
    },

    createdByEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    /* =====================================================
       APPROVAL INFORMATION
    ===================================================== */

    approvedByUid: {
      type: String,
      trim: true,
      default: "",
    },

    approvedByName: {
      type: String,
      trim: true,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    /* =====================================================
       COMPLETION / VERIFICATION
    ===================================================== */

    verified: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

/* =========================================================
   AUTOMATIC CHECKLIST NORMALIZATION

   Runs whenever a checklist is assigned.
========================================================= */

shiftSchema.path("checklist").set(function (value) {
  return normalizeChecklist(value);
});

/* =========================================================
   AUTOMATIC CHECKLIST PROGRESS

   IMPORTANT:
   No next() callback.

   Compatible with synchronous Mongoose middleware,
   including Mongoose 9.
========================================================= */

shiftSchema.pre("validate", function () {
  if (
    this.isNew ||
    this.isModified("checklist")
  ) {
    const progress =
      calculateChecklistProgress(
        this.checklist || []
      );

    this.totalTasks = progress.totalTasks;
    this.completedTasks =
      progress.completedTasks;
    this.score = progress.score;
  }
});

/* =========================================================
   DATABASE INDEXES
========================================================= */

shiftSchema.index({
  storeId: 1,
  shiftDate: -1,
});

shiftSchema.index({
  storeNumber: 1,
  createdAt: -1,
});

shiftSchema.index({
  status: 1,
  createdAt: -1,
});

/* =========================================================
   VIRTUAL FIELDS
========================================================= */

shiftSchema
  .virtual("completionPercentage")
  .get(function () {
    return this.score || 0;
  });

shiftSchema
  .virtual("checklistScore")
  .get(function () {
    return this.score || 0;
  });

/* =========================================================
   JSON TRANSFORMATION
========================================================= */

shiftSchema.set("toJSON", {
  virtuals: true,

  transform: (doc, ret) => {
    ret.id = String(ret._id);

    if (ret.tasks instanceof Map) {
      ret.tasks = Object.fromEntries(
        ret.tasks
      );
    }

    return ret;
  },
});

/* =========================================================
   MODEL EXPORT
========================================================= */

const Shift =
  mongoose.models.Shift ||
  mongoose.model("Shift", shiftSchema);

export default Shift;
