const express = require("express");
const Check = require("../models/check");
const auth = require("../middleware/auth");
const { createOrUpdateCheck } = require("../messages/messages");
const router = new express.Router();

router.post("/checks", auth, async (req, res) => {
  try {
    if (!req.body.employeeId || !req.body.messageSent) {
      return res.status(400).send({ error: "employeeId and messageSent are required." });
    }
    const check = await createOrUpdateCheck(req.body, req.user.accountId);
    res.status(201).send(check);

  } catch (e) {
    console.log("e", e);
    res.status(400).send(e);
  }
});

// GET /checks?status=responseReceived
// GET /checks?limit=10&skip=20
// GET /checks?sortBy=createdAt:desc
router.get("/checks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.status) {
    if (req.query.status === "responseReceived") {
      match.responseReceived = { $exists: true };
    } else if (req.query.status === "messageSent") {
      match.responseReceived = { $exists: false };
    }
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "checks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.checks);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/checks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const check = await Check.findOne({ _id, accountId: req.user.accountId });

    if (!check) {
      return res.status(404).send();
    }

    res.send(check);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/checks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["status", "passCheck", "phoneNumber", "messageSent", "responseReceived"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const check = await Check.findOne({
      _id: req.params.id,
      accountId: req.user.accountId,
    });

    if (!check) {
      return res.status(404).send();
    }

    updates.forEach((update) => (check[update] = req.body[update]));
    await check.save();
    res.send(check);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/checks/:id", auth, async (req, res) => {
  try {
    const check = await Check.findOneAndDelete({
      _id: req.params.id,
      accountId: req.user.accountId,
    });

    if (!check) {
      res.status(404).send();
    }

    res.send(check);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
