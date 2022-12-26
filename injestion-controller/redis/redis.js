const redis = require("redis");
const { REQUEST_STATUS } = require("../enums/requestStatus");
require("dotenv").config();

let redisPort = parseInt(process.env.REDIS_PORT);
let redisHost = process.env.REDIS_HOST;
const client = redis.createClient({
  socket: {
    port: redisPort,
    host: redisHost,
  },
});

(async () => {
  await client.connect();
})();

console.log("[redis-server]: Attempting to connect to redis.");
client.on("connect", () => {
  console.log("[redis-server]: Connection established.");
});

// Log any error that may occur to the console
client.on("error", (err) => {
  console.log(`[redis-server]: Error:${err}`);
});

// Methods
function registerRequest(key, value) {
  if (!client) {
    return;
  }
  client.set(key, value, (error, response) => {
    console.log("[redis-server]: ", response);
    return response;
  });
}

function getRequestCount(userId) {
  return client.get(userId);
}

function setRequestCount(userId, count) {
  return client.set(userId, count);
}

function getRequest(key) {
  if (!client) {
    return;
  }
  return client.get(key);
}

function requestResolved(key) {
  return new Promise(function (resolve, reject) {
    client.get(key, function (error, response) {
      if (error) {
        reject(error);
      }
      if (response === REQUEST_STATUS.RESPONDED) {
        resolve(response);
      }
    });
  });
}

// Close the connection when there is an interrupt sent from keyboard
process.on("SIGINT", () => {
  client.quit();
  console.log("[redis-server]: redis client quit");
});

module.exports = {
  client,
  RedisHelpers: {
    registerRequest,
    getRequest,
    requestResolved,
    getRequestCount,
    setRequestCount
  },
};
