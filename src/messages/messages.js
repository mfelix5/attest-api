const moment = require("moment");
const twilio = require("twilio");
const Attestation = require("../models/attestation");
const Person = require("../models/person");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Sends an SMS to the specified phone number in an attestation
 *
 * @param {*} attestation
 */
async function sendMessage(attestation) {
  const options = {
    to: `+ ${attestation.phoneNumber}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: `Hi ${attestation.name}. I still need to build out the logic for the message body here.`,
  };

  try {
    client.messages.create(options);
    let masked = attestation.phoneNumber.substr(
      0,
      attestation.phoneNumber.length - 5
    );
    masked += "*****";
    console.log(`Message sent to ${masked}`);
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
  const persons = await Person.find({ active: true });

  const personsThatMustAttest = persons.filter((person) => {
    // function requiresAttestation(person, currentTime) {
    //   return (
    //     Math.round(
    //       moment
    //         .duration(
    //           moment(person.time)
    //             .tz(person.timeZone)
    //             .utc()
    //             .diff(moment(currentTime).utc())
    //         )
    //         .asMinutes()
    //     ) === person.notification
    //   );
    // }
  });

  const attestations = personsThatMustAttest.map((person) => {
    // create attestation record for each phone number
    // send SMS for each
  });

  // attestations.push({
  //   phoneNumber: "+18455516269",
  //   name: "Mike"
  // });

  console.log(`Sending ${attestations.length} messages`);
  attestations.forEach((attestation) => sendMessage(attestation));
}

module.exports = {
  sendMessagesToPeopleThatMustAttest,
};
