const request = require("supertest");
const app = require("../src/app");
const Attestation = require("../src/models/attestation");
const {
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

xtest("Should limit and paginate attestations", async () => {
  const response1 = await request(app)
    .get("/persons?limit=0")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response1.body).toHaveLength(2);

  const response2 = await request(app)
    .get("/persons?limit=1")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response2.body).toHaveLength(1);
  const person = response2.body[0];
  expect(person._id).toEqual(personThree._id.toString());

  const response3 = await request(app)
    .get("/persons?limit=1&skip=1")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);
  expect(response3.body).toHaveLength(1);
  const returnedPerson = response3.body[0];
  expect(returnedPerson._id).toEqual(personFour._id.toString());
});

xtest("Should sort attestations", async () => {
  const response1 = await request(app)
    .get("/persons?sortBy=firstName:asc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response1.body).toHaveLength(2);
  const firstNames = response1.body.map(person => person.firstName);
  expect(firstNames).toEqual(["Fourth", "Third"])

  const response2 = await request(app)
    .get("/persons?sortBy=firstName:desc")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response2.body).toHaveLength(2);
  const firstNameArray = response2.body.map(person => person.firstName);
  expect(firstNameArray).toEqual(["Third", "Fourth"])

});

xtest("Should not delete attestations from other accounts", async () => {
  await request(app)
    .delete(`/persons/${personOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const person = await Person.findById(personOne._id);
  expect(person).not.toBeNull();
});

xtest("Should update valid attestation fields", async () => {
  await request(app)
    .patch(`/persons/${personTwo._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      firstName: "Jess",
      active: false
    })
    .expect(200);
  const person = await Person.findById(personTwo._id);
  expect(person.firstName).toEqual("Jess");
  expect(person.active).toEqual(false);
});

xtest("Should not update invalid attestation fields", async () => {
  await request(app)
  .patch(`/persons/${personThree._id}`)
  .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
  .send({
    badProperty: "Test",
  })
  .expect(400);
});
