const moment = require("moment");
const request = require("supertest");
const app = require("../src/app");
const Account = require("../src/models/account");
const Person = require("../src/models/person");
const { createAttestations, getAccountsThatAreDue, getPersonsOnAccounts } = require("../src/messages/messages");
const { accountOne, accountTwo, personOne, personTwo, personThree, userOne, setupDatabase } = require("./fixtures/db");

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
  const personsTest1 = await getPersonsOnAccounts([accountOne._id, accountTwo._id]);
  expect(personsTest1).toHaveLength(3);
  const ids = personsTest1.map(p => p._id);
  expect([personOne, personTwo, personThree].map(p => p._id).sort()).toEqual(ids.sort());

  const personsTest2 = await getPersonsOnAccounts([accountTwo._id]);
  expect(personsTest2).toHaveLength(1);
});

test("Should create attestations", async () => {
  const persons = await getPersonsOnAccounts([accountOne._id, accountTwo._id]);
  const attestations = await createAttestations(persons);
  expect(attestations).toHaveLength(3);
  attestations.forEach(a => {
    expect(a).toHaveProperty("accountId")
    expect(a).toHaveProperty("personId")
    expect(a).toHaveProperty("phoneNumber")
    expect(a).toHaveProperty("messageSent")
  });
});