const express = require('express');
require('./db/mongoose');
const accountRouter = require('./routers/account');
const userRouter = require('./routers/user');
const personRouter = require('./routers/person');

const app = express();

app.use(express.json());
app.use(accountRouter);
app.use(userRouter);
app.use(personRouter);

module.exports = app;