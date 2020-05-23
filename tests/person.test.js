const request = require("supertest");
const app = require("../src/app");
const Person = require("../src/models/person");
const {
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  personOne,
  personTwo,
  personThree,
  setupDatabase,
} = require("./fixtures/db");

beforeEach(setupDatabase);

test("Should create person of concern with the user's accountId", async () => {
  const response = await request(app)
    .post("/persons")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      firstName: "Test",
      lastName: "User",
      phoneNumbers: [
        {
          number: "1234567890",
          isOwnPhone: true,
        },
      ],
    })
    .expect(201);
  const person = await Person.findById(response.body._id);
  expect(person).not.toBeNull();
  expect(person.accountId).toEqual(userOne.accountId);
});

test("Should only fetch persons of concern that belong to a user's account", async () => {
  const response = await request(app)
    .get("/persons")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(2);
  expect(
    response.body.every(
      (person) => person.accountId === userOne.accountId.toString()
    )
  ).toBe(true);
});

xtest("Should filter persons that are active or inactive", async () => {
  // GET /persons?active=true
});

xtest("Should limit and paginate persons that are fetched", async () => {
  // GET /persons?limit=10&skip=20
  // GET /persons?sortBy=createdAt:desc
});

test("Should not delete persons of concern from other accounts", async () => {
  await request(app)
    .delete(`/persons/${personOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const person = await Person.findById(personOne._id);
  expect(person).not.toBeNull();
});

xtest("Should update valid person fields", async () => {});

xtest("Should not update invalid person fields", async () => {});
