const amqp = require("amqplib/callback_api");
require('dotenv').config();

const MQ_URL = process.env.RABBIT_MQ_URL;

let ch = null;
amqp.connect(MQ_URL, function (err, conn) {
  conn.createChannel(function (err, channel) {
    // console.log("Channel -> ", channel);
    ch = channel;
    ch.assertQueue("immediate-queue", {
      durable: true,
    });
    ch.assertQueue("delayed-queue", {
      durable: true,
      queueMode: 'lazy'
    })
  });
});

exports.publishToQueue = (queueName, data) => {
  const success = ch.sendToQueue(queueName, new Buffer.from(data), {
    persistent: true,
  });
  return success;
};

process.on("exit", (code) => {
  ch.close();
  console.log(`Closing rabbitmq channel`);
});
