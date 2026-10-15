
const express = require("express");

const {
  registerCustomer,
  loginCustomer,
  getCurrentCustomer,
  logoutCustomer,
} = require("../controllers/customer.controller");

const authenticateCustomer = require("../middlewares/auth.middleware");

const router = express.Router();

// Customer Registration
router.post("/register", registerCustomer);

//Customer Login
router.post("/login", loginCustomer);

//Current User Profile
router.get("/me", authenticateCustomer, getCurrentCustomer);

router.post("/logout", authenticateCustomer, logoutCustomer); // logout customer

module.exports = router;