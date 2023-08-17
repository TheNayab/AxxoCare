const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");

const AuthenticatedRoles = (...roles) => {
  return async (req, res, next) => {
    const token = req.cookies.token;
    const decodeData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decodeData.user.id);
    console.log(decodeData.user.id)

    if (!roles.includes(req.user.role)) {
      return next(
        res.status(403).json({
          success: false,
          message: `Role:${req.user.role} is not allowed to access this resouce`,
        })
      );
    }
    next();
  };
};

module.exports = AuthenticatedRoles;
