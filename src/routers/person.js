const express = require("express");
const Person = require("../models/person");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/persons", auth, async (req, res) => {
  const person = new Person({
    ...req.body,
    accountId: req.user.accountId,
  });

  try {
    await person.save();
    res.status(201).send(person);
  } catch (e) {
    res.status(400).send(e);
  }
});

// GET /persons?active=true
// GET /persons?limit=10&skip=20
// GET /persons?sortBy=createdAt:desc
router.get("/persons", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.active) {
    match.active = req.query.active === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "persons",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.persons);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/persons/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const person = await Person.findOne({ _id, accountId: req.user.accountId });

    if (!person) {
      return res.status(404).send();
    }

    res.send(person);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/persons/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["firstName", "lastName", "otherId", "active", "primaryPhone", "phoneNumbers"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const person = await Person.findOne({
      _id: req.params.id,
      accountId: req.user.accountId,
    });

    if (!person) {
      return res.status(404).send();
    }

    updates.forEach((update) => (person[update] = req.body[update]));
    await person.save();
    res.send(person);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/persons/:id", auth, async (req, res) => {
  try {
    const person = await Person.findOneAndDelete({
      _id: req.params.id,
      accountId: req.user.accountId,
    });

    if (!person) {
      res.status(404).send();
    }

    res.send(person);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
