const jwt = require("jsonwebtoken");
const User = require("../models/user");
const AppError = require("../utils/appError");

const auths = {};

auths.userAuth = async (req, res, next) => {
  var token;
  try {
    if (req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
      console.log("🚀 ~ file: check-auth.js:11 ~ token", token);

      if (token) {
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        req.userData = decodedToken;

        let user = await User.findById(req.userData._id);
        if (!user || user.isBlocked) {
          res.status(401).json({ message: "User not found or blocked" });
          return;
        }
        next();
      } else {
        handleError(null, next);
      }
    } else {
      handleError(null, next);
    }
  } catch (error) {
    handleError(error, next);
  }
};

auths.adminAuth = async (req, res, next) => {
  try {
    console.log("🚀 ~ file: check-auth.js ~ line 14 ~ req.session.token", req.session)
    if (req.headers.authorization || req.session.token) {

      if (req.headers.authorization) token = req.headers.authorization.split(" ")[1];
      else if (req.session.token) token = req.session.token;

      if (token) {
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        req.userData = decodedToken;
        const foundUser = await User.findById(decodedToken._id);
        if (!foundUser) throw new AppError('The user belonging to this token no longer exists', 401);

        next();
      } else {
        throw new AppError('You are not logged in! Please log in to access.', 401);
      }

    } else {
      handleError(null, next);
    }
  } catch (error) {
    handleError(error, next);
  }
};

auths.rootAdminAuth = async (req, res, next) => {
  try {
    console.log("🚀 ~ file: check-auth.js ~ line 14 ~ req.session.token", req.session)
    if (req.headers.authorization || req.session.token) {

      if (req.headers.authorization) token = req.headers.authorization.split(" ")[1];
      else if (req.session.token) token = req.session.token;

      if (token) {
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        req.userData = decodedToken;
        const foundUser = await User.findById(decodedToken._id);
        if (!foundUser) throw new AppError('The user belonging to this token no longer exists', 401);

        if (!foundUser.isRootAdmin) throw new AppError('This user is not authorized for this action', 401);

        next();
      } else {
        throw new AppError('You are not logged in! Please log in to access.', 401);
      }

    } else {
      handleError(null, next);
    }
  } catch (error) {
    handleError(error, next);
  }
};

module.exports = auths;

function handleError(error, next) {
  if (error) {
    error.msg = error.message;
    error.status = 401;
    next(error);
  } else {
    const error = new Error();
    error.message = "Auth Failed!!";
    error.status = 401;
    next(error);
  }
}
