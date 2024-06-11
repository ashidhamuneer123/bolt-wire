const Product = require("../models/productModel");
const User = require("../models/userModel");
const Category = require("../models/categoryModel");

const get_searchedProducts = async (req, res) => {
  try {
    const products = await Product.find({ delete: false }).populate(
      "category_id"
    );
    // Retrieve the total count of products
    const totalCount = await Product.countDocuments();

    let sortPrice;
    const priceRange = req.query.priceRange;

    switch (priceRange) {
      case "0-100":
        sortPrice = await Product.find({
          delete: false,
          selling_price: { $gt: 0, $lte: 100 },
        });
        break;
      case "101-500":
        sortPrice = await Product.find({
          delete: false,
          selling_price: { $gt: 100, $lte: 500 },
        });
        break;
      case "501-700":
        sortPrice = await Product.find({
          delete: false,
          selling_price: { $gt: 500, $lte: 700 },
        });
        break;
      case "701-1000":
        sortPrice = await Product.find({
          delete: false,
          selling_price: { $gt: 700, $lte: 1000 },
        });
        break;
      case "1001-1500":
        sortPrice = await Product.find({
          delete: false,
          selling_price: { $gt: 1000, $lte: 1500 },
        });
        break;
      case "1501-2000":
        sortPrice = await Product.find({
          delete: false,
          selling_price: { $gt: 1500, $lte: 2000 },
        });
        break;
      default:
        sortPrice = products;
        break;
    }

    // Detailed sorting
    let sortProducts;
    const sortBy = req.query.sortBy;

    switch (sortBy) {
      case "popularity":
        // Implement sorting logic based on popularity
        sortProducts = products; // Placeholder
        break;
      case "averageRating":
        // Implement sorting logic based on average rating
        sortProducts = products; // Placeholder
        break;
      case "lowToHigh":
        sortProducts = await Product.find({ delete: false }).sort({
          selling_price: 1,
        });

        break;
      case "highToLow":
        sortProducts = await Product.find({ delete: false }).sort({
          selling_price: -1,
        });
        break;
      case "featured":
        sortProducts = products; // Placeholder
        break;
      case "newArrivals":
        const currentDate = new Date();
        const oneWeekAgo = new Date(
          currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        sortProducts = await Product.find({
          status: true,
          delete:false,
          createdAt: { $gte: oneWeekAgo },
        });
        break;
      case "aA-zZ":
        sortProducts = await Product.find({ delete: false }).sort({
          product_name: 1,
        });
        break;
      case "zZ-aA":
        sortProducts = await Product.find({ delete: false }).sort({
          product_name: -1,
        });
        break;
      default:
        sortProducts = products;
        break;
    }

    // Retrieve categories, brands, and colors for filtering
    const categories = await Category.find({ cat_status: true });
    const brandCounts = await Product.aggregate([
      { $match: { delete: false } },
      { $group: { _id: "$brand_name", count: { $sum: 1 } } },
    ]);
    const uniqueColors = await Product.distinct("color", { delete: false });
    const user = req.session.user_id;
    // Render the filter page with the retrieved data
    res.render("filter", {
      user,
      totalCount,
      categories,
      brandCounts,
      uniqueColors,
      products: sortProducts,
      products: sortPrice,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  get_searchedProducts,
};
