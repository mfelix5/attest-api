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
const sendMessage = async attestation => {
  const options = {
    // to: `+1${attestation.phoneNumber}`,
    to: `+18455516269`,
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

const getAccountsThatAreDue = async (currentTime) => {
  const currentUTCHour = currentTime.getUTCHours();
  console.log('currentUTCHour', currentUTCHour)
  const today = moment().startOf('day');

  const accounts = await Account.find({
    active: true,
    "config.messagesToPersons.dailySendTime": currentUTCHour,
    $or: [
      { "config.messagesToPersons.lastSent": null },
      { "config.messagesToPersons.lastSent": { $lte: today.toDate() }}
    ]
  });

  console.log('total accounts:', accounts.length);
  console.log('account names:', accounts.map(a => a.name));
  return accounts;
}

const getPersonsOnAccounts = async accounts => {
  const personPromises = accounts.map(account => {
    return Person.find({
      accountId: account._id,
      active: true
    });
  });
  const persons = [].concat(...(await Promise.all(personPromises)));
  console.log('total persons:', persons.length);
  console.log('persons', persons.map(p => p.firstName));
  return persons;
}

const createAttestations = async persons => {
  const attestationPromises = persons.map(person => {
    return new Attestation({
      status: "sent",
      accountId: person.accountId,
      personId: person._id,
      phoneNumber: person.primaryPhone,
      message: `Hi ${person.firstName} ${person.lastName}. Are you Ok?`
    }).save();
  });
  const attestations = [].concat(...(await Promise.all(attestationPromises)));
  return attestations;
}

const sendMessagesToPeopleThatMustAttest = async currentTime => {
  try {
    const accounts = await getAccountsThatAreDue(currentTime);
    const persons = await getPersonsOnAccounts(accounts);
    const attestations = await createAttestations(persons);

    // send SMS
    console.log(`Sending ${attestations.length} messages`);
    attestations.forEach((attestation) => sendMessage(attestation));

    // update lastSent on each account
    const accountUpdatePromises = accounts.map(account => {
      return Account.findOneAndUpdate(
        { _id: account._id },
        {"config.messagesToPersons.lastSent": Date.now()});
    });
    await Promise.all(accountUpdatePromises);

  } catch (e) {
    console.log(`Error from sendMessagesToPeopleThatMustAttest: ${e}`);
  }
}

module.exports = {
  getAccountsThatAreDue,
  sendMessagesToPeopleThatMustAttest,
};
