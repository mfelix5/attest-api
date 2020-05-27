const request = require('supertest')
const app = require('../src/app')
const Account = require('../src/models/account')
const { accountOne, userOne, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase);

test('Should create a new account', async () => {
  const name = "My Test Company";
  const address = {
    address1: "345 Main St.",
    address2: "#44",
    city: "Texarkana",
    state: "TX",
    zip: "45678"
  }
  const response = await request(app)
    .post("/accounts")
    .send({
      name,
      address
    })
    .expect(201);

  // Assert that the database was changed correctly
  const account = await Account.findOne({ name });
  expect(account).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    account: {
      name,
      address
    }
  });
});

test('Should get appropriate account for authenticated user', async () => {
  const response = await request(app)
    .get("/accounts/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .expect(200);

  // Assertions about the response
  expect(response.body._id).toBe(accountOne._id.toString());
  expect(response.body.name).toBe(accountOne.name);
});

test('Should not get account for unauthenticated user', async () => {
  await request(app).get("/accounts/me").send().expect(401);
});

test('Should delete account', async () => {
  await request(app)
    .delete("/accounts/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const account = await Account.findById(userOne.accountId);
  expect(account).toBeNull();
});

test('Should not delete account for unauthenticated user', async () => {
  await request(app)
    .delete("/accounts/me")
    .send()
    .expect(401);
});

test('Should update valid account fields', async () => {
  const newName = "My new company name";
  const newAddress = {
    address1: "123 Main Street",
    address2: "#2",
    city: "Burlington",
    state: "VT",
    zip: "05401"
  }
  const response = await request(app)
    .patch("/accounts/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: newName,
      address: newAddress
    })
    .expect(200);

  // Assert that the database was changed correctly
  const account = await Account.findById(userOne.accountId);
  expect(account.name).toEqual(newName);
  expect(account.address).toMatchObject(newAddress);

  // Assertions about the response
  expect(response.body).toMatchObject({
    name: newName,
    address: newAddress
  })
});

test('Should not update invalid account fields', async () => {
  await request(app)
    .patch("/accounts/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: "Colorado",
    })
    .expect(400);
});