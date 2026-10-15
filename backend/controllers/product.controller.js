const mongoose = require("mongoose");
const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      stock,
    } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !category ||
      !image ||
      stock === undefined
    ) {
      return res.status(400).json({
        message: "All product fields are required",
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        message: "Price must be greater than 0",
      });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({
        message: "Stock cannot be negative",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      stock,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { search, category } = req.query;

    const query = {};

    if (search) {
      query.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get all products error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
};