const amqp = require("amqplib/callback_api");

const MQ_URL =
  "amqps://kycfrqrx:2CN4WkdX5ZQEoLcWUNs8yVBamMTBNapn@cow.rmq2.cloudamqp.com/kycfrqrx";

var ch = null;
amqp.connect(MQ_URL, function (err, conn) {
  conn.createChannel(function (err, channel) {
    // console.log("Channel -> ", channel);
    ch = channel;
  });
});

exports.publishToQueue = async (queueName, data) => {
  ch.sendToQueue(queueName, new Buffer.from(data));
}

process.on('exit', (code) => {
  ch.close();
  console.log(`Closing rabbitmq channel`);
});