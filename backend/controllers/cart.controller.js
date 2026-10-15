const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Find authenticated customer
    const customer = await Customer.findById(req.user);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Make sure older customers have a cart array
    if (!customer.cart) {
      customer.cart = [];
    }

    // Check whether product is already in cart
    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (cartItem) {
      // Product already exists → increase quantity
      const newQuantity = cartItem.quantity + 1;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          message: "Requested quantity exceeds available stock",
        });
      }

      cartItem.quantity = newQuantity;
    } else {
      // Product is not in cart → add with quantity 1
      if (product.stock < 1) {
        return res.status(400).json({
          message: "Product is out of stock",
        });
      }

      customer.cart.push({
        product: product._id,
        quantity: 1,
      });
    }

    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Cart updated",
      cart: customer.cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user).populate({
      path: "cart.product",
      select: "name description price category image stock",
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      cart: customer.cart || [],
    });
  } catch (error) {
    console.error("Get cart error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    // Validate quantity
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity)
    ) {
      return res.status(400).json({
        message: "Quantity must be a number",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1",
      });
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Check stock
    if (quantity > product.stock) {
      return res.status(400).json({
        message: "Requested quantity exceeds available stock",
      });
    }

    // Find customer
    const customer = await Customer.findById(req.user);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    if (!customer.cart) {
      customer.cart = [];
    }

    // Find cart item
    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        message: "Product not in cart",
      });
    }

    cartItem.quantity = quantity;

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      cart: customer.cart,
    });
  } catch (error) {
    console.error(
      "Update cart quantity error:",
      error.message
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    // Find customer
    const customer = await Customer.findById(req.user);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    if (!customer.cart) {
      customer.cart = [];
    }

    // Find cart item
    const cartItemIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartItemIndex === -1) {
      return res.status(404).json({
        message: "Product not in cart",
      });
    }

    // Remove item
    customer.cart.splice(cartItemIndex, 1);

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: customer.cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};