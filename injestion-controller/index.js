const express = require("express");
const cluster = require("cluster");
const { IngestController } = require("./controllers/ingest");
const cors = require("cors");
const { client } = require("./redis/redis");

const cores = require("os").cpus().length;
// const cores = 4;
const app = express();

const ingestController = new IngestController();

app.get("/", function (req, res, next) {
  res.send("{message: injestion-api}");
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/ingest", ingestController.routes());

// /*
//  * Implementation of a Master Slave architecture by leveraging multiple cores.
//  *
//  */

// if (cluster.isMaster) {
//   console.log(`Master ${process.pid} is running`);

//   // Fork workers.
//   for (let i = 0; i < cores; i++) {
//     cluster.fork();
//   }

//   // This event is firs when worker died
//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`[worker]: ${worker.process.pid} died`);
//   });
// }

// // For Worker
// else {
//   // Workers can share any TCP connection
//   // In this case it is an HTTP server
// }
app.listen(process.argv[2] || 3000, (err) => {
  err
    ? console.log("Error in server setup")
    : console.log(`Process ${process.pid} started`);
});
