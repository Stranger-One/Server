import express from 'express';
import cors from 'cors';
import { connectDB } from './utils/db.js';
import DayRoute from './routes/DayRoute.js';
import TimeRoute from './routes/TimeRoute.js'
import TestTokenRoute from './routes/TestTokenRoute.js';
import { Worker } from 'node:worker_threads';
// import "./utils/createDaySlot.js"

import client from 'prom-client';
import MonitorRoute from './routes/MonitorRoute.js';
import responseTime from 'response-time';
import { createLogger } from 'winston';
import LokiTransport from 'winston-loki';


const options = {
  transports: [
    new LokiTransport({
      labels: { app: 'express-app' },
      host: "http://192.168.155.103:3100"
    })
  ]
};
export const logger = createLogger(options);



const app = express();
const PORT = process.env.PORT || 8000;



// connectDB()

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  console.log("New Request Received");
  logger.info('New Request Received', { timestamp: new Date().toISOString() });
  
  res.status(200).json({message: 'Hello From Server'});
});

app.use('/api/day', DayRoute )
app.use('/api/time', TimeRoute )
app.use('/api/testToken', TestTokenRoute)

app.get('/api/non-blocking', (req, res) => {
  res.status(200).send('Response from non-blocking route')
})
app.get('/api/blocking', (req, res) => {  
  const worker = new Worker('./utils/workers.js');

  worker.on('message', (message) =>{
    res.status(200).send(`Response from blocking route ${message}`)
  })

  worker.on('error', (error)=>{
    res.status(501).send(`An error occured ${error}`)
  })

})

const collectDefaultMetrics = client.collectDefaultMetrics;
const Registry = client.Registry;
const register = new Registry();
collectDefaultMetrics({ register });

const reqResTime = new client.Histogram({
  name: 'request_response_time_seconds',
  help: 'Time taken to respond to requests',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.05, 0.1, 0.2, 0.4, 0.5, 0.8, 1, 2, 3, 5, 10], // Buckets in seconds
  registers: [register],
});

const totalReqCounter = new client.Counter({
  name: 'total_requests',
  help: 'Total number of requests received',
  registers: [register],
});

app.use(responseTime((req, res, time) => {
  totalReqCounter.inc(); // Increment the total request counter
  reqResTime
    .labels({
      method: req.method,
      route: req.route?.path || req.url,
      status_code: res.statusCode.toString(),
    })
    .observe(time);
}));

app.use('/api/monitor', MonitorRoute)
app.get('/metrics', async (req, res) => {
  try {
    logger.info('Metrics endpoint hit', { timestamp: new Date().toISOString() });
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error collecting metrics', { error: error.message, timestamp: new Date().toISOString() });
    console.error('Error collecting metrics:', error);
    res.status(500).send('Error collecting metrics');
    
  }
})


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});