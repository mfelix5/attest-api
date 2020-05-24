const mongoose = require("mongoose");

const attestationSchema = new mongoose.Schema(
  {
    status: {
      type: "String",
      enum: ["sent", "received"],
      required: true,
      default: "sent"
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Account",
    },
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Person",
    },
    phoneNumber: { type: String, required: true },
    message: {
      type: {
        text: { type: String },
        date: { type: Date },
      },
      required: true
    },
    response: {
      type: {
        text: { type: String },
        date: { type: Date },
      },
    },
    healthy: { type: Boolean },
  },
  {
    timestamps: true,
  }
);

const Attestation = mongoose.model("Attestation", attestationSchema);

module.exports = Attestation;
