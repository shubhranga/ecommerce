const express = require("express");
const multer = require("multer"); // Add this line
const {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  rating,
  uploadImages,
} = require("../controller/productCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const { uploadPhoto, productImgResize } = require("../middlewares/uploadImages");

const router = express.Router();

router.post("/", authMiddleware, isAdmin, createProduct);

router.put(
  "/upload/:id",
  authMiddleware,
  isAdmin,
  (req, res, next) => {
    console.log("Starting upload...");
    uploadPhoto.array("images", 10)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        return res.status(400).json({ status: "fail", message: err.message });
      } else if (err) {
        console.error("Unknown error:", err);
        return res.status(500).json({ status: "fail", message: err.message });
      }
      console.log("Upload successful.");
      next();
    });
  },
  productImgResize,
  uploadImages
);

router.get("/:id", getaProduct);
router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);
router.post("/rating", authMiddleware, rating);
router.get("/", getAllProduct);

module.exports = router;
