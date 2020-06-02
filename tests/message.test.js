const moment = require("moment");
const request = require("supertest");
const app = require("../src/app");
const Check = require("../src/models/check");
const {
  createChecks,
  getAccountsThatAreDue,
  getEmployeesOnAccount,
  updateCheckDocument,
} = require("../src/messages/messages");
const {
  accountOne,
  accountTwo,
  employeeOne,
  employeeTwo,
  employeeThree,
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

test("Should get active employees from account but not if messages sent today", async () => {
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

test("Should get active employees on accounts", async () => {
  const employeesTest1 = await getEmployeesOnAccount([
    accountOne._id,
    accountTwo._id,
  ]);
  expect(employeesTest1).toHaveLength(3);
  const ids = employeesTest1.map((p) => p._id);
  expect([employeeOne, employeeTwo, employeeThree].map((p) => p._id).sort()).toEqual(
    ids.sort()
  );

  const employeesTest2 = await getEmployeesOnAccount([accountTwo._id]);
  expect(employeesTest2).toHaveLength(1);
});

test("Should create checks", async () => {
  const employees = await getEmployeesOnAccount([accountOne._id, accountTwo._id]);
  const checks = await createChecks(employees);
  expect(checks).toHaveLength(3);
  checks.forEach((a) => {
    expect(a).toHaveProperty("accountId");
    expect(a).toHaveProperty("employeeId");
    expect(a).toHaveProperty("phoneNumber");
    expect(a).toHaveProperty("messageSent");
  });
});

test("Should update check document if one exists for today", async () => {
  // set up test with new check document for today
  await new Check({
    employeeId: employeeThree._id,
    accountId: employeeThree.accountId,
    messageSent: new Date(),
    phoneNumber: "1234561234",
  }).save();

  const today = moment(Date.now()).startOf("day").format();
  const updatedCheck = await updateCheckDocument(
    "yes",
    "1234561234"
  );
  expect(updatedCheck.passCheck).toBe(false);
  expect(
    moment(updatedCheck.replyReceived).startOf("day").format()
  ).toEqual(today);

  const updatedCheck2 = await updateCheckDocument(
    "no",
    "1234561234"
  );
  expect(updatedCheck2.passCheck).toBe(true);
});

test("Should not update check document if none exists for today", async () => {
  // set up test with new check document with past date
  await new Check({
    employeeId: employeeThree._id,
    accountId: employeeThree.accountId,
    messageSent: moment(new Date()).subtract(1, "month"),
    phoneNumber: "1234561234",
  }).save();

  const updatedCheck = await updateCheckDocument(
    "yes",
    "1234561234"
  );
  expect(updatedCheck).toBe(null);
});
