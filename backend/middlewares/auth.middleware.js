const jwt = require("jsonwebtoken");

const authenticateCustomer = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is required",
      });
    }

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decodedToken.customerId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired authentication token",
    });
  }
};

module.exports = authenticateCustomer;