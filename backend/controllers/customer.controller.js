const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password || !phone) { //this is used to validate required fields
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) { //this is used to validate password length
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingCustomer = await Customer.findOne({ email: normalizedEmail });

    if (existingCustomer) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
    });

    return res.status(201).json({
      message: "Customer registered successfully",
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};



const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const customer = await Customer.findOne({
      email: normalizedEmail,
    });

    if (!customer) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare the entered password with the stored bcrypt hash.
    const isPasswordCorrect = await bcrypt.compare(
      password,
      customer.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(customer._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Customer logged in successfully",
      token,
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    console.error("Login customer error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};


const getCurrentCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user).select(
      "-password"
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      message: "Current customer fetched successfully",
      customer,
    });
  } catch (error) {
    console.error("Get current customer error:", error.message);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const logoutCustomer = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    message: "Customer logged out successfully",
  });
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  logoutCustomer,
};