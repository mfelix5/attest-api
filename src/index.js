const app = require("./app");
const port = process.env.PORT;
const scheduler = require("./messages/scheduler");

scheduler.start();
app.listen(port, () => {
  console.log("Server is up on port " + port);
});
