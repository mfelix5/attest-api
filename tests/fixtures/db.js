const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Account = require("../../src/models/account");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");

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

const taskOne = {
  _id: new mongoose.Types.ObjectId(),
  description: "First task",
  completed: false,
  owner: userOne._id,
};

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: "Second task",
  completed: true,
  owner: userOne._id,
};

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: "Third task",
  completed: true,
  owner: userTwo._id,
};

const setupDatabase = async () => {
  await Promise.all([
    Account.deleteMany(),
    User.deleteMany(),
    Task.deleteMany(),
  ]);

  await Promise.all([
    new Account(accountOne).save(),
    new Account(accountTwo).save(),
  ]);

  await Promise.all([new User(userOne).save(), new User(userTwo).save()]);

  await Promise.all([
    new Task(taskOne).save(),
    new Task(taskTwo).save(),
    new Task(taskThree).save(),
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
  taskOne,
  taskTwo,
  taskThree,
  setupDatabase,
};
