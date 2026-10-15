const express = require("express");

const authenticateCustomer = require("../middlewares/auth.middleware");

const {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  retryPayment,
  markPaymentFailed,
} = require("../controllers/order.controller");

const router = express.Router();

router.post(
  "/create-payment-order",
  authenticateCustomer,
  createPaymentOrder
);

router.post(
  "/verify-payment",
  authenticateCustomer,
  verifyPayment
);

router.post(
  "/:id/retry-payment",
  authenticateCustomer,
  retryPayment
);

router.post(
  "/:id/payment-failed",
  authenticateCustomer,
  markPaymentFailed
);

router.get(
  "/",
  authenticateCustomer,
  getOrders
);

router.get(
  "/:id",
  authenticateCustomer,
  getOrderById
);

module.exports = router;