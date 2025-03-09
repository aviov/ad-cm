import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { AppDataSource } from "./database/data-source";
import { campaignRoutes, payoutRoutes } from "./routes/index";
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

app.use("/api", statusRoutes);

// Health check endpoint
app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok" });
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

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.error("Error connecting to database:", error));