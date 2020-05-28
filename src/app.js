const express = require("express");
require("./db/mongoose");
const accountRouter = require("./routers/account");
const attestationRouter = require("./routers/attestation");
const messageRouter = require("./routers/message");
const personRouter = require("./routers/person");
const userRouter = require("./routers/user");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(accountRouter);
app.use(attestationRouter);
app.use(messageRouter);
app.use(personRouter);
app.use(userRouter);

module.exports = app;