const mongoose = require('mongoose');
const statesArray = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // address: {
  //   street: String,
  //   city: String,
  //   state: {
  //       type: String,
  //       uppercase: true,
  //       required: true,
  //       enum: statesArray
  //   },
  //   zip: Number
  // },
  // creditCard: {
  //   name: { type: String, required: true },
  //   number: { type: String, required: true },
  //   expirationDate: { type: String, required: true },
  // },
  subscriptionExpiration: {
    type: Date
  },
}, {
  timestamps: true
});


const Account = mongoose.model('Account', accountSchema);

module.exports = Account;