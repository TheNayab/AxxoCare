const express = require("express");
const User = require("../Models/userModel.js");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/sendEmail.js");
const crypto = require("crypto");
const isAuthenticated = require("../Middleware/auth.js");
const AuthenticatedRoles = require("../Middleware/authrole.js");
const { isAbsolute } = require("path");
const passport = require("passport");
const { Strategy } = require("passport-google-oauth20");

const router = express.Router();
const app = express();
app.use(passport.initialize());
app.use(passport.session());

// Registration method
router.post(
  "/register",
  [
    body("name")
      .isLength({ min: 3 })
      .notEmpty()
      .withMessage("Please Enter A valid name"),
    body("email")
      .isEmail()
      .withMessage("Please Enter A Valid Email")
      .isLength({ max: 320 })
      .withMessage("Password must contain up to 320 characters")
      .normalizeEmail(),
    body("phoneNumber")
      .isLength({ max: 12 })
      .notEmpty()
      .withMessage("Please Enter A Valid phone Number"),
    body("password")
      .notEmpty()
      .withMessage("Please Enter A Valid Password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .isLength({ max: 128 })
      .withMessage("Password must contain up to 128 characters")
      .matches(/[A-Z]/g)
      .withMessage("Password must contain an upper case letter")
      .matches(/[a-z]/g)
      .withMessage("Password must contain a lower case letter")
      .matches(/[0-9]/g)
      .withMessage("Password must contain a number")
      .not()
      .matches(/\s/g)
      .withMessage("Please do not use space characters"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    User.findOne({ email: req.body.email })
      .exec()
      .then((user) => {
        if (user) {
          res.status(402).json({
            message: "This user is already exist",
          });
        } else {
          if (req.body.password === req.body.confirmPassword) {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
              if (err) {
                res.status(500).json({
                  error: err.message,
                });
              } else {
                const users = new User({
                  name: req.body.name,
                  email: req.body.email,
                  phoneNumber: req.body.phoneNumber,
                  password: hash,
                });
                const data = {
                  user: {
                    id: users.id,
                  },
                };
                const authToken = jwt.sign(data, process.env.JWT_SECRET);

                const verifyEmailURL = `${req.protocol}://${req.get(
                  "host"
                )}/api/v1/verify/${users.id}`;

                const message = `Please click here :- \n\n ${verifyEmailURL} \n\n to veirfy your email...`;

                sendEmail({
                  email: req.body.email,
                  subject: `AXXO CARE Email verification `,
                  message,
                });
                users.save().then(() => {
                  res
                    .status(200)
                    .cookie("token", authToken, {
                      expires: new Date(Date.now() + 25892000000),
                      httpOnly: true,
                    })
                    .json({
                      message: `User registered successfully please verify yout email at : ${req.body.email}`,
                      users,
                    });
                });
              }
            });
          } else {
            res.status(400).json({
              message: "Password not matched",
            });
          }
        }
      })
      .catch((err) => {
        if (err.name === "CastError") {
          return res.status(400).json({
            message: "Resource not found",
          });
        }
        return res.status(500).json(err);
      });
  }
);

//login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please Enter A Valid Email")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Please Enter A Valid Password"),
  ],
  (req, res) => {
    User.findOne({ email: req.body.email })

      .exec()
      .then((user) => {
        if (!user) {
          res.status(401).json({
            message: "Invalid email or password ",
          });
        } else {
          bcrypt.compare(req.body.password, user.password, (err, result) => {
            if (err) {
              res.status(400).json({
                message: "Invalid email or password",
              });
            }
            if (result) {
              const data = {
                user: {
                  id: user.id,
                },
              };
              const authToken = jwt.sign(data, process.env.JWT_SECRET);
              return res
                .status(200)
                .cookie("token", authToken, {
                  expires: new Date(Date.now() + 25892000000),
                  httpOnly: true,
                })
                .json({
                  success: true,
                  authToken,
                  user,
                });
            }
            return res.status(400).json({
              message: "Invalid email or password",
            });
          });
        }
      })
      .catch((err) => {
        if (err.name === "CastError") {
          return res.status(400).json({
            message: "Resource not found",
          });
        }
        return res.status(500).json(err);
      });
  }
);

// forgotpassword
router.post("/forgot-password", async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
  });

  if (!user) {
    return res.status(400).json({
      message: "User not found ",
    });
  }
  const resetToken = user.getResetPasswordToken();

  await user.save({
    validateBefore: false,
  });

  const resetPasswordURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset token is :- \n\n ${resetPasswordURL} \n\n If you have not requested this email then, please ignore it`;
  try {
    await sendEmail({
      email: user.email,
      subject: `AXXO CARE password recovery`,
      message,
    });

    return res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resettoken = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    return res.status(500).json({
      error: error.message,
    });
  }
});

// Reset Password
router.put("/password/reset/:token", async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resettoken: resetPasswordToken,
  });
  if (!user) {
    return res.status(400).json({
      message: "Reset Password token is Invalid or has been expired",
    });
  } else {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) {
        return res.status(400).json({
          message: "Password not reset",
        });
      } else {
        user.password = hash;
        user.resettoken = undefined;
        user.save();
      }
    });
  }

  return res.status(200).json({
    user,
  });
});

// Verify Email
router.get("/verify/:id", async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findOne({
    _id: id,
  });
  if (!user) {
    return res.status(400).json({
      message: "Email not verified",
    });
  } else {
    user.isVerified = 1;
    user.save();
  }

  return res.status(200).json({
    message: "You are verified successfully",
  });
});

// get User Detail
router.get("/me/:id", isAuthenticated, async (req, res) => {
  let user;
  user = await User.findById(req.params.id);
  if (!user) {
    res.status(400).json({
      success: false,
      message: "User not found",
    });
  } else {
    res.status(200).json({
      success: true,
      user,
    });
  }
});

// Get all users by admin
router.get(
  "/allusers",
  isAuthenticated,
  AuthenticatedRoles("admin"),
  async (req, res) => {
    const Count = await User.countDocuments();
    await User.find()
      .then((user) => {
        res.status(200).json({
          success: true,
          user,
          Count,
        });
      })
      .catch((err) => {
        res.status(500).json({
          success: false,
          message: err.message,
        });
      });
  }
);

// get single user data by admin
router.get(
  "/thisuser/:id",
  isAuthenticated,
  AuthenticatedRoles("admin"),
  async (req, res) => {
    const user = await User.findById(req.params.id)

      .then((data) => {
        if (data.role === "admin") {
          return res.status(200).json({
            message: `admin is not allowed to get data of any admin `,
          });
        }
        if (data.role === "super-admin") {
          return res.status(200).json({
            message: `admin is not allowed to get data of super-admin `,
          });
        }
        if (!data) {
          return res.status(404).json({
            success: false,
            message: `User not found for ${req.params.id}`,
          });
        } else {
          return res.status(200).json({
            success: true,
            data,
          });
        }
      })
      .catch((err) => {
        if (err.name === "CastError") {
          return res.status(400).json({
            message: "An unexpecting error occur",
          });
        }
        return res.status(500).json(err);
      });
  }
);

// Delete user by admin
router.delete(
  "/user/:id",
  isAuthenticated,
  AuthenticatedRoles("admin"),
  async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user.role === "admin") {
      return res.status(200).json({
        message: `admin is not allowed to delete admin `,
      });
    } else if (user.role === "super-admin") {
      return res.status(200).json({
        message: `admin is not allowed to delete super-admin `,
      });
    } else {
      await User.findByIdAndRemove(req.params.id)
        .then((data) => {
          if (!data) {
            return res.status(404).json({
              success: false,
              message: `User not found for ${req.params.id}`,
            });
          } else {
            return res.status(200).json({
              success: true,
              message: `User Deleted successfully`,
            });
          }
        })
        .catch((err) => {
          if (err.name === "CastError") {
            return res.status(400).json({
              message: "An unexpecting error occur",
            });
          }
          return res.status(500).json(err.message);
        });
    }
  }
);

// Get all users by super-admin
router.get(
  "/allusersadmins",
  isAuthenticated,
  AuthenticatedRoles("super-admin"),
  async (req, res) => {
    await User.find()
      .then((user) => {
        res.status(200).json({
          success: true,
          user,
        });
      })
      .catch((err) => {
        res.status(500).json({
          success: false,
          message: err.message,
        });
      });
  }
);
module.exports = router;
