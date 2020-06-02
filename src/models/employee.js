const mongoose = require("mongoose");

// const phoneSchema = new mongoose.Schema({
//   number: {
//     type: String,
//     required: true,
//     maxlength: 10,
//     minlength: 10,
//   },
//   isOwnPhone: { type: Boolean, default: true, required: true },
//   owner: { type: String },
//   ownerRelationship: {
//     type: String,
//     enum: ["parent", "guardian", "partner", "child", "caregiver"],
//   },
// });

const employeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Account",
    },
    otherId: {
      type: String,
      required: false,
    },
    active: {
      type: Boolean,
      default: true
    },
    primaryPhone: { type: String, required: true },
    // phoneNumbers: [phoneSchema], // not used yet
  },
  {
    timestamps: true
  }
);

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
