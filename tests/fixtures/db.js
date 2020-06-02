const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Account = require("../../src/models/account");
const Check = require("../../src/models/check");
const User = require("../../src/models/user");
const Employee = require("../../src/models/employee");

const accountOneId = new mongoose.Types.ObjectId();
const accountOne = {
  _id: accountOneId,
  name: "First Account, LLC",
  active: true,
  config: {
    messagesToEmployees: {
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
  phoneNumber: "8455551212"
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
  phoneNumber: "8025551212"
};

const employeeOne = {
  _id: new mongoose.Types.ObjectId(),
  firstName: "First",
  lastName: "Employee",
  otherId: "123ABC",
  accountId: userOne.accountId,
  primaryPhone: "1234567890",
};

const employeeTwo = {
  _id: new mongoose.Types.ObjectId(),
  firstName: "Second",
  lastName: "Employee",
  accountId: userOne.accountId,
  primaryPhone: "1234567899",
};

const employeeThree = {
  _id: new mongoose.Types.ObjectId(),
  firstName: "Third",
  lastName: "Employee",
  accountId: userTwo.accountId,
  primaryPhone: "1234567890",
};

const employeeFour = {
  _id: new mongoose.Types.ObjectId(),
  active: false,
  firstName: "Fourth",
  lastName: "Employee",
  accountId: userTwo.accountId,
  primaryPhone: "1234567890",
};

const checkOne = {
  _id: new mongoose.Types.ObjectId(),
  employeeId: employeeOne._id,
  accountId: employeeOne.accountId,
  phoneNumber: employeeOne.primaryPhone,
  messageSent: new Date()
};

const checkTwo = {
  _id: new mongoose.Types.ObjectId(),
  employeeId: employeeTwo._id,
  accountId: employeeTwo.accountId,
  phoneNumber: employeeTwo.primaryPhone,
  messageSent: new Date()
};

const checkThree = {
  _id: new mongoose.Types.ObjectId(),
  employeeId: employeeThree._id,
  accountId: employeeThree.accountId,
  phoneNumber: employeeThree.primaryPhone,
  messageSent: new Date()
};

const checkFour = {
  _id: new mongoose.Types.ObjectId(),
  employeeId: employeeFour._id,
  accountId: employeeFour.accountId,
  phoneNumber: employeeFour.primaryPhone,
  messageSent: new Date()
};

const setupDatabase = async () => {
  try {
    await Promise.all([
      Account.deleteMany(),
      User.deleteMany(),
      Employee.deleteMany(),
      Check.deleteMany()
    ]);

    await Promise.all([
      new Account(accountOne).save(),
      new Account(accountTwo).save(),
    ]);

    await Promise.all([new User(userOne).save(), new User(userTwo).save()]);

    await Promise.all([
      new Employee(employeeOne).save(),
      new Employee(employeeTwo).save(),
      new Employee(employeeThree).save(),
      new Employee(employeeFour).save()
    ]);

    await Promise.all([
      new Check(checkOne).save(),
      new Check(checkTwo).save(),
      new Check(checkThree).save(),
      new Check(checkFour).save(),
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
  checkOne,
  checkTwo,
  checkThree,
  checkFour,
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  employeeOne,
  employeeTwo,
  employeeThree,
  employeeFour,
  setupDatabase,
};
