const medicine = require("../Models/medicineModel");
const User = require("../Models/userModel");
const express = require("express");
const { default: mongoose } = require("mongoose");
const multer = require("multer");
const isAuthenticated = require("../Middleware/auth");
const AuthenticatedRoles = require("../Middleware/authrole");
const router = express.Router();

const Storage = multer.diskStorage({
  destination: "uploads/medicines",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: Storage,
}).single("testImage");

// Create medicine
router.post("/add-medicine", isAuthenticated, async (req, res, next) => {
  let existingUser = await User.findById(req.user.id);

  req.body.images = upload(req, res, async (err) => {
    if (err) {
      console.log(err);
    } else {
      const medicine = new medicine({
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
        await medicine.save(session);
        existingUser.medicines.push(medicine);
        await existingUser.save(session);
        await session.commitTransaction();
      } catch (err) {
        return res.status(500).json(err);
      }
      return res.status(200).json({ medicine });
    }
  });
});

// All medicines by admin
router.get(
  "/allmedicines",
  isAuthenticated,
  AuthenticatedRoles("admin", "super-admin"),
  async (req, res) => {
    const Count = await medicine.countDocuments();
    const medicine = await medicine.find()
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
    await medicine.find({ isapproved: "false" })
      .exec()
      .then((medicine) => {
        res.status(200).json({
          medicine,
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
    const medicine = await medicine.findById(req.params.id)
      .exec()
      .then((result) => {
        if (!result) {
          return res.status(400).json({
            message: "medicine of this user not found",
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
    const medicine = await medicine.findById(req.params.id)
      .exec()
      .then((result) => {
        if (!result) {
          return res.status(400).json({
            message: "medicine of this user not found",
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

// Update medicine by user himself
router.put("/updatemedicine/:id", isAuthenticated, async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
    } else {
      const medicine = await medicine.findByIdAndUpdate(req.params.id, {
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
        if (!medicine) {
          return res.status(400).json({
            message: "medicine with this Id is not found",
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

// Delete medicine
router.delete("/deletemedicine/:id", isAuthenticated, async (req, res) => {
  let existingUser = await User.findById(req.user.id);

  let medicine = await medicine.findById(req.params.id);
  if (!medicine) {
    return res.status(402).json({
      message: "medicine with this Id is not found",
    });
  }
  await existingUser.medicines.pull(medicine);
  await existingUser.save();
  medicine = await medicine.findByIdAndRemove(req.params.id)
    .exec()
    .then(async () => {
      if (!medicine) {
        return res.status(402).json({
          message: "medicine with this Id is not found",
        });
      } else {
        return res.status(200).json({
          message: "This medicine is deleted successfully",
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
router.put("/medicine/location/:id", isAuthenticated, async (req, res, next) => {
  const medicine = await medicine.findById(req.params.id);
  if (!medicine) {
    return res.status(400).json({
      message: "medicine not found",
    });
  } else {
    medicine.location = req.body.location;
    medicine.save();
  }
  return res.status(200).json({
    medicine,
  });
});


module.exports = router;
