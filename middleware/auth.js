

const isLogin = async (req, res, next) => {
  try {
    if (req.session.userId) {
    
    } else {
      res.redirect("/");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.userId) {
       res.redirect("/");
       return
    }
    else{
      next();
    }
   
  } catch (error) {
    console.log(error.message);
  }
};

const jsonIsLogin = async (req, res, next) => {
  try {
    if (req.session.userId) {
      next();
    } else {
      res.status(401).send();
    }
  } catch (error) {
    console.log(error.message);
  }
};

const changePassword = async (req, res, next) => {
  try {
    if (req.session.otpVerified) {
      next();
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};







module.exports = {
  isLogin,
  isLogout,
  changePassword,
  jsonIsLogin,
};