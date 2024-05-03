const Product = require('../models/productModel');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');


const get_searchedProducts = async (req, res) => {
    const products = await Product.find({ status: true }).populate('category_id');
    // Retrieve the total count of products
    const totalCount = await Product.countDocuments();
    
    
    const sortproducts = await Product.find({ status: true }).populate('category_id');

     //detailed sorting 
     let sortProducts;
        const sortBy = req.query.sortBy;

        switch (sortBy) {
            case 'popularity':
                // Implement sorting logic based on popularity
                sortProducts = sortproducts; // Placeholder
                break;
            case 'averageRating':
                // Implement sorting logic based on average rating
                sortProducts = sortproducts; // Placeholder
                break;
            case 'lowToHigh':
                sortProducts = await Product.find({ status: true }).sort({ selling_price: 1 });
                break;
            case 'highToLow':
                sortProducts = await Product.find({ status: true }).sort({ selling_price: -1 });
                break;
            case 'featured':
                sortProducts = sortproducts; // Placeholder
                break;
            case 'newArrivals':
                const currentDate = new Date();
                const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                sortProducts = await Product.find({ status: true, createdAt: { $gte: oneWeekAgo } });
                break;
            case 'aA-zZ':
                sortProducts = await Product.find({ status: true }).sort({ product_name: 1 });
                break;
            case 'zZ-aA':
                sortProducts = await Product.find({ status: true }).sort({ product_name: -1 });
                break;
            default:
                sortProducts = sortproducts;
                break;
        }
    let Products = await Product.aggregate([
        {
            $match: {
                delete: false,
                status: true
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: 'category_id',
                foreignField: '_id',
                as: 'category'
            }
        },
        {
            $unwind: "$category"
        }
    ]);
    
   
    

    let query = req.query.search;

    if (query) {
        // searching
        Products = Products.filter((product) => {
            query = query.toLowerCase().replace(/\s/g, '');
            //checking in product name 
            const name = product.product_name.toLowerCase().replace(/\s/g, '');
            if (name.includes(query)) {
                return true;
            } else if (query.includes(name)) {
                return true;
            }

            // checking in brand
            const brand = product.brand_name.toLowerCase().replace(/\s/g, '');
            if (brand.includes(query)) {
                return true;
            } else if (query.includes(brand)) {
                return true;
            }

            // checking in color
            const color = product.color.toLowerCase().replace(/\s/g, '');
            if (color.includes(query)) {
                return true;
            } else if (query.includes(color)) {
                return true;
            }

            // search in categories 
            const category = product.category.cat_name.toLowerCase().replace(/\s/g, '');
            if (category.includes(query)) {
                return true;
            } else if (query.includes(category)) {
                return true;
            }
        });
    }

    // category filtering
    let category = req.query.category;
    if (category) {
        Products = Products.filter((product) => {
            return category.includes(product.category.cat_name);
        })
    }
    // brand filtering
    let brand = req.query.brand;
    if (brand) {
        Products = Products.filter((product) => {
            return brand.includes(product.brand_name);
        })
    }

    // color filtering
    let color = req.query.color;
    if (color) {
        Products = Products.filter((product) => {
            return color.includes(product.color);
        })
    }

    // price sorting 
    const sortQuery = req.query.sort;
    if (sortQuery === 'low-high') {
        Products.sort((a, b) => {
            const sellingPriceA = parseFloat(a.selling_price);
            const sellingPriceB = parseFloat(b.selling_price);

            if (sellingPriceA < sellingPriceB) {
                return -1;
            } else if (sellingPriceA > sellingPriceB) {
                return 1;
            } else {
                return 0;
            }
        });
    } else if (sortQuery === 'high-low') {
        Products.sort((a, b) => {
            const sellingPriceA = parseFloat(a.selling_price);
            const sellingPriceB = parseFloat(b.selling_price);

            if (sellingPriceA < sellingPriceB) {
                return 1;
            } else if (sellingPriceA > sellingPriceB) {
                return -1;
            } else {
                return 0;
            }
        });
    } else if (sortQuery === 'new-first') {
        Products.sort((a, b) => {
            const createdAtA = new Date(a.createdAt);
            const createdAtB = new Date(b.createdAt);

            if (createdAtA > createdAtB) {
                return -1; 
            } else if (createdAtA < createdAtB) {
                return 1; 
            }
        });
    }

 
    // finding all categories 
    const categories = await Category.find({ delete: false });
  //counting number of products in each category 
  
        // Aggregate products to count the number of products in each category
        const categoryCounts = await Product.aggregate([
            {
                $match: { status: true }
            },
            {
                $group: {
                    _id: '$category_id',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map to store category counts
        const categoryCountMap = new Map();

        // Populate the map with category counts
        categoryCounts.forEach(count => {
            categoryCountMap.set(String(count._id), count.count);
        });
       


    // finding all brands
    const brands = await Product.find({ delete: false }, { _id: 0, brand_name: 1 });
    const uniqueSet = new Set();
    for (const brand of brands) {
        uniqueSet.add(brand.brand_name);
    }
    const Brands = Array.from(uniqueSet);
  
    //brand counts

    const brandCounts = await Product.aggregate([
        {
            $match: { status: true }
        },
        {
            $group: {
                _id: '$brand_name',
                count: { $sum: 1 }
            }
        }
    ]);

   

    //colors
    const colors = await Product.find({ delete: false }, { _id: 0, color: 1 });
    const uniqueSet1 = new Set();
    for (const color of colors) {
        uniqueSet1.add(color.color);
    }
    const Colors = Array.from(uniqueSet1);



    res.render('filter', { totalCount, Colors, Brands,brandCounts, categories,categoryCountMap, Products , sortproducts : sortProducts,products })
   
    
}

module.exports = {
    get_searchedProducts
}