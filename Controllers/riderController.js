const rider = require("../Models/riderModel");
const User = require("../Models/userModel");
const express = require("express");
const { default: mongoose } = require("mongoose");
const multer = require("multer");
const isAuthenticated = require("../Middleware/auth");
const AuthenticatedRoles = require("../Middleware/authrole");
const router = express.Router();

const Storage = multer.diskStorage({
  destination: "uploads/riders",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: Storage,
}).single("testImage");

// Create rider
router.post("/add-rider", isAuthenticated, async (req, res, next) => {
  let existingUser = await User.findById(req.user.id);

  req.body.images = upload(req, res, async (err) => {
    if (err) {
      console.log(err);
    } else {
      const rider = new rider({
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
        await rider.save(session);
        existingUser.riders.push(rider);
        await existingUser.save(session);
        await session.commitTransaction();
      } catch (err) {
        return res.status(500).json(err);
      }
      return res.status(200).json({ rider });
    }
  });
});

// All riders by admin
router.get(
  "/allriders",
  isAuthenticated,
  AuthenticatedRoles("admin", "super-admin"),
  async (req, res) => {
    const Count = await rider.countDocuments();
    const rider = await rider.find()
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
    await rider.find({ isapproved: "false" })
      .exec()
      .then((rider) => {
        res.status(200).json({
          rider,
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
    const rider = await rider.findById(req.params.id)
      .exec()
      .then((result) => {
        if (!result) {
          return res.status(400).json({
            message: "rider of this user not found",
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
    const rider = await rider.findById(req.params.id)
      .exec()
      .then((result) => {
        if (!result) {
          return res.status(400).json({
            message: "rider of this user not found",
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

// Update rider by user himself
router.put("/updaterider/:id", isAuthenticated, async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
    } else {
      const rider = await rider.findByIdAndUpdate(req.params.id, {
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
        if (!rider) {
          return res.status(400).json({
            message: "rider with this Id is not found",
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

// Delete rider
router.delete("/deleterider/:id", isAuthenticated, async (req, res) => {
  let existingUser = await User.findById(req.user.id);

  let rider = await rider.findById(req.params.id);
  if (!rider) {
    return res.status(402).json({
      message: "rider with this Id is not found",
    });
  }
  await existingUser.riders.pull(rider);
  await existingUser.save();
  rider = await rider.findByIdAndRemove(req.params.id)
    .exec()
    .then(async () => {
      if (!rider) {
        return res.status(402).json({
          message: "rider with this Id is not found",
        });
      } else {
        return res.status(200).json({
          message: "This rider is deleted successfully",
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
router.put("/rider/location/:id", isAuthenticated, async (req, res, next) => {
  const rider = await rider.findById(req.params.id);
  if (!rider) {
    return res.status(400).json({
      message: "rider not found",
    });
  } else {
    rider.location = req.body.location;
    rider.save();
  }
  return res.status(200).json({
    rider,
  });
});


module.exports = router;
