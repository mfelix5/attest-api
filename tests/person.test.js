const request = require("supertest");
const app = require("../src/app");
const Person = require("../src/models/person");
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
    .get("/persons?active=true")
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(200);

  const activePersonsAccount2 = response3.body;
  expect(activePersonsAccount2).toHaveLength(1);
});

test("Should limit and paginate persons", async () => {
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

test("Should sort persons", async () => {
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

test("Should not delete persons of concern from other accounts", async () => {
  await request(app)
    .delete(`/persons/${personOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const person = await Person.findById(personOne._id);
  expect(person).not.toBeNull();
});

test("Should update valid person fields", async () => {
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

test("Should not update invalid person fields", async () => {
  await request(app)
  .patch(`/persons/${personThree._id}`)
  .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
  .send({
    badProperty: "Test",
  })
  .expect(400);
});
