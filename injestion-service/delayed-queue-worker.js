const amqp = require("amqplib/callback_api");
const { QUEUES } = require("./enums/queues");
const { REQUEST_STATUS } = require("./enums/requestStatus");
const { RedisHelpers } = require("./redis");
const { mongoose, Schema, model } = require("mongoose");
require("dotenv").config();

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_DB, {}, () =>
  console.log("[mongoose]: connection established to mongoDB.")
);
const CONN_URL = process.env.RABBIT_MQ_URL;

let channel = null;
let totalMessagesRecieved = 0;
const ingestSchema = new Schema({}, { strict: false });
const IngestCollection = model("ingested_data", ingestSchema);

amqp.connect(CONN_URL, function (err, conn) {
  conn.createChannel(function (err, subscriber) {
    channel = subscriber;

    subscriber.consume(
      QUEUES.DELAYED_QUEUE,
      function (msg) {
        totalMessagesRecieved++;
        console.log("..... req no: " + totalMessagesRecieved);
        const payload = JSON.parse(msg.content.toString());

        const ingestRequest = new IngestCollection(payload);
        ingestRequest
          .save()
          .then((res) => console.log("Data ingested into db."));
        subscriber.ack(msg);
      },
      { noAck: false }
    );
  });
});

process.on("exit", (code) => {
  channel.close();
  console.log(`Closing rabbitmq channel`);
});
