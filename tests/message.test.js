const moment = require("moment");
const request = require("supertest");
const app = require("../src/app");
const Attestation = require("../src/models/attestation");
const {
  createAttestations,
  getAccountsThatAreDue,
  getPersonsOnAccounts,
  updateAttestationDocument,
} = require("../src/messages/messages");
const {
  accountOne,
  accountTwo,
  personOne,
  personTwo,
  personThree,
  userOne,
  setupDatabase,
} = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should get active accounts including account that has never sent messages", async () => {
  const currentTime = new Date();
  const accounts = await getAccountsThatAreDue(currentTime);
  expect(accounts).toHaveLength(1);
});

test("Should get active accounts including account that has sent messages in past", async () => {
  const currentTime = new Date();
  const yesterday = moment().subtract(1, "day").startOf("day");

  // set up test
  await request(app)
    .patch("/accounts/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ lastSent: yesterday });

  const accounts1 = await getAccountsThatAreDue(currentTime);
  expect(accounts1).toHaveLength(1);
});

test("Should get active persons from account but not if messages sent today", async () => {
  const currentTime = new Date();
  const today = moment();

  // set up test
  await request(app)
    .patch("/accounts/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({ lastSent: today });

  const accounts1 = await getAccountsThatAreDue(currentTime);
  expect(accounts1).toHaveLength(0);
});

test("Should get active persons on accounts", async () => {
  const personsTest1 = await getPersonsOnAccounts([
    accountOne._id,
    accountTwo._id,
  ]);
  expect(personsTest1).toHaveLength(3);
  const ids = personsTest1.map((p) => p._id);
  expect([personOne, personTwo, personThree].map((p) => p._id).sort()).toEqual(
    ids.sort()
  );

  const personsTest2 = await getPersonsOnAccounts([accountTwo._id]);
  expect(personsTest2).toHaveLength(1);
});

test("Should create attestations", async () => {
  const persons = await getPersonsOnAccounts([accountOne._id, accountTwo._id]);
  const attestations = await createAttestations(persons);
  expect(attestations).toHaveLength(3);
  attestations.forEach((a) => {
    expect(a).toHaveProperty("accountId");
    expect(a).toHaveProperty("personId");
    expect(a).toHaveProperty("phoneNumber");
    expect(a).toHaveProperty("messageSent");
  });
});

test("Should update attestation document if one exists for today", async () => {
  // set up test with new attestation document for today
  await new Attestation({
    personId: personThree._id,
    accountId: personThree.accountId,
    messageSent: new Date(),
    phoneNumber: "1234561234",
  }).save();

  const today = moment(Date.now()).startOf("day").format();
  const updatedAttestation = await updateAttestationDocument(
    "yes",
    "1234561234"
  );
  expect(updatedAttestation.passCheck).toBe(false);
  expect(
    moment(updatedAttestation.replyReceived).startOf("day").format()
  ).toEqual(today);

  const updatedAttestation2 = await updateAttestationDocument(
    "no",
    "1234561234"
  );
  expect(updatedAttestation2.passCheck).toBe(true);
});

test("Should not update attestation document if none exists for today", async () => {
  // set up test with new attestation document with past date
  await new Attestation({
    personId: personThree._id,
    accountId: personThree.accountId,
    messageSent: moment(new Date()).subtract(1, "month"),
    phoneNumber: "1234561234",
  }).save();

  const updatedAttestation = await updateAttestationDocument(
    "yes",
    "1234561234"
  );
  expect(updatedAttestation).toBe(null);
});
