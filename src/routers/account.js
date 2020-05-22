const express = require('express');
const Account = require('../models/account');
const auth = require('../middleware/auth');
const router = new express.Router();

router.post('/accounts', async (req, res) => {
    const account = new Account(req.body);

    try {
        await account.save();
        // sendWelcomeEmail(user.email, user.name)
        res.status(201).send({ account });
    } catch (e) {
        res.status(400).send(e);
    }
});

router.get('/accounts/me', auth, async (req, res) => {
    res.send(req.account);
});

router.patch('/accounts/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'creditCard', 'address'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach((update) => req.account[update] = req.account[update]);
        await req.account.save();
        res.send(req.account);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/accounts/me', auth, async (req, res) => {
    try {
        await req.account.remove();
        // sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.account);
    } catch (e) {
        res.status(500).send();
    }
})

module.exports = router;