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
      primaryPhone: "2342341234",
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

test("Should filter persons that are active or inactive", async () => {
  const allPersons = await Person.find({});
  console.log('allPersons', allPersons)
  const response = await request(app)
    .get("/persons?active=true")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const activePersons = response.body;
  expect(activePersons).toHaveLength(2);

  const response2 = await request(app)
    .get("/persons?active=false")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const inactivePersons = response2.body;
  expect(inactivePersons).toHaveLength(0);

  const response3 = await request(app)
    .get("/persons?active=")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);

  const activePersonsAccount2 = response3.body;
  console.log('activePersonsAccount2', activePersonsAccount2)
  expect(activePersonsAccount2).toHaveLength(1);
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
