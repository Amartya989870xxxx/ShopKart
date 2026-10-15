const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");

const app = express();
const PORT = process.env.PORT || 5000;

// Reuse the connection promise within a warm Node.js instance.
const dbCache =
  global.__shopkartDb ||
  (global.__shopkartDb = { promise: null });

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  if (!dbCache.promise) {
    dbCache.promise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .catch((error) => {
        dbCache.promise = null;
        throw error;
      });
  }

  await dbCache.promise;
}

// Allow a future request to reconnect after a disconnect.
mongoose.connection.on("disconnected", () => {
  dbCache.promise = null;
  console.error("MongoDB connection disconnected.");
});

app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://shopkart-weld.vercel.app",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

app.use(cookieParser());

// Health endpoint: verifies that the Express application responds.
app.get("/", (req, res) => {
  res.send("ShopKart Backend is running!");
});

// Do not execute database-dependent routes before the connection is ready.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(
      "MongoDB unavailable for API request:",
      error.name,
      error.message
    );

    return res.status(503).json({
      message: "Database temporarily unavailable. Please try again.",
    });
  }
});

app.use("/customers", customerRoutes);
app.use("/products", productRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

// Vercel handles the deployed Express application.
// Run a local listener only during local development.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;