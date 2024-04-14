const Coupon = require('../models/couponModel');

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render('admin/coupon', { coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { code, discount, validFrom, validTo } = req.body;
    const newCoupon = new Coupon({ code, discount, validFrom, validTo });
    await newCoupon.save();
    res.redirect('/admin/coupon');
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    await Coupon.findByIdAndDelete(couponId);
    res.redirect('/admin/coupon');
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).send('Internal Server Error');
  }
};
