const express = require("express");
require("./db/mongoose");
const accountRouter = require("./routers/account");
const attestationRouter = require("./routers/attestation");
const personRouter = require("./routers/person");
const userRouter = require("./routers/user");

const app = express();

app.use(express.json());
app.use(accountRouter);
app.use(attestationRouter);
app.use(personRouter);
app.use(userRouter);

module.exports = app;