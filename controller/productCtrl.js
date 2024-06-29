const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");
const mongoose = require("mongoose");

// Create Product
const createProduct = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const newProduct = await Product.create(req.body);
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

// Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedProduct) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

// Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully", deletedProduct });
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

// Get a Product
const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const findProduct = await Product.findById(id);
    if (!findProduct) {
      return res
        .status(404)
        .json({ status: "fail", message: "Product not found" });
    }
    res.json(findProduct);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

// Get All Products
const getAllProduct = asyncHandler(async (req, res) => {
  try {
    // Filtering
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    // Limiting the fields
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("-__v");
    }

    // Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("This page does not exist");
    }

    const products = await query;
    res.json(products);
  } catch (error) {
    res.status(500).json({ status: "fail", message: error.message });
  }
});

const rating = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, prodId } = req.body;

  // Validate prodId
  if (!mongoose.Types.ObjectId.isValid(prodId)) {
    return res.status(400).json({ status: "fail", message: "Invalid product ID format" });
  }

  // Validate star
  if (star == null || star < 1 || star > 5) {
    return res.status(400).json({ status: "fail", message: "Invalid star rating" });
  }

  try {
    const product = await Product.findById(prodId);

    if (!product) {
      return res.status(404).json({ status: "fail", message: "Product not found" });
    }

    // Check if the user has already rated the product
    let alreadyRated = product.ratings.find(
      (rating) => rating.postedby.toString() === _id.toString()
    );

    if (alreadyRated) {
      // Update existing rating
      const updateRating = await Product.updateOne(
        { _id: prodId, "ratings.postedby": _id },
        { $set: { "ratings.$.star": star } }
      );

      if (updateRating.nModified === 0) {
        return res.status(400).json({ status: "fail", message: "Failed to update rating" });
      }
    } else {
      // Add new rating
      const rateProduct = await Product.findByIdAndUpdate(
        prodId,
        {
          $push: {
            ratings: {
              star: star,
              postedby: _id,
            },
          },
        },
        { new: true }
      );

      if (!rateProduct) {
        return res.status(400).json({ status: "fail", message: "Failed to add rating" });
      }
    }

    // Fetch all ratings again after update/addition
    const updatedProduct = await Product.findById(prodId);

    // Calculate total rating
    const totalRating = updatedProduct.ratings.length;
    const ratingSum = updatedProduct.ratings.reduce((sum, rating) => sum + rating.star, 0);
    const actualRating = Math.round(ratingSum / totalRating);

    // Update the product's totalrating field
    const finalProduct = await Product.findByIdAndUpdate(
      prodId,
      { totalrating: actualRating },
      { new: true }
    );

    // Return the updated product
    res.json(finalProduct);
  } catch (error) {
    console.error("Error rating product:", error);
    res.status(500).json({ status: "fail", message: error.message });
  }
});


module.exports = {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  rating,
};
