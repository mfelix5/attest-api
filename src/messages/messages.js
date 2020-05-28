const moment = require("moment");
const twilio = require("twilio");
const Account = require("../models/account");
const Attestation = require("../models/attestation");
const Person = require("../models/person");

let twilioClient;

if (process.env.NODE_ENV === "prod") {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

/**
 * Sends an SMS to the specified phone number in an attestation
 */
const sendMessage = async attestation => {
  const options = {
    to: `+1${attestation.phoneNumber}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: attestation.message,
  };

  try {
    if (process.env.NODE_ENV = "prod") {
      twilioClient.messages.create(options);
    }
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

const getAccountsThatAreDue = async (currentTime) => {
  const today = moment(currentTime).startOf("day");
  return await Account.find({
    active: true,
    "config.messagesToPersons.dailySendTime": currentTime.getUTCHours(),
    $or: [
      { lastSent: { $exists: false } },
      { lastSent: { $lte: today }}
    ]
  });
}

const getPersonsOnAccounts = async accountIds => {
  const personPromises = accountIds.map(accountId => {
    return Person.find({
      accountId,
      active: true
    });
  });
  return [].concat(...(await Promise.all(personPromises)));
}

const createAttestations = async persons => {
  const attestationPromises = persons.map(person => {
    return new Attestation({
      status: "sent",
      accountId: person.accountId,
      personId: person._id,
      phoneNumber: person.primaryPhone,
      messageSent: new Date()
    }).save();
  });
  const attestations = [].concat(...(await Promise.all(attestationPromises)));
  return attestations;
}

const sendMessagesToPeopleThatMustAttest = async currentTime => {
  try {
    const accounts = await getAccountsThatAreDue(currentTime);
    const persons = await getPersonsOnAccounts(accounts.map(a => a._id));
    const attestations = await createAttestations(persons);

    // send SMS
    console.log(`Sending ${attestations.length} messages`);
    attestations.forEach((attestation) => sendMessage(attestation));

    // update lastSent on each account
    const accountsToUpdate = [...new Set(persons.map(p => p.accountId))];
    const accountUpdatePromises = accountsToUpdate.map(accountId => {
      return Account.findOneAndUpdate(
        { _id: accountId },
        {"config.messagesToPersons.lastSent": moment()});
    });
    await Promise.all(accountUpdatePromises);

  } catch (e) {
    console.log(`Error from sendMessagesToPeopleThatMustAttest: ${e}`);
  }
}

module.exports = {
  createAttestations,
  getAccountsThatAreDue,
  getPersonsOnAccounts,
  sendMessagesToPeopleThatMustAttest,
};
