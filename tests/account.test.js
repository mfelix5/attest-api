const request = require('supertest')
const app = require('../src/app')
const Account = require('../src/models/account')
const { userOneId, userOne, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

xtest('Should create a new account', async () => {
});

xtest('Should get appropriate account for authenticated user', async () => {
});

xtest('Should not get account for unauthenticated user', async () => {
});

xtest('Should delete account', async () => {
});

xtest('Should not delete account for unauthenticate user', async () => {
});

xtest('Should update valid account fields', async () => {
});

xtest('Should not update invalid account fields', async () => {
});