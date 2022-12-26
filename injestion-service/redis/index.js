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

function getRequest(key) {
  if (!client) {
    return;
  }
  client.get(key, (error, response) => {
    return response;
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
  },
};
