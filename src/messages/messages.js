const moment = require("moment");
const twilio = require("twilio");
const Account = require("../models/account");
const Check = require("../models/check");
const Employee = require("../models/employee");
const User = require("../models/user");
const {
  appNotificationToAdmin,
  wellnessCheck,
} = require("../messages/constants");

let twilioClient;

if (process.env.NODE_ENV === "prod") {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

/**
 * Sends an SMS to the specified phone number in an check
 */
const sendMessage = async (phoneNumber, message) => {
  const options = {
    to: `+1${phoneNumber}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: message,
  };

  try {
    if (process.env.NODE_ENV === "prod") {
      twilioClient.messages.create(options);
    }
    let masked = phoneNumber.substr(0, phoneNumber.length - 5);
    masked += "*****";
    console.log(`SMS sent to ${masked}`);
  } catch (err) {
    console.error(err);
  }
};

const getAccountsThatAreDue = async (currentTime) => {
  const today = moment(currentTime).startOf("day");
  return await Account.find({
    active: true,
    "config.messagesToEmployees.dailySendTime": currentTime.getUTCHours(),
    $or: [{ lastSent: { $exists: false } }, { lastSent: { $lte: today } }],
  });
};

const getEmployeesOnAccount = async (accountIds) => {
  const employeePromises = accountIds.map((accountId) => {
    return Employee.find({
      accountId,
      active: true,
    });
  });
  return [].concat(...(await Promise.all(employeePromises)));
};

const createOrUpdateCheck = async (data, accountId) => {
  const { employeeId, phoneNumber, messageSent, responseReceived, passCheck } = data;
  const exists = await Check.findOne({
    employeeId,
    messageSent: { $gte: moment(messageSent).startOf("day") },
  });

  if (exists) {
    // update
    return await Check.findOneAndUpdate({
      _id: exists._id
    }, {
      phoneNumber,
      messageSent,
      responseReceived,
      passCheck
    });
  } else {
    //create
    const check = new Check({
      ...data,
      accountId,
    });
    return await check.save();
  }
}

const createChecks = async (employees) => {
  const today = moment().startOf("day");
  const checkPromises = employees.map((employee) => {
    const checkData = {
      employeeId: employee._id,
      phoneNumber: employee.primaryPhone,
      messageSent: new Date()
    }
    return createOrUpdateCheck(checkData, employee.accountId)
  });
  const checks = [].concat(...(await Promise.all(checkPromises)));
  return checks;
};

const sendMessagesToPeopleThatMustAttest = async (currentTime) => {
  try {
    const accounts = await getAccountsThatAreDue(currentTime);
    const employees = await getEmployeesOnAccount(accounts.map((a) => a._id));
    const checks = await createChecks(employees);

    // send SMS
    console.log(`Sending ${checks.length} messages`);
    checks.forEach((check) => {
      sendMessage(check.phoneNumber, wellnessCheck);
    });

    // update lastSent on each account
    const accountsToUpdate = [...new Set(employees.map((p) => p.accountId))];
    const accountUpdatePromises = accountsToUpdate.map((accountId) => {
      return Account.findOneAndUpdate(
        { _id: accountId },
        { "config.messagesToEmployees.lastSent": moment() }
      );
    });
    await Promise.all(accountUpdatePromises);
  } catch (e) {
    console.log(`Error from sendMessagesToPeopleThatMustAttest: ${e}`);
  }
};

const updateCheckDocument = async (reply, phoneNumber) => {
  const today = moment().startOf("day");

  let number = phoneNumber.slice();
  if (phoneNumber.startsWith("+1")) number = phoneNumber.slice(2);

  const updated = await Check.findOneAndUpdate(
    {
      messageSent: { $gte: today },
      phoneNumber: number,
    },
    {
      passCheck: reply === "no",
      responseReceived: new Date(),
    },
    { new: true }
  );
  return updated;
};

const notifyAdmins = async (phoneNumber) => {
  let number = phoneNumber.slice();
  if (phoneNumber.startsWith("+1")) number = phoneNumber.slice(2);

  const employee = await Employee.findOne({ primaryPhone: number });
  const relatedAdmins = await User.find({
    accountId: employee.accountId,
    isAdmin: true,
  });
  const message = `${employee.firstName} ${employee.lastName} ${appNotificationToAdmin}`;
  relatedAdmins.forEach((admin) => {
    sendMessage(admin.phoneNumber, message);
  });
};

module.exports = {
  createChecks,
  createOrUpdateCheck,
  getAccountsThatAreDue,
  getEmployeesOnAccount,
  notifyAdmins,
  sendMessagesToPeopleThatMustAttest,
  updateCheckDocument,
};
