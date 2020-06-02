const mongoose = require("mongoose");

const attestationSchema = new mongoose.Schema(
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

const Attestation = mongoose.model("Attestation", attestationSchema);

module.exports = Attestation;
