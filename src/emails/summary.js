const sgMail = require('@sendgrid/mail');
const moment = require("moment");
const _ = require("lodash");
const Check = require("../models/check");
const User = require("../models/user");

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const getTodaysChecks = async (accountId) => {
  const today = moment().startOf("day");

  const checks = await Check.find({
    accountId,
    messageSent: { $gte: today }
  }).populate("employeeId");
  
  const groupedChecks = _.groupBy(checks, (check) => {
    return check.passCheck ? "pass" : check.passCheck === false ? "fail" : "notResponded";
  });
  return groupedChecks;
}

const getAdminEmails = async (accountId) => {
  const admins = await User.find({
    accountId,
    isAdmin: true
  });
  return admins.map(a => a.email);
}

const createSummaryEmail = async (accountId) => {
  const [checks, admins] = await Promise.all([
    getTodaysChecks(accountId),
    getAdminEmails(accountId)
  ]);

  const totalChecks = checks.fail.length + checks.pass.length + checks.notResponded.length;
  const failList = checks.fail.map(f => `\n * ${f.employeeId.firstName} ${f.employeeId.lastName} - ${f.phoneNumber}`);
  const notRespondedList = checks.notResponded.map(f => `\n * ${f.employeeId.firstName} ${f.employeeId.lastName} - ${f.phoneNumber}`);

  const text =
  `Hello, today we sent ${totalChecks} COVID-19 wellness checks to your employees. As of ${moment().format('H:mm a')}:
  * ${checks.pass.length} reported feeling well and having no contact with someone confirmed to have or showing symptoms of COVID-19.
  * ${checks.fail.length} reported feeling unwell or recent contact with someone confirmed to have or showing symptoms of COVID-19.
  * ${checks.notResponded.length} ${checks.notResponded.length === 1 ? `has` : `have`} not responsed to their check-in messages.

  People reporting to be unwell or recent contact: ${checks.fail.length === 0 ? `none` : failList},
  People that have not responded: ${checks.notResponded.length === 0 ? `none` : notRespondedList}
  `;

  return {
    to: admins,
    from: 'mikefelix@gmail.com',
    subject: 'WellCheck SMS Daily Summary',
    text
  };
}

const sendSummaryEmail = async (accountId) => {
    const email = await createSummaryEmail(accountId);
    const { to, from, subject, text } = email;
    sgMail.send({ to, from, subject, text });
}

module.exports = {
  createSummaryEmail,
  getAdminEmails,
  getTodaysChecks,
  sendSummaryEmail
}