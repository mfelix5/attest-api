const express = require("express");
const Employee = require("../models/employee");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/employees", auth, async (req, res) => {
  const employee = new Employee({
    ...req.body,
    accountId: req.user.accountId,
  });

  try {
    await employee.save();
    res.status(201).send(employee);
  } catch (e) {
    res.status(400).send(e);
  }
});

// GET /employees?active=true
// GET /employees?limit=10&skip=20
// GET /employees?sortBy=createdAt:desc
router.get("/employees", auth, async (req, res) => {
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
        path: "employees",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.employees);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/employees/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const employee = await Employee.findOne({ _id, accountId: req.user.accountId });

    if (!employee) {
      return res.status(404).send();
    }

    res.send(employee);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/employees/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["firstName", "lastName", "otherId", "active", "primaryPhone", "phoneNumbers"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const employee = await Employee.findOne({
      _id: req.params.id,
      accountId: req.user.accountId,
    });

    if (!employee) {
      return res.status(404).send();
    }

    updates.forEach((update) => (employee[update] = req.body[update]));
    await employee.save();
    res.send(employee);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/employees/:id", auth, async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      accountId: req.user.accountId,
    });

    if (!employee) {
      res.status(404).send();
    }

    res.send(employee);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
