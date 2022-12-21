const express = require("express");
const cluster = require("cluster");
const { InjestController } = require("./controllers/injest");
const cors = require('cors');

const cores = require("os").cpus().length;
const app = express();

const injestController = new InjestController();

app.get("/", function (req, res, next) {
  res.send("Hello world");
});

app.use("/injest", injestController.routes());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
* Implementation of a Master Slave architecture by leveraging multiple cores.
* 
*/

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < cores; i++) {
    cluster.fork();
  }

  // This event is firs when worker died
  cluster.on("exit", (worker, code, signal) => {
    console.log(`[worker]: ${worker.process.pid} died`);
  });
}

// For Worker
else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  app.listen(3000, (err) => {
    err
      ? console.log("Error in server setup")
      : console.log(`Worker ${process.pid} started`);
  });
}
