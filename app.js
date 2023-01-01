//testuser@test.com | testuser
require('dotenv').config();
require('express-async-errors');

//require path module
const path = require('path');

// extra security packages
const helmet = require('helmet');
// const cors = require('cors'); //we want the external application to access the API
const xss = require('xss-clean');
//const rateLimiter = require('express-rate-limit'); //requests will be limited on specific routes


// Swagger
// const swaggerUI = require('swagger-ui-express');
// const YAML = require('yamljs');
// const swaggerDocument = YAML.load('./swagger.yaml');

const express = require('express');
const app = express();


const connectDB = require('./db/connect');
const authenticateUser = require('./middleware/authentication');
// routers
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');
// error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');


//rate limiter - here limits will be for each route
// app.set('trust proxy', 1);
// app.use(
//   rateLimiter({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//   })
// );

app.set('trust proxy', 1);
//use the static build of frontend
app.use(express.static(path.resolve(__dirname, './client/build')));

//
app.use(express.json());
app.use(helmet());
// app.use(cors()); //we want the external application to access the API
app.use(xss());

// Swagger
// app.get('/', (req, res) => {
//   res.send('<h1>Jobs API</h1><a href="/api-docs">Documentation</a>');
// });
// app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// routes for API
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', authenticateUser, jobsRouter);
// routes for FRONT END (takes all the request apart for the APIs ones and provide the actual pages)
// serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});
//if no route exist redirect to notFound
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
