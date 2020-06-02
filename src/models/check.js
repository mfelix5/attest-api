const mongoose = require("mongoose");

const checkSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Account",
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Employee",
    },
    phoneNumber: { type: String, required: true },
    messageSent: { type: Date, required: true },
    responseReceived: { type: Date },
    passCheck: { type: Boolean },
  },
  {
    timestamps: true,
  }
);

const Check = mongoose.model("Check", checkSchema);

module.exports = Check;
