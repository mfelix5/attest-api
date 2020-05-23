const express = require("express");
const Account = require("../models/account");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/accounts", async (req, res) => {
  const account = new Account(req.body);

  try {
    await account.save();
    // sendWelcomeEmail(user.email, user.name)
    res.status(201).send({ account });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/accounts/me", auth, async (req, res) => {
  const account = await Account.findOne({ _id: req.user.accountId })
  res.send(account);
});

router.patch("/accounts/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "creditCard", "address"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const account = await Account.findById(req.user.accountId);
    updates.forEach((update) => (account[update] = req.body[update]));
    await account.save();
    res.send(account);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/accounts/me", auth, async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.user.accountId })
    await account.remove();
    // sendCancelationEmail(req.user.email, req.user.name);
    res.send(account);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;