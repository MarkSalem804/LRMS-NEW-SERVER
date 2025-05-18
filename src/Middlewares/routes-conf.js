const express = require("express");
// const ticketRouter = require("../Users/user-routes");
const userRouter = require("../Users/user-routes");

const Routes = (app, prisma) => {
  const router = express.Router();

  router.use("/users", userRouter);

  app.use("/", router);
};

module.exports = Routes;
