const express = require("express");
// const ticketRouter = require("../Users/user-routes");
const userRouter = require("../Users/user-routes");
const lrmsRouter = require("../Routes/lrms-routes");
const activityLogRouter = require("../ActivityLogs/activity-log-routes");

const Routes = (app, prisma) => {
  const router = express.Router();

  router.use("/users", userRouter);
  router.use("/lrms", lrmsRouter);
  router.use("/activity-logs", activityLogRouter);

  app.use("/", router);
};

module.exports = Routes;
