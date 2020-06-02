const express = require("express");
require("./db/mongoose");
const accountRouter = require("./routers/account");
const checkRouter = require("./routers/check");
const messageRouter = require("./routers/message");
const employeeRouter = require("./routers/employee");
const userRouter = require("./routers/user");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(accountRouter);
app.use(checkRouter);
app.use(employeeRouter);
app.use(messageRouter);
app.use(userRouter);

module.exports = app;