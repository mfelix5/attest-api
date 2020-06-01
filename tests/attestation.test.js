const request = require("supertest");
const app = require("../src/app");
const moment = require("moment");
const Attestation = require("../src/models/attestation");
const {
  attestationOne,
  attestationTwo,
  attestationThree,
  attestationFour,
  personOne,
  personTwo,
  personThree,
  personFour,
  userOne,
  userTwo,
  setupDatabase,
} = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should create an attestation with the user's accountId", async () => {
  const response = await request(app)
    .post("/attestations")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      personId: personOne._id,
      phoneNumber: "1234567890",
      messageSent: new Date(),
    })
    .expect(201);

  const attestation = await Attestation.findById(response.body._id);
  expect(attestation).not.toBeNull();
  expect(attestation.accountId).toEqual(userOne.accountId);
});

test("Should only fetch attestations that belong to a user's account", async () => {
  const response = await request(app)
    .get("/attestations")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(2);
  expect(
    response.body.every(
      (attestation) => attestation.accountId === userOne.accountId.toString()
    )
  ).toBe(true);
});

test("Should filter attestations by status", async () => {
  // set up test with attestation that has received response
  const newAttestation = await new Attestation({
    personId: personOne._id,
    accountId: personOne.accountId,
    phoneNumber: personOne.primaryPhone,
    messageSent: new Date(),
    responseReceived: new Date()
  }).save();

  const response1 = await request(app)
    .get("/attestations?status=messageSent")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const sentAttestations = response1.body;
  expect(sentAttestations).toHaveLength(2);

  const response2 = await request(app)
    .get("/attestations?status=responseReceived")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const receivedAttestations = response2.body;
  expect(receivedAttestations).toHaveLength(1);
});

test("Should limit and paginate attestations", async () => {
  const response1 = await request(app)
    .get("/attestations?limit=0")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response1.body).toHaveLength(2);

  const response2 = await request(app)
    .get("/attestations?limit=1&sortBy=personId:asc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response2.body).toHaveLength(1);

  const attestation = response2.body[0];
  expect(attestation._id).toEqual(attestationThree._id.toString());

  const response3 = await request(app)
    .get("/attestations?limit=1&skip=1&sortBy=personId:asc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response3.body).toHaveLength(1);
  const returnedAttestation = response3.body[0];
  expect(returnedAttestation._id).toEqual(attestationFour._id.toString());
});

// xtest("Should sort attestations", async () => {
//   const response1 = await request(app)
//     .get("/attestations?sortBy=createdAt:asc")
//     .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
//     .send()
//     .expect(200);
// });

test("Should not delete attestations from other accounts", async () => {
  await request(app)
    .delete(`/attestations/${attestationOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const attestation = await Attestation.findById(attestationOne._id);
  expect(attestation).not.toBeNull();
});

test("Should update valid attestation fields", async () => {
  const now = Date.now()
  await request(app)
    .patch(`/attestations/${attestationTwo._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      passCheck: true,
      responseReceived: now
    })
    .expect(200);
  const attestation = await Attestation.findById(attestationTwo._id);
  expect(moment(attestation.responseReceived).format()).toEqual(moment(now).format());
  expect(attestation.passCheck).toEqual(true);
});

test("Should not update invalid attestation fields", async () => {
  await request(app)
  .patch(`/attestations/${attestationOne._id}`)
  .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
  .send({
    badProperty: "Test",
  })
  .expect(400);
});

test("Should not create more than one attestation for a person on one day", async () => {
  const today = moment().startOf("day");
  const thisMorning = today.add(1, "hour");
  const firstResponse = await request(app)
    .post("/attestations")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send({
      personId: userTwo._id,
      phoneNumber: "1234567890",
      messageSent: today,
    })
    .expect(201);

  const attestation = await Attestation.findById(firstResponse.body._id);
  expect(attestation).not.toBeNull();

  await request(app)
    .post("/attestations")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send({
      personId: userTwo._id,
      phoneNumber: "1234567891",
      messageSent: thisMorning,
      passCheck: false
    })
    .expect(201);

  const found = await Attestation.find({
    personId: userTwo._id,
    createdAt: { $gte: today },
    messageSent: { $gte: today },
  });

  expect(found).toHaveLength(1);
  expect(found[0]._id.toString()).toEqual(firstResponse.body._id);
  expect(found[0].phoneNumber).toEqual("1234567891");
  expect(found[0].passCheck).toEqual(false);
  expect(moment(found[0].messageSent).format()).toEqual(thisMorning.format());
});
