const moment = require("moment");
const twilio = require("twilio");
const Account = require("../models/account");
const Attestation = require("../models/attestation");
const Person = require("../models/person");
const User = require("../models/user");
const {
  appNotificationToAdmin,
  wellnessCheck,
} = require("../messages/constants");

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
const sendMessage = async (phoneNumber, message) => {
  const options = {
    to: `+1${phoneNumber}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: message,
  };

  try {
    if (process.env.NODE_ENV === "prod") {
      twilioClient.messages.create(options);
    }
    let masked = phoneNumber.substr(0, phoneNumber.length - 5);
    masked += "*****";
    console.log(`SMS sent to ${masked}`);
  } catch (err) {
    console.error(err);
  }
};

const getAccountsThatAreDue = async (currentTime) => {
  const today = moment(currentTime).startOf("day");
  return await Account.find({
    active: true,
    "config.messagesToPersons.dailySendTime": currentTime.getUTCHours(),
    $or: [{ lastSent: { $exists: false } }, { lastSent: { $lte: today } }],
  });
};

const getPersonsOnAccounts = async (accountIds) => {
  const personPromises = accountIds.map((accountId) => {
    return Person.find({
      accountId,
      active: true,
    });
  });
  return [].concat(...(await Promise.all(personPromises)));
};

const createOrUpdateAttestation = async (data, accountId) => {
  const { personId, phoneNumber, messageSent, responseReceived, passCheck } = data;
  const exists = await Attestation.findOne({
    personId,
    messageSent: { $gte: moment(messageSent).startOf("day") },
  });

  if (exists) {
    // update
    return await Attestation.findOneAndUpdate({
      _id: exists._id
    }, {
      phoneNumber,
      messageSent,
      responseReceived,
      passCheck
    });
  } else {
    //create
    const attestation = new Attestation({
      ...data,
      accountId,
    });
    return await attestation.save();
  }
}

const createAttestations = async (persons) => {
  const today = moment().startOf("day");
  const attestationPromises = persons.map((person) => {
    const attestationData = {
      personId: person._id,
      phoneNumber: person.primaryPhone,
      messageSent: new Date()
    }
    return createOrUpdateAttestation(attestationData, person.accountId)
  });
  const attestations = [].concat(...(await Promise.all(attestationPromises)));
  return attestations;
};

const sendMessagesToPeopleThatMustAttest = async (currentTime) => {
  try {
    const accounts = await getAccountsThatAreDue(currentTime);
    const persons = await getPersonsOnAccounts(accounts.map((a) => a._id));
    const attestations = await createAttestations(persons);

    // send SMS
    console.log(`Sending ${attestations.length} messages`);
    attestations.forEach((attestation) => {
      sendMessage(attestation.phoneNumber, wellnessCheck);
    });

    // update lastSent on each account
    const accountsToUpdate = [...new Set(persons.map((p) => p.accountId))];
    const accountUpdatePromises = accountsToUpdate.map((accountId) => {
      return Account.findOneAndUpdate(
        { _id: accountId },
        { "config.messagesToPersons.lastSent": moment() }
      );
    });
    await Promise.all(accountUpdatePromises);
  } catch (e) {
    console.log(`Error from sendMessagesToPeopleThatMustAttest: ${e}`);
  }
};

const updateAttestationDocument = async (reply, phoneNumber) => {
  const today = moment().startOf("day");

  let number = phoneNumber.slice();
  if (phoneNumber.startsWith("+1")) number = phoneNumber.slice(2);

  const updated = await Attestation.findOneAndUpdate(
    {
      messageSent: { $gte: today },
      phoneNumber: number,
    },
    {
      passCheck: reply === "no",
      responseReceived: new Date(),
    },
    { new: true }
  );
  return updated;
};

const notifyAdmins = async (phoneNumber) => {
  let number = phoneNumber.slice();
  if (phoneNumber.startsWith("+1")) number = phoneNumber.slice(2);

  const personOfConcern = await Person.findOne({ primaryPhone: number });
  const relatedAdmins = await User.find({
    accountId: personOfConcern.accountId,
    isAdmin: true,
  });
  const message = `${personOfConcern.firstName} ${personOfConcern.lastName} ${appNotificationToAdmin}`;
  relatedAdmins.forEach((admin) => {
    sendMessage(admin.phoneNumber, message);
  });
};

module.exports = {
  createAttestations,
  createOrUpdateAttestation,
  getAccountsThatAreDue,
  getPersonsOnAccounts,
  notifyAdmins,
  sendMessagesToPeopleThatMustAttest,
  updateAttestationDocument,
};
