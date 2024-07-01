const express = require("express");
const {
  createBlog,
  updateBlog,
  getBlog,
  getAllBlogs,
  deleteBlog,
  liketheBlog,
  disliketheBlog,
  uploadImages,
} = require("../controller/blogCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { blogImgResize, uploadPhoto } = require("../middlewares/uploadImages");
const router = express.Router();

router.put("/likes", authMiddleware, liketheBlog);
router.put("/dislikes", authMiddleware, disliketheBlog);
router.post("/", authMiddleware, isAdmin, createBlog);
router.put("/:id", authMiddleware, isAdmin, updateBlog);
router.get("/", getAllBlogs);
router.delete("/:id", authMiddleware, isAdmin, deleteBlog);
router.get("/:id", getBlog);
router.put(
  "/upload/:id",
  authMiddleware,
  isAdmin,
  (req, res, next) => {
    console.log("Starting upload...");
    uploadPhoto.array("images", 2)(req, res, (err) => {
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
  blogImgResize,
  uploadImages
);

module.exports = router;
