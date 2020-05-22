const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Account = require("../../src/models/account");
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

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
    name: 'Mike',
    email: 'mike@example.com',
    password: '56what!!',
    tokens: [{
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }],
    accountId: accountOne._id
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
    _id: userTwoId,
    name: 'Jess',
    email: 'jess@example.com',
    password: 'myhouse099@@',
    tokens: [{
        token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET)
    }],
    accountId: accountTwo._id
};

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'First task',
    completed: false,
    owner: userOne._id
};

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Second task',
    completed: true,
    owner: userOne._id
};

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Third task',
    completed: true,
    owner: userTwo._id
};

const setupDatabase = async () => {
    await Account.deleteMany();
    await User.deleteMany();
    await Task.deleteMany();
    await new Account(accountOne).save();
    await new Account(accountTwo).save();
    await new User(userOne).save();
    await new User(userTwo).save();
    await new Task(taskOne).save();
    await new Task(taskTwo).save();
    await new Task(taskThree).save();
}

module.exports = {
    accountOneId,
    accountTwoId,
    userOneId,
    userOne,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
};