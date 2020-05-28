const express = require("express");
const router = new express.Router();
const _ = require("lodash");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const { updateAttestationDocument } = require("../messages/messages");
const {
  appResponseToYes,
  appResponseToNo,
  appResponseToBadText,
  appUnableToDetermineSender
} = require("../messages/constants");

router.post(
  "/reply",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    let appReply = appUnableToDetermineSender;
    const message = _.get(req, "body.Body");
    const phone = _.get(req, "body.From");

    if (message && phone) {
      if (message.toLowerCase() === "yes") {
        await updateAttestationDocument("yes", phone);
        appReply = appResponseToYes;
      } else if (message.toLowerCase() === "no") {
        await updateAttestationDocument("no", phone);
        // sendAlertToAdmin(phone);
        appReply = appResponseToNo;
      } else {
        appReply = appResponseToBadText;
      }
    }

    const twiml = new MessagingResponse();
    twiml.message(appReply);

    try {
      res.status(200).send(twiml.toString());
    } catch (e) {
      console.log("e", e);
      res.status(400).send(e);
    }
  }
);

module.exports = router;
