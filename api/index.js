require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const gigRoutes = require("./routes/gigRoutes");
const bookingRoutes = require('./routes/bookingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const sanitiseRequest = require('./middleware/sanitiseRequest');
const errorHandler = require('./middleware/errorHandler');

const app = express();
// The database connection is awaited in startServer() below.

const PORT = process.env.PORT || 4000;
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", CLIENT_ORIGIN],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"]
      }
    },
    crossOriginResourcePolicy: { policy: 'same-site' }
  })
);

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10kb' }));

// Strips MongoDB operators and control characters from request input.
// Registered immediately after body parsing so every route receives
// sanitised data, rather than relying on each route to do it.
// Express 5 leaves req.body undefined when no JSON body is sent. Normalising
// it to an empty object lets validation return 400 rather than throwing a 500.
app.use((req, res, next) => {
  if (req.body === undefined) {
    req.body = {};
  }
  next();
});

app.use(sanitiseRequest);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the HustleHub+ Backend API.'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    protocol: USE_HTTPS ? 'HTTPS' : 'HTTP',
    timestamp: new Date().toISOString()
  });
});


app.use('/api/auth', authRoutes);
app.use("/api/gigs", gigRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  });
});

app.use(errorHandler);

async function startServer() {
  // Nothing is served until the database connection succeeds.
  await connectDB();

  if (USE_HTTPS) {
  const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, 'certs', 'localhost-key.pem');
  const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, 'certs', 'localhost-cert.pem');

  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`HustleHub+ API running on HTTPS port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`HustleHub+ API running on HTTP port ${PORT}`);
  });
}


}

startServer();

