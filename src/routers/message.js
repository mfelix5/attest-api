const express = require("express");
const router = new express.Router();
const _ = require("lodash");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const { notifyAdmins, updateAttestationDocument } = require("../messages/messages");
const {
  appResponseToYes,
  appResponseToNo,
  appResponseToBadText,
  appResponseToUnexpectedMessage
} = require("../messages/constants");

router.post(
  "/reply",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    let appReply = appResponseToUnexpectedMessage;
    const message = _.get(req, "body.Body");
    const phone = _.get(req, "body.From");

    if (message && phone) {
      if (message.toLowerCase() === "yes") {
        const updated = await updateAttestationDocument("yes", phone);
        if (updated) {
          appReply = appResponseToYes;
          notifyAdmins(phone);
        }
      } else if (message.toLowerCase() === "no") {
        const updated = await updateAttestationDocument("no", phone);
        if (updated) appReply = appResponseToNo;
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
