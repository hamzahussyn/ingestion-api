const express = require("express");
const { publishToQueue } = require("../amqp");

class InjestController {
  constructor() {
    this.router = express.Router();
    this.router.post('/', this.injest);
  }

  routes() {
    return this.router;
  }

  injest(req, res, next) {
    try{
      publishToQueue("main-queue", "hamza");
      res.status(200).json({message: "injested data.", success: true});
    } catch(error) {
      console.log(error);
    }
  }
}

module.exports = {
  InjestController
}