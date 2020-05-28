const request = require("supertest");
const app = require("../src/app");
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
      status: "sent",
      personId: personOne._id,
      phoneNumber: "1234567890",
      message: {
        text: "Hi there",
        date: Date.now()
      },
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
  const response = await request(app)
    .get("/attestations?status=sent")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const sentAttestations = response.body;
  expect(sentAttestations).toHaveLength(2);
  expect(sentAttestations.every((attestation) => attestation.status === "sent")).toBe(true);

  //TODO: Add seed data and test for status received

});

test("Should limit and paginate attestations", async () => {
  const response1 = await request(app)
    .get("/attestations?limit=0")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response1.body).toHaveLength(2);

  const response2 = await request(app)
    .get("/attestations?limit=1")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response2.body).toHaveLength(1);

  const attestation = response2.body[0];
  expect(attestation._id).toEqual(attestationThree._id.toString());

  const response3 = await request(app)
    .get("/attestations?limit=1&skip=1")
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
  await request(app)
    .patch(`/attestations/${attestationTwo._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      healthy: true,
      status: "received"
    })
    .expect(200);
  const attestation = await Attestation.findById(attestationTwo._id);
  expect(attestation.status).toEqual("received");
  expect(attestation.healthy).toEqual(true);
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
