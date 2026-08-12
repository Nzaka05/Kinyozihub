import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth";
import { connectDB } from "./db";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
  process.exit(1);
}

if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("FATAL ERROR: GOOGLE_CLIENT_ID environment variable is missing.");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

import { bookingsRouter } from "./routes/bookings";
import { barbersRouter } from "./routes/barbers";
import { shopsRouter } from "./routes/shops";
import { notificationsRouter } from "./routes/notifications";
import { conversationsRouter } from "./routes/conversations";
import { servicesRouter } from "./routes/services";
import { reviewsRouter } from "./routes/reviews";
import blockedTimeRouter from "./routes/blocked-time";

app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/barbers", barbersRouter);
app.use("/api/shops", shopsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/services", servicesRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/blocked-time", blockedTimeRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
