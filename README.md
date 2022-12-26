### Ingestion API

The elements chosen for this architecture:
- NodeJS - ExpressJS (WebServer)
- MongoDB - (Data Sink)
- Nginx - (Loadbalancing multiple instances)
- RabbitMQ - (for dedicated messaging queues)
- Redis - (For status of submitted ingestion jobs and appropirate routing of requests to the queues)

#### Process:

As detailed in the System Architecture Diagram, this system uses the convention of messaging queues.

The request is recieved to the load balancer i.e Nginx. Nginx will route it using Round Robin, to the available instance.

The Controller - Instance of the request will produce an event in the system. It will return client with the status of their Job. This part deals with mis-firing of requests, routing first 4 and rest 4 requests of a client to separate queues. It is also responsible for updating client with the job status.

Next is the consumer. We can have as many consumers as we would like. Ideally, we will have twice as many consumers of immediate-queues as we will of delayed-queue. This drops the data into the sink and updates redis with the job status.


#### Rationale:

Using NodeJS as the runtime, we can leverage clustering on a high powered machine. Where as, MongoDB is used for convenience, as we need to drop schema less metrics into the sink.

RabbitMQ allows us to decouple services from the controllers. Now, we can scale both of these separately. Services are state less, and only bound to consume and drop to the sink, as well as updaing Redis. But why RabbitMQ and not any other SQS? Because we needed two dedicated queues, in which we want the delayed queued to be lazy. It does not need to be fast. We can store messages into harddrive for as long as we cannot allocate any computation to it. Goal was to decouple things in the system for scalibility and fail safety.

Nginx is the crux. We need to scale as much to respond to the number of requests as our requirement.

Redis, for fast caching. There needed to be an intermediary store but that certainly could not be a database. We need to store job statuses and respond to them as quickly as possible.