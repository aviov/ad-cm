import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import {
  errorMiddleware,
  notFoundMiddleware
} from './middleware/error.middleware';
import { AppDataSource } from "./database/data-source";
import {
  campaignRoutes,
  payoutRoutes,
  countryRoutes
} from "./routes/index";
import statusRoutes from "./routes/status.routes";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: [
    'https://d18a8kvsiz5rjf.cloudfront.net',
    'https://d394mz5qj3yru2.cloudfront.net',
    'http://localhost:3500'    // Local frontend on 3500 accessing API on 3000
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true
}));

// Middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Function to try connecting to database with backoff
let reconnectAttempt = 0;
const tryConnectDatabase = () => {
  // Only try to reconnect if not already initialized
  if (!AppDataSource.isInitialized) {
    const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000); // Max 30 second backoff
    
    console.log(`Attempting database reconnection in ${backoffTime/1000} seconds (attempt ${reconnectAttempt + 1})`);
    
    setTimeout(() => {
      AppDataSource.initialize()
        .then(() => {
          console.log("Database connection re-established successfully");
          reconnectAttempt = 0; // Reset counter on success
        })
        .catch(error => {
          console.error("Database reconnection attempt failed:", error.message);
          reconnectAttempt++; // Increment counter for next backoff
          tryConnectDatabase(); // Continue trying
        });
    }, backoffTime);
  }
};

// Custom middleware to check database connection for API routes
const databaseConnectionMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip middleware for health check endpoint
  if (req.path === '/health') {
    return next();
  }
  
  // Check if database is connected
  if (!AppDataSource.isInitialized) {
    console.error(`Database not connected - Request to ${req.method} ${req.path} rejected`);
    
    // Try to reconnect to database if not already attempting
    if (reconnectAttempt === 0) {
      reconnectAttempt = 1;
      tryConnectDatabase();
    }
    
    return res.status(503).json({ 
      message: "Service temporarily unavailable - database connection issue",
      status: "error",
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Apply database connection check middleware
app.use(databaseConnectionMiddleware);

// Routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/countries", countryRoutes);

app.use("/api", statusRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  console.log(`Health check request received at: ${new Date().toISOString()} - Path: /health`);
  res.status(200).json({ 
    status: "ok",
    service: "core-api",
    timestamp: new Date().toISOString()
  });
});

app.get('/core', (req, res) => {
  res.status(200).json({ 
    message: 'Core API - Health Check',
    version: '1.0.0'
  });
});

// Handle 404 errors
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

// Start HTTP server before database connection
// This ensures ECS health checks can succeed even if DB connection is delayed
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize database after server is started
  console.log("Attempting to connect to database...");
  AppDataSource.initialize()
    .then(() => {
      console.log("Database connection established successfully");
    })
    .catch((error) => {
      console.error("Initial database connection failed:", error.message);
      // Trigger the first reconnection attempt
      reconnectAttempt = 1;
      tryConnectDatabase();
    });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    // Close database connection if it's open
    if (AppDataSource.isInitialized) {
      AppDataSource.destroy().then(() => {
        console.log('Database connection closed');
        process.exit(0);
      }).catch(err => {
        console.error('Error closing database connection:', err);
        process.exit(1);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force shutdown after 30 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});