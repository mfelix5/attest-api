const CronJob = require("cron").CronJob;
const messages = require("./messages");
const moment = require("moment");

/**
 * Starts cron job that creates and sends messages.
 */
function start() {
  new CronJob(
    "00 * * * * *", // run every minute
    () => {
      const currentTime = new Date();
      console.log('currentTime', currentTime.getUTCHours())
      console.log(
        `Running SMS Worker at ${moment(currentTime).format()}`
      );
      messages.sendMessagesToPeopleThatMustAttest(currentTime);
    },
    null, // don't run anything after finishing the job
    true, // start the timer
    "" // use default timezone
  );
}

module.exports = {
  start,
};
