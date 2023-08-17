const order = require("../Models/orderModel");
const User = require("../Models/userModel");
const express = require("express");
const { default: mongoose } = require("mongoose");
const multer = require("multer");
const isAuthenticated = require("../Middleware/auth");
const AuthenticatedRoles = require("../Middleware/authrole");
const router = express.Router();

const Storage = multer.diskStorage({
  destination: "uploads/orders",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: Storage,
}).single("testImage");

// Create order
router.post("/add-order", isAuthenticated, async (req, res, next) => {
  let existingUser = await User.findById(req.user.id);

  req.body.images = upload(req, res, async (err) => {
    if (err) {
      console.log(err);
    } else {
      const order = new order({
        name: req.body.name,
        Cnic: req.body.Cnic,
        Pharmacyname: req.body.Pharmacyname,
        Pharmacyaddress: req.body.Pharmacyaddress,
        licences: req.body.licences,
        Image: {
          data: req.file.filename,
          contentType: "image/png",
        },
        user: existingUser,
      });

      try {
        var session = await mongoose.startSession();
        session.startTransaction();
        await order.save(session);
        existingUser.orders.push(order);
        await existingUser.save(session);
        await session.commitTransaction();
      } catch (err) {
        return res.status(500).json(err);
      }
      return res.status(200).json({ order });
    }
  });
});

// All orders by admin
router.get(
  "/allorders",
  isAuthenticated,
  AuthenticatedRoles("admin", "super-admin"),
  async (req, res) => {
    const Count = await order.countDocuments();
    const order = await order.find()
      .exec()
      .then((result) => {
        res.status(200).json({ Count, result });
      })
      .catch((err) => {
        res.status(500).json({ err: err.message });
      });
  }
);

// All pending requests by admin
router.get(
  "/requests",
  isAuthenticated,
  AuthenticatedRoles("admin"),
  async (req, res) => {
    await order.find({ isapproved: "false" })
      .exec()
      .then((order) => {
        res.status(200).json({
          order,
        });
      })
      .catch((err) => {
        err.message;
      });
  }
);

//Approved request by admin , super admin
router.get(
  "/requestsapproved/:id",
  isAuthenticated,
  AuthenticatedRoles("admin", "super-admin"),
  async (req, res) => {
    const order = await order.findById(req.params.id)
      .exec()
      .then((result) => {
        if (!result) {
          return res.status(400).json({
            message: "order of this user not found",
          });
        } else {
          if (result.isapproved === "false") {
            result.isapproved = "approved";
            result.save();
          } else {
            return res.status(200).json({
              message: "your request is already approved or canceled",
            });
          }
        }
        return res.status(200).json({
          message: "Your request is approved",
        });
      })
      .catch(() => {
        return res.status(500).json({
          message: "An unexpected error occur",
        });
      });
  }
);

//Cancel request by admin , super admin
router.get(
  "/requestscancel/:id",
  isAuthenticated,
  AuthenticatedRoles("admin", "super-admin"),
  async (req, res) => {
    const order = await order.findById(req.params.id)
      .exec()
      .then((result) => {
        if (!result) {
          return res.status(400).json({
            message: "order of this user not found",
          });
        } else {
          if (result.isapproved === "false") {
            result.isapproved = "Canceled";
            result.save();
          } else {
            return res.status(200).json({
              message: "your request is already approved or canceled",
            });
          }
        }
        return res.status(200).json({
          message: "Your request is Canceled",
        });
      })
      .catch(() => {
        return res.status(500).json({
          message: "An unexpected error occur",
        });
      });
  }
);

// Update order by user himself
router.put("/updateorder/:id", isAuthenticated, async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
    } else {
      const order = await order.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        Cnic: req.body.Cnic,
        Pharmacyname: req.body.Pharmacyname,
        Pharmacyaddress: req.body.Pharmacyaddress,
        Image: {
          data: req.file.filename,
          contentType: "image/png",
        },
      });
      try {
        if (!order) {
          return res.status(400).json({
            message: "order with this Id is not found",
          });
        }
        return res.status(200).json({
          message: "your data is update successfully",
        });
      } catch (error) {
        return res.status(500).json({
          message: error.message,
        });
      }
    }
  });
});

// Delete order
router.delete("/deleteorder/:id", isAuthenticated, async (req, res) => {
  let existingUser = await User.findById(req.user.id);

  let order = await order.findById(req.params.id);
  if (!order) {
    return res.status(402).json({
      message: "order with this Id is not found",
    });
  }
  await existingUser.orders.pull(order);
  await existingUser.save();
  order = await order.findByIdAndRemove(req.params.id)
    .exec()
    .then(async () => {
      if (!order) {
        return res.status(402).json({
          message: "order with this Id is not found",
        });
      } else {
        return res.status(200).json({
          message: "This order is deleted successfully",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: err.message,
      });
    });
});

// get user location
router.put("/order/location/:id", isAuthenticated, async (req, res, next) => {
  const order = await order.findById(req.params.id);
  if (!order) {
    return res.status(400).json({
      message: "order not found",
    });
  } else {
    order.location = req.body.location;
    order.save();
  }
  return res.status(200).json({
    order,
  });
});


module.exports = router;
