const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Account = require("../../src/models/account");
const Attestation = require("../../src/models/attestation");
const User = require("../../src/models/user");
const Person = require("../../src/models/person");

const accountOneId = new mongoose.Types.ObjectId();
const accountOne = {
  _id: accountOneId,
  name: "First Account, LLC",
  active: true,
  config: {
    messagesToPersons: {
      dailySendTime: (new Date()).getUTCHours()
    }
  }
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
  accountId: userTwo.accountId,
  primaryPhone: "1234567890",
  phoneNumbers: [{
    number: "2131231234",
    isOwnPhone: true
  }]
};

const personFour = {
  _id: new mongoose.Types.ObjectId(),
  active: false,
  firstName: "Fourth",
  lastName: "Person",
  accountId: userTwo.accountId,
  primaryPhone: "1234567890",
  phoneNumbers: [{
    number: "1531231234",
    isOwnPhone: true
  }]
};

const attestationOne = {
  _id: new mongoose.Types.ObjectId(),
  status: "sent",
  personId: personOne._id,
  accountId: personOne.accountId,
  phoneNumber: personOne.primaryPhone,
  message: {
    text: "Hi there",
    date: Date.now()
  }
};

const attestationTwo = {
  _id: new mongoose.Types.ObjectId(),
  status: "sent",
  personId: personTwo._id,
  accountId: personTwo.accountId,
  phoneNumber: personTwo.primaryPhone,
  message: {
    text: "Hi there",
    date: Date.now()
  }
};

const attestationThree = {
  _id: new mongoose.Types.ObjectId(),
  status: "sent",
  personId: personThree._id,
  accountId: personThree.accountId,
  phoneNumber: personThree.primaryPhone,
  message: {
    text: "Hi there",
    date: Date.now()
  }
};

const attestationFour = {
  _id: new mongoose.Types.ObjectId(),
  status: "sent",
  personId: personFour._id,
  accountId: personFour.accountId,
  phoneNumber: personFour.primaryPhone,
  message: {
    text: "Hi there",
    date: Date.now()
  }
};

const setupDatabase = async () => {
  try {
    await Promise.all([
      Account.deleteMany(),
      User.deleteMany(),
      Person.deleteMany(),
      Attestation.deleteMany()
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
      new Person(personFour).save()
    ]);

    await Promise.all([
      new Attestation(attestationOne).save(),
      new Attestation(attestationTwo).save(),
      new Attestation(attestationThree).save(),
      new Attestation(attestationFour).save(),
    ]);
  } catch (e) {
    console.log("Error in setupDatabase():", e);
  }
};

module.exports = {
  accountOneId,
  accountOne,
  accountTwoId,
  accountTwo,
  attestationOne,
  attestationTwo,
  attestationThree,
  attestationFour,
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  personOne,
  personTwo,
  personThree,
  personFour,
  setupDatabase,
};
