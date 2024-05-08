//requiring Product Schema
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const { getAllCategories } = require("./categoryController");
const mongoose = require("mongoose");
const { json } = require("body-parser");
const sharp = require("sharp");
const path = require("path");

//add product function
const add_product = async (req, res) => {
  try {
    // Additional validation for numerical fields
    const stock = parseInt(req.body.stock);
    const prod_price = parseFloat(req.body.prod_price);
    const sellig_price = parseFloat(req.body.sellig_price);

    if (
      isNaN(stock) ||
      isNaN(prod_price) ||
      isNaN(sellig_price) ||
      stock <= 0 ||
      prod_price <= 0 ||
      sellig_price <= 0
    ) {
      return res
        .status(400)
        .json({
          error:
            "Stock, Actual Price, and Selling Price must be numerical and greater than 0.",
        });
    }

    // Validate the number of images uploaded
    if (!req.files.images || req.files.images.length < 2) {
      return res
        .status(400)
        .json({ error: "At least 2 secondary images are required." });
    }

    let seconaryImages = [];
    req.files.images.forEach((e) => {
      seconaryImages.push({
        name: e.filename,
        path: e.path,
      });
    });

    let PrimaryImage;
    req.files.primaryImage.forEach((e) => {
      PrimaryImage = {
        name: e.filename,
        path: e.path,
      };
    });

    seconaryImages.forEach(async (image) => {
      await sharp(
        path.join(
          __dirname + `/../public/admin-assets/imgs/items/${image.name}`
        )
      )
        .resize(480, 480)
        .toFile(
          path.join(__dirname + `/../public/uploads/products/${image.name}`)
        );
    });
    await sharp(
      path.join(
        __dirname + `/../public/admin-assets/imgs/items/${PrimaryImage.name}`
      )
    )
      .resize(480, 480)
      .toFile(
        path.join(
          __dirname + `/../public/uploads/products/${PrimaryImage.name}`
        )
      );
    const product = new Product({
      product_name: req.body.product_name,
      brand_name: req.body.brand_name,
      description: req.body.description,
      category_id: req.body.category,
      stock: req.body.stock,
      actual_price: req.body.prod_price,
      selling_price: req.body.sellig_price,
      color: req.body.color,

      primary_image: PrimaryImage,
      secondary_images: seconaryImages,
    });

    await product.save();

    //req.flash('success', 'New product Added Sucessfully');
    res.redirect("/admin/product");
  } catch (error) {
    res.status(400).send(error);
  }
};

//render Product
const render_product_page = async (req, res) => {
  const admin = res.locals.admin;
  const currentPage = parseInt(req.query.page) || 1;
  const perPage = 4; // Number of products per page
  try {
    const totalProducts = await Product.countDocuments({ delete: false });
    const totalPages = Math.ceil(totalProducts / perPage);
    const skip = (currentPage - 1) * perPage;

    const products = await getAllProducts(skip, perPage);

    res.render("admin/product", {
      Admin: admin,
      products: products,
      success: req.flash("success")[0],
      error: req.flash("false")[0],
      totalPages: totalPages,
      currentPage: currentPage,
      itemsPerPage: perPage,
    });
  } catch (error) {
    console.error("Error rendering product page:", error);
    res.status(500).send("Internal Server Error");
  }
};

//get all Product
const getAllProducts = async (skip, perPage) => {
  const products = await Product.aggregate([
    {
      $match: {
        delete: false,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    },
    {
      $match: {
        "category.cat_status": true,
        "category.delete": false,
      },
    },
    {
      $project: {
        _id: 1,
        product_name: 1,
        brand_name: 1,
        stock: 1,
        primary_image: 1,
        "category.cat_name": 1,
        selling_price: 1,
        status: 1,
        description: 1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: perPage,
    },
  ]);
  return products;
};

//render new product form
const render_new_product = async (req, res) => {
  const admin = res.locals.admin;
  const category = await getAllCategories();
  res.render("admin/new-product", {
    fullscreen: true,
    Admin: admin,
    category: category,
  });
};

//find Product Function
const findProduct = async (product_id) => {
  const product = await Product.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(product_id),
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "category",
      },
    },
    {
      $unwind: "$category",
    },
    {
      $match: {
        "category.cat_status": true,
        "category.delete": false,
      },
    },
    {
      $project: {
        _id: 1,
        product_name: 1,
        brand_name: 1,
        stock: 1,
        primary_image: 1,
        "category.cat_name": 1,
        "category._id": 1,
        selling_price: 1,
        actual_price: 1,
        color: 1,
        status: 1,
        description: 1,
        GST: 1,
        primary_image: 1,
        secondary_images: 1,
      },
    },
  ]);
  return product;
};

const getCategory = async (name) => {
  const categories = await Category.find({ cat_name: { $ne: name } });
  return categories;
};

//reneder edit product page
const render_edit_product = async (req, res) => {
  const product = await findProduct(req.params.id);
  const obj = product[0];
  const category = await getCategory(obj.category.cat_name);
  res.render("admin/edit-product", { admin: true, obj, category: category });
};

//update product
const update_product = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.body.id });

    if (req.files != null) {
      // Handle primary image update
      let primaryImage = req.files.primaryImage;

      if (primaryImage) {
        product.primary_image.name = primaryImage[0].filename;
        product.primary_image.path = primaryImage[0].path;
        await sharp(
          path.join(
            __dirname +
              `/../public/admin-assets/imgs/items/${product.primary_image.name}`
          )
        )
          .resize(480, 480)
          .toFile(
            path.join(
              __dirname +
                `/../public/uploads/products/${product.primary_image.name}`
            )
          );
      }

      // Handle secondary image update
      let secondaryImages = req.files.images;
      if (secondaryImages) {
        for (let i = 0; i < secondaryImages.length; i++) {
          product.secondary_images[i].name = secondaryImages[i].filename;
          product.secondary_images[i].path = secondaryImages[i].path;
        }

        secondaryImages.forEach(async (image) => {
          await sharp(
            path.join(
              __dirname + `/../public/admin-assets/imgs/items/${image.filename}`
            )
          )
            .resize(480, 480)
            .toFile(
              path.join(
                __dirname + `/../public/uploads/products/${image.filename}`
              )
            );
        });
      }
    }

    const {
      product_name,
      brand_name,
      description,
      stock,
      prod_price,
      sellig_price,
      color,
      status,
    } = req.body;
    const categoryID = new mongoose.Types.ObjectId(req.body.category);

    product.product_name = product_name;
    product.brand_name = brand_name;
    product.description = description;
    product.category_id = categoryID;
    product.stock = stock;
    product.actual_price = prod_price;
    product.selling_price = sellig_price;
    product.color = color;

    product.status = status;
    //await product.save();
    await Product.findByIdAndUpdate({ _id: req.body.id }, product);
    req.flash("success", "product editted successfully");
    res.redirect("/admin/product");
  } catch (err) {
    console.log(err);
  }
};

//delete product
const deleteProduct = async (req, res) => {
  await Product.findByIdAndUpdate({ _id: req.params.id }, { delete: true });
  req.flash("success", "Poduct Deleted successfully");
  res.redirect("/admin/product");
};

module.exports = {
  render_product_page,
  render_new_product,
  add_product,
  render_edit_product,
  update_product,
  deleteProduct,
};
