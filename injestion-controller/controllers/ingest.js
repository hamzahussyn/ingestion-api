const express = require("express");
const { publishToQueue } = require("../rabbitmq/amqp");
const { RedisHelpers } = require("../redis/redis");
const { randomUUID } = require("crypto");
const { REQUEST_STATUS } = require("../enums/requestStatus");

class IngestController {
  constructor() {
    this.router = express.Router();
    /*
     * Use the POST route to submit a request of data to be ingested.
     * It will queue a job against the request id.
     * Use GET route to know the status of the queued job.
     */
    this.router.post("/", this.ingest);
    this.router.get("/:requestid", this.getJobStatus);
  }

  _getRequestCount = async (userId) => {
    let existingCount = await RedisHelpers.getRequestCount(userId);
    if (!existingCount) {
      // First time user requesting
      existingCount = 0;
      await RedisHelpers.setRequestCount(userId, 1);
    } else if (parseInt(existingCount) === 7) {
      await RedisHelpers.setRequestCount(userId, 0);
      existingCount = 7;
    } else {
      await RedisHelpers.setRequestCount(userId, parseInt(existingCount) + 1);
    }

    return parseInt(existingCount);
  };

  _isImmediateRequest = async (userId) => {
    const existingCount = await this._getRequestCount(userId);
    // if the current request is more than fourth
    if (existingCount >= 4) {
      return false;
    } else {
      return true;
    }
  };

  routes() {
    return this.router;
  }

  getJobStatus = async (req, res, next) => {
    try {
      const requestId = req.params.requestid;
      const jobStatus = await RedisHelpers.getRequest(requestId);
      res.status(200).json({ status: jobStatus });
    } catch (error) {
      res.status(500).json({ error: error });
      next();
    }
  };

  ingest = async (req, res, next) => {
    try {
      console.log("request recieved.");
      console.log("body-> ", req.body);
      console.log("ip: -> ", req.ip);

      // Handling case for client mis-firing requests.
      const isRequestQueued = await RedisHelpers.getRequest(req.body.requestId);
      if (isRequestQueued) {
        res
          .status(200)
          .json({ message: "job submitted successfully.", success: true });
      }

      RedisHelpers.registerRequest(req.body.requestId, REQUEST_STATUS.OPEN);

      let publisher = null;
      const immediateRequest = await this._isImmediateRequest(req.body.user.id);
      if (immediateRequest) {
        publisher = publishToQueue("immediate-queue", JSON.stringify(req.body));
      } else {
        publisher = publishToQueue("delayed-queue", JSON.stringify(req.body));
      }

      res
        .status(200)
        .json({ message: "ingested data successfully.", success: true });
    } catch (error) {
      res.status(500).json({
        message: "failed to submit job request.",
        success: true,
        debug: error,
      });
      next();
    }
  };
}

module.exports = {
  IngestController,
};
