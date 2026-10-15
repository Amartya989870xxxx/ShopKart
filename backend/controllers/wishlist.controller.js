const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate Product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    // 2. Check whether the product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // 3. Find the authenticated customer
    const customer = await Customer.findById(req.user);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // 4. Prevent duplicate wishlist entries
    const alreadyWishlisted = customer.wishlist.some(
      (id) => id.toString() === productId
    );

    if (alreadyWishlisted) {
      return res.status(409).json({
        message: "Product already in wishlist",
      });
    }

    // 5. Store the Product ObjectId
    customer.wishlist.push(product._id);

    // 6. Save the updated customer
    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    console.error("Add to wishlist error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getWishlist = async (req, res) => {
  try {
    // Find the authenticated customer
    const customer = await Customer.findById(req.user).populate({
      path: "wishlist",
      select: "name description price category image stock",
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist,
    });
  } catch (error) {
    console.error("Get wishlist error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate Product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    // 2. Find the authenticated customer
    const customer = await Customer.findById(req.user);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // 3. Find the product in the wishlist
    const wishlistIndex = customer.wishlist.findIndex(
      (id) => id.toString() === productId
    );

    if (wishlistIndex === -1) {
      return res.status(404).json({
        message: "Product not in wishlist",
      });
    }

    // 4. Remove the Product ObjectId
    customer.wishlist.splice(wishlistIndex, 1);

    // 5. Save the updated customer
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};