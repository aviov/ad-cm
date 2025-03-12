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

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

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

// // Error handling middleware
// app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error(err.stack);
//   res.status(500).json({ message: "Something went wrong!" });
// });

// Global error handler
app.use(errorMiddleware);

// Start server first, THEN try to connect to database
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Try to initialize the database connection
  AppDataSource.initialize()
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((error) => {
      console.error("Error connecting to database:", error);
      // Continue running the app even if database connection fails
      // This allows health checks to pass while database issues are resolved
    });
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    if (AppDataSource.isInitialized) {
      AppDataSource.destroy()
        .then(() => console.log('Database connection closed'))
        .catch(err => console.error('Error closing database connection:', err));
    }
    process.exit(0);
  });
});

// // Initialize database connection
// AppDataSource.initialize()
//   .then(() => {
//     console.log("Database connected successfully");
//     // Start the server
//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   })
//   .catch((error) => console.error("Error connecting to database:", error));