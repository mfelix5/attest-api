const express = require("express");
const Attestation = require("../models/attestation");
const auth = require("../middleware/auth");
const { createOrUpdateAttestation } = require("../messages/messages");
const router = new express.Router();

router.post("/attestations", auth, async (req, res) => {
  try {
    if (!req.body.personId || !req.body.messageSent) {
      return res.status(400).send({ error: "personId and messageSent are required." });
    }
    const attestation = await createOrUpdateAttestation(req.body, req.user.accountId);
    res.status(201).send(attestation);

  } catch (e) {
    console.log("e", e);
    res.status(400).send(e);
  }
});

// GET /attestations?status=responseReceived
// GET /attestations?limit=10&skip=20
// GET /attestations?sortBy=createdAt:desc
router.get("/attestations", auth, async (req, res) => {
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
        path: "attestations",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.attestations);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/attestations/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const attestation = await Attestation.findOne({ _id, accountId: req.user.accountId });

    if (!attestation) {
      return res.status(404).send();
    }

    res.send(attestation);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/attestations/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["status", "passCheck", "phoneNumber", "messageSent", "responseReceived"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const attestation = await Attestation.findOne({
      _id: req.params.id,
      accountId: req.user.accountId,
    });

    if (!attestation) {
      return res.status(404).send();
    }

    updates.forEach((update) => (attestation[update] = req.body[update]));
    await attestation.save();
    res.send(attestation);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/attestations/:id", auth, async (req, res) => {
  try {
    const attestation = await Attestation.findOneAndDelete({
      _id: req.params.id,
      accountId: req.user.accountId,
    });

    if (!attestation) {
      res.status(404).send();
    }

    res.send(attestation);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
