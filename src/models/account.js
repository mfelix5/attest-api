const mongoose = require("mongoose");
const Person = require("./person");
const statesArray = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

const accountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: {
        address1: { type: String, required: true, trim: true },
        address2: { type: String, required: false, trim: true },
        city: { type: String, required: true, trim: true },
        state: {
          type: String,
          uppercase: true,
          required: true,
          enum: statesArray,
        },
        zip: String,
      },
      required: false,
    },
    creditCard: {
      type: {
        name: { type: String, required: true },
        number: { type: String, required: true },
        expirationDate: { type: String, required: true },
      },
      required: false,
    },
    active: {
      type: Boolean,
      required: true,
      default: true
    },
    config: {
      type: {
        messagesToPersons: {
          dailySendTime: { type: Number, min: 0, max: 23 }, // UTC hour
          lastSent: { type: Date, default: null }
        },
        messageToAdmin: {
          dailySendTime: { type: Number, min: 0, max: 23 }, // UTC hour
          lastSent: { type: Date }
        },
        timeZone: { type: String, default: null }
       }
    }
  },
  {
    timestamps: true,
  }
);

// Delete persons of concern when account is removed
accountSchema.pre("remove", async function (next) {
  const account = this;
  await Person.deleteMany({ accountId: account._id });
  next();
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;