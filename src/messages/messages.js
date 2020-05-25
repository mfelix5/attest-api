const moment = require("moment");
const twilio = require("twilio");
const Attestation = require("../models/attestation");
const Account = require("../models/account");
const Person = require("../models/person");

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Sends an SMS to the specified phone number in an attestation
 */
async function sendMessage(attestation) {
  const options = {
    to: `+1${attestation.phoneNumber}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: attestation.message,
  };

  try {
    twilioClient.messages.create(options);
    let masked = attestation.phoneNumber.substr(
      0,
      attestation.phoneNumber.length - 5
    );
    masked += "*****";
    console.log(`SMS sent to ${masked}`);
  } catch (err) {
    console.error(err);
  }
}

/**
 * Searches for all attestations that are due in this minute and triggers
 * messages for them
 *
 * @param {Date} currentTime the current time to base the message on
 */
async function sendMessagesToPeopleThatMustAttest(currentTime) {
  // const now = moment.utc();
  const accounts = await Account.find({
    active: true,
    "config.dailySendTime": 3
  });

  const personPromises = accounts.map(account => {
    return Person.find({
      accountId: account._id,
      active: true
    });
  });
  const persons = [].concat(...(await Promise.all(personPromises)));

  const attestationPromises = persons.map(person => {
    return new Attestation({
      status: "sent",
      accountId: person.accountId,
      personId: person._id,
      phoneNumber: person.primaryPhone,
      message: `Hi ${person.firstName} ${person.lastName}. Are you Ok?`
    }).save();
  });
  const attestations = [].concat(...(await Promise.all(attestationPromises)));;

  console.log(`Sending ${attestations.length} messages`);
  attestations.forEach((attestation) => sendMessage(attestation));
}

module.exports = {
  sendMessagesToPeopleThatMustAttest,
};
