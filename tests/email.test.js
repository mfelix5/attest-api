const app = require("../src/app");
const Check = require("../src/models/check");
const Employee = require("../src/models/employee");
const { createSummaryEmail, getTodaysChecks } = require("../src/emails/summary");
const { accountOne, healthyCheck, healthyEmployee, setupDatabaseWithAccountsUsersEmployees, setupDatabaseWithChecks, unhealthyCheck, unhealthyEmployee } = require("./fixtures/db");

beforeEach(async () => {
  await setupDatabaseWithAccountsUsersEmployees();
  await setupDatabaseWithChecks();
});

test("Should get todays checks from account, grouped by pass/fail/notResponded", async () => {
  const checks = await getTodaysChecks(accountOne._id);
  expect(checks.pass).toHaveLength(1);
  expect(checks.fail).toHaveLength(1);
  expect(checks.notResponded).toHaveLength(2);
});

test("Should create email", async () => {
  const email = await createSummaryEmail(accountOne._id);
  // console.log('email', email);
});