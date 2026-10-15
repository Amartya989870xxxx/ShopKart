const mongoose = require("mongoose");
const crypto = require("crypto");

const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");

const razorpay = require("../config/razorpay");

const validateShippingAddress = (shippingAddress) => {
  if (!shippingAddress) {
    return "Shipping address is required";
  }

  const requiredFields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "pincode",
  ];

  for (const field of requiredFields) {
    if (
      !shippingAddress[field] ||
      !shippingAddress[field].trim()
    ) {
      return `${field} is required`;
    }
  }

  if (
    !/^\d{10}$/.test(
      shippingAddress.phone.trim()
    )
  ) {
    return "Phone number must contain 10 digits";
  }

  if (
    !/^\d{6}$/.test(
      shippingAddress.pincode.trim()
    )
  ) {
    return "Pincode must contain 6 digits";
  }

  return null;
};

const createPaymentOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    const shippingError =
      validateShippingAddress(shippingAddress);

    if (shippingError) {
      return res.status(400).json({
        message: shippingError,
      });
    }

    const customer = await Customer.findById(req.user);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty",
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of customer.cart) {
      const productId = cartItem.product;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
          message: "Invalid product in cart",
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(400).json({
          message:
            "A product in your cart is no longer available",
        });
      }

      if (cartItem.quantity < 1) {
        return res.status(400).json({
          message: `Invalid quantity for ${product.name}`,
        });
      }

      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.image,
      });

      totalAmount +=
        product.price * cartItem.quantity;
    }

    const order = new Order({
      user: customer._id,

      items: orderItems,

      shippingAddress: {
        fullName:
          shippingAddress.fullName.trim(),
        phone:
          shippingAddress.phone.trim(),
        addressLine1:
          shippingAddress.addressLine1.trim(),
        city:
          shippingAddress.city.trim(),
        state:
          shippingAddress.state.trim(),
        pincode:
          shippingAddress.pincode.trim(),
      },

      totalAmount,

      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    await order.save();

    const razorpayOrder =
      await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
      });

    order.razorpayOrderId =
      razorpayOrder.id;

    await order.save();

    return res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(
      "Create payment order error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to create payment order",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !shopKartOrderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message:
          "Payment verification details are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        shopKartOrderId
      )
    ) {
      return res.status(400).json({
        message: "Invalid ShopKart order ID",
      });
    }

    const order = await Order.findOne({
      _id: shopKartOrderId,
      user: req.user,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        message: "Order has already been paid",
      });
    }

    if (!order.razorpayOrderId) {
      return res.status(400).json({
        message:
          "Razorpay order ID is missing",
      });
    }

    if (
      order.razorpayOrderId !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        message: "Invalid Razorpay order",
      });
    }

    const body =
      order.razorpayOrderId +
      "|" +
      razorpay_payment_id;

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest("hex");

    if (
      expectedSignature !==
      razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId =
      razorpay_payment_id;

    await order.save();

    const customer = await Customer.findById(
      req.user
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    customer.cart = [];

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error(
      "Verify payment error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to verify payment",
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get orders error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to load orders",
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get order by ID error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to load order",
    });
  }
};

const retryPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "PAID" || order.status !== "PENDING_PAYMENT") {
      return res.status(400).json({
        message:
          "Order has already been paid or is not eligible for payment retry",
      });
    }

    if (!order.totalAmount || order.totalAmount <= 0) {
      return res.status(400).json({
        message: "Invalid order total amount",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = "PENDING";
    await order.save();

    return res.status(200).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Retry payment error:", error.message);

    return res.status(500).json({
      message: "Unable to initiate payment retry",
    });
  }
};

const markPaymentFailed = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "PAID") {
      return res.status(400).json({
        message: "Order has already been paid",
      });
    }

    order.paymentStatus = "FAILED";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order payment marked as failed",
      order,
    });
  } catch (error) {
    console.error("Mark payment failed error:", error.message);

    return res.status(500).json({
      message: "Unable to update order",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  retryPayment,
  markPaymentFailed,
};