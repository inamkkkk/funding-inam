const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const appConfig = require('./config/appConfig');
const userRoutes = require('./controllers/userController');
const campaignRoutes = require('./controllers/campaignController');
const pledgeRoutes = require('./controllers/pledgeController');
const messagingRoutes = require('./controllers/messagingController');
const notificationRoutes = require('./controllers/notificationController');
const paymentRoutes = require('./controllers/paymentController');
const Log = require('./models/logModel');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      Log.create({
        type: 'HTTP_REQUEST',
        module: 'Morgan',
        message: message.trim()
      });
    }
  }
}));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB connected');
    Log.create({
      type: 'DATABASE',
      module: 'Mongoose',
      message: 'MongoDB connected successfully'
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    Log.create({
      type: 'ERROR',
      module: 'Mongoose',
      message: `MongoDB connection error: ${err.message}`
    });
    process.exit(1);
  });

// Routes
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/pledges', pledgeRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy!');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  Log.create({
    type: 'ERROR',
    module: 'GlobalErrorHandler',
    message: `${err.message} - ${err.stack}`
  });
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || appConfig.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  Log.create({
    type: 'SYSTEM',
    module: 'App',
    message: `Server started on port ${PORT}`
  });
});
