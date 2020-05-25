const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Account = require("../../src/models/account");
const User = require("../../src/models/user");
const Person = require("../../src/models/person");

const accountOneId = new mongoose.Types.ObjectId();
const accountOne = {
  _id: accountOneId,
  name: "First Account, LLC",
};

const accountTwoId = new mongoose.Types.ObjectId();
const accountTwo = {
  _id: accountTwoId,
  name: "Second Account, LLC",
};

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: "Mike",
  email: "mike@example.com",
  password: "56what!!",
  tokens: [
    {
      token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET),
    },
  ],
  accountId: accountOne._id,
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
  _id: userTwoId,
  name: "Jess",
  email: "jess@example.com",
  password: "myhouse099@@",
  tokens: [
    {
      token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET),
    },
  ],
  accountId: accountTwo._id,
};

const personOne = {
  _id: new mongoose.Types.ObjectId(),
  firstName: "First",
  lastName: "Person",
  completed: false,
  otherId: "123ABC",
  accountId: userOne.accountId,
  primaryPhone: "1234567890",
  phoneNumbers: [{
    number: "1231231234",
    isOwnPhone: true
  }]
};

const personTwo = {
  _id: new mongoose.Types.ObjectId(),
  firstName: "Second",
  lastName: "Person",
  completed: true,
  accountId: userOne.accountId,
  primaryPhone: "1234567899",
  phoneNumbers: [
  {
    number: "1231231234",
    isOwnPhone: false,
    owner: "My Mother",
    ownerRelationship: "parent"
  },
  {
    number: "1231231245",
    isOwnPhone: false,
    owner: "My Father",
    ownerRelationship: "parent"
  },
]
};

const personThree = {
  _id: new mongoose.Types.ObjectId(),
  firstName: "Third",
  lastName: "Person",
  completed: true,
  accountId: userTwo.accountId,
  primaryPhone: "1234567890",
  phoneNumbers: [{
    number: "2131231234",
    isOwnPhone: true
  }]
};

const setupDatabase = async () => {
  await Promise.all([
    Account.deleteMany(),
    User.deleteMany(),
    Person.deleteMany(),
  ]);

  await Promise.all([
    new Account(accountOne).save(),
    new Account(accountTwo).save(),
  ]);

  await Promise.all([new User(userOne).save(), new User(userTwo).save()]);

  await Promise.all([
    new Person(personOne).save(),
    new Person(personTwo).save(),
    new Person(personThree).save(),
  ]);
};

module.exports = {
  accountOneId,
  accountOne,
  accountTwoId,
  accountTwo,
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  personOne,
  personTwo,
  personThree,
  setupDatabase,
};
