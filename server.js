const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/expressions', require('./routes/expressionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const DEFAULT_PORT = 5000;
const initialPort = parseInt(process.env.PORT, 10) || DEFAULT_PORT;
const MAX_RETRIES = 5; // how many consecutive ports to try

function startServer(port, attemptsLeft) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use.`);
      if (attemptsLeft > 0) {
        const nextPort = port + 1;
        console.log(`Trying port ${nextPort} (retries left: ${attemptsLeft - 1})`);
        // small delay before retrying to avoid tight loop
        setTimeout(() => startServer(nextPort, attemptsLeft - 1), 200);
      } else {
        console.error(`All retry attempts exhausted. Could not bind to a free port starting at ${initialPort}.`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

startServer(initialPort, MAX_RETRIES);