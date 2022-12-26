const loadtest = require("loadtest");
const Fakerator = require("fakerator");
const { randomUUID } = require("crypto");

const fakerator = Fakerator();

var requestPerUserCount = 0;
var currentUserId = randomUUID();
var currentUserIP = fakerator.internet.ip();

function getRequestSender() {
  if (requestPerUserCount === 7) {
    requestPerUserCount = 0;
    currentUserId = randomUUID();
    currentUserIP = fakerator.internet.ip();
    return new Object({ id: currentUserId, ip: currentUserIP });
  }

  requestPerUserCount++;
  return new Object({ id: currentUserId, ip: currentUserIP });
}

const options = {
  url: "http://localhost:80/ingest",
  contentType: "application/json",
  maxRequests: 12000,
  method: "POST",
  requestsPerSecond: 4000,
  requestGenerator: (params, options, client, callback) => {
    const requestId = randomUUID();
    const user = getRequestSender();

    const metrics = {
      name: fakerator.names.name(),
      country: fakerator.address.country(),
      city: fakerator.address.city(),
      geoLocation: fakerator.address.geoLocation(),
      ip: fakerator.internet.ip(),
      mac: fakerator.internet.mac(),
    };

    const message = `{
      "user": {
        "id": "${user.id}",
        "ip": "${user.ip}"
      },
      "requestId": "${requestId}", 
      "data": {
        "name": "${metrics.name}",
        "country": "${metrics.country}",
        "city": "${metrics.city}",
        "geoLocation": {
          "latitude": ${metrics.geoLocation.latitude},
          "longitude": ${metrics.geoLocation.longitude}
        },
        "ip": "${metrics.ip}",
        "mac": "${metrics.mac}"
      }
    }`;

    options.headers["Content-Type"] = "application/json";
    options.method = "POST";
    options.ip = fakerator.internet.ip();

    const request = client(options, callback);
    request.write(message);

    return request;
  },
};

loadtest.loadTest(options, function (error, result) {
  if (error) {
    return console.log(`Errored out: ${error}`);
  }

  console.log("exiting load testing script with 1.");
  console.log(result);
});
