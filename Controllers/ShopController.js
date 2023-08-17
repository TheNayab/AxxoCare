const Shop = require("../Models/shopModel");
const User = require("../Models/userModel");
const express = require("express");
const { default: mongoose } = require("mongoose");
const multer = require("multer");
const isAuthenticated = require("../Middleware/auth");
const AuthenticatedRoles = require("../Middleware/authrole");
const router = express.Router();

const Storage = multer.diskStorage({
  destination: "uploads/Shops",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: Storage,
}).single("testImage");

// Create Shop
router.post("/add-shop", isAuthenticated, async (req, res, next) => {
  let existingUser = await User.findById(req.user.id);

  req.body.images = upload(req, res, async (err) => {
    if (err) {
      console.log(err);
    } else {
      const shop = new Shop({
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
        await shop.save(session);
        existingUser.shops.push(shop);
        await existingUser.save(session);
        await session.commitTransaction();
      } catch (err) {
        return res.status(500).json(err);
      }
      return res.status(200).json({ shop });
    }
  });
});

// All shops by admin
router.get(
  "/allshops",
  isAuthenticated,
  AuthenticatedRoles("admin", "super-admin"),
  async (req, res) => {
    const Count = await Shop.countDocuments();
    const shop = await Shop.find()
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
    await Shop.find({ isapproved: "false" })
      .exec()
      .then((shop) => {
        res.status(200).json({
          shop,
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
    const shop = await Shop.findById(req.params.id)
      .exec()
      .then((result) => {
        if (!result) {
          return res.status(400).json({
            message: "shop of this user not found",
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
    const shop = await Shop.findById(req.params.id)
      .exec()
      .then((result) => {
        if (!result) {
          return res.status(400).json({
            message: "shop of this user not found",
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

// Update shop by user himself
router.put("/updateshop/:id", isAuthenticated, async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
    } else {
      const shop = await Shop.findByIdAndUpdate(req.params.id, {
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
        if (!shop) {
          return res.status(400).json({
            message: "shop with this Id is not found",
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

// Delete shop
router.delete("/deleteshop/:id", isAuthenticated, async (req, res) => {
  let existingUser = await User.findById(req.user.id);

  let shop = await Shop.findById(req.params.id);
  if (!shop) {
    return res.status(402).json({
      message: "shop with this Id is not found",
    });
  }
  await existingUser.shops.pull(shop);
  await existingUser.save();
  shop = await Shop.findByIdAndRemove(req.params.id)
    .exec()
    .then(async () => {
      if (!shop) {
        return res.status(402).json({
          message: "shop with this Id is not found",
        });
      } else {
        return res.status(200).json({
          message: "This shop is deleted successfully",
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
router.put("/shop/location/:id", isAuthenticated, async (req, res, next) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    return res.status(400).json({
      message: "Shop not found",
    });
  } else {
    shop.location = req.body.location;
    shop.save();
  }
  return res.status(200).json({
    shop,
  });
});


module.exports = router;
