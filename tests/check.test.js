const request = require("supertest");
const app = require("../src/app");
const moment = require("moment");
const Check = require("../src/models/check");
const {
  checkOne,
  checkTwo,
  checkThree,
  checkFour,
  employeeOne,
  userOne,
  userTwo,
  setupDatabase,
} = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should create an check with the user's accountId", async () => {
  const response = await request(app)
    .post("/checks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      employeeId: employeeOne._id,
      phoneNumber: "1234567890",
      messageSent: new Date(),
    })
    .expect(201);

  const check = await Check.findById(response.body._id);
  expect(check).not.toBeNull();
  expect(check.accountId).toEqual(userOne.accountId);
});

test("Should only fetch checks that belong to a user's account", async () => {
  const response = await request(app)
    .get("/checks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(2);
  expect(
    response.body.every(
      (check) => check.accountId === userOne.accountId.toString()
    )
  ).toBe(true);
});

test("Should filter checks by status", async () => {
  // set up test with check that has received response
  const newCheck = await new Check({
    employeeId: employeeOne._id,
    accountId: employeeOne.accountId,
    phoneNumber: employeeOne.primaryPhone,
    messageSent: new Date(),
    responseReceived: new Date()
  }).save();

  const response1 = await request(app)
    .get("/checks?status=messageSent")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const sentChecks = response1.body;
  expect(sentChecks).toHaveLength(2);

  const response2 = await request(app)
    .get("/checks?status=responseReceived")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const receivedChecks = response2.body;
  expect(receivedChecks).toHaveLength(1);
});

test("Should limit and paginate checks", async () => {
  const response1 = await request(app)
    .get("/checks?limit=0")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response1.body).toHaveLength(2);

  const response2 = await request(app)
    .get("/checks?limit=1&sortBy=employeeId:asc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response2.body).toHaveLength(1);

  const check = response2.body[0];
  expect(check._id).toEqual(checkThree._id.toString());

  const response3 = await request(app)
    .get("/checks?limit=1&skip=1&sortBy=employeeId:asc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response3.body).toHaveLength(1);
  const returnedCheck = response3.body[0];
  expect(returnedCheck._id).toEqual(checkFour._id.toString());
});

// xtest("Should sort checks", async () => {
//   const response1 = await request(app)
//     .get("/checks?sortBy=createdAt:asc")
//     .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
//     .send()
//     .expect(200);
// });

test("Should not delete checks from other accounts", async () => {
  await request(app)
    .delete(`/checks/${checkOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const check = await Check.findById(checkOne._id);
  expect(check).not.toBeNull();
});

test("Should update valid check fields", async () => {
  const now = Date.now()
  await request(app)
    .patch(`/checks/${checkTwo._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      passCheck: true,
      responseReceived: now
    })
    .expect(200);
  const check = await Check.findById(checkTwo._id);
  expect(moment(check.responseReceived).format()).toEqual(moment(now).format());
  expect(check.passCheck).toEqual(true);
});

test("Should not update invalid check fields", async () => {
  await request(app)
  .patch(`/checks/${checkOne._id}`)
  .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
  .send({
    badProperty: "Test",
  })
  .expect(400);
});

test("Should not create more than one check for an employee on one day", async () => {
  const today = moment().startOf("day");
  const thisMorning = today.add(1, "hour");
  const firstResponse = await request(app)
    .post("/checks")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send({
      employeeId: userTwo._id,
      phoneNumber: "1234567890",
      messageSent: today,
    })
    .expect(201);

  const check = await Check.findById(firstResponse.body._id);
  expect(check).not.toBeNull();

  await request(app)
    .post("/checks")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send({
      employeeId: userTwo._id,
      phoneNumber: "1234567891",
      messageSent: thisMorning,
      passCheck: false
    })
    .expect(201);

  const found = await Check.find({
    employeeId: userTwo._id,
    createdAt: { $gte: today },
    messageSent: { $gte: today },
  });

  expect(found).toHaveLength(1);
  expect(found[0]._id.toString()).toEqual(firstResponse.body._id);
  expect(found[0].phoneNumber).toEqual("1234567891");
  expect(found[0].passCheck).toEqual(false);
  expect(moment(found[0].messageSent).format()).toEqual(thisMorning.format());
});
