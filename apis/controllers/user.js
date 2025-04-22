const User = require("../models/user");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");

var ejs = require("ejs");
var fs = require("fs");
const path = require("path");
var template = fs.readFileSync(
  path.join(process.cwd(), "./templates/verificationMail.html"),
  { encoding: "utf-8" }
);

// const nodemailer = require("nodemailer");
// let transporter = nodemailer.createTransport({
//   service: "gmail",
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.AUTH_EMAIL, // generated ethereal user
//     pass: process.env.AUTH_ETH_PASS, // generated ethereal password
//   },
// });

// ############################# USER FUNCTIONS ############################# //
const formatUserData = (user) => {
  const {
    ...rest // Everything else
  } = user.toObject(); // Convert the mongoose document to plain object

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    country: user.country,
    courseList: user.courseList,
    verified: user.verified,
    isAdmin: user.isAdmin,
    isBlocked: user.isBlocked,
  };
};
exports.formatUserData = formatUserData;

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    const formattedUser = formatUserData(user);
    res.send(formattedUser);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    // format all the users
    const formattedUsers = users.map((user) => formatUserData(user));
    res.send(formattedUsers);
  } catch (err) {
    res.status(400).send({ error: err.toString() });
  }
};

// Utility function to flatten nested objects
const flattenObject = (obj, res = {}) => {
  for (let key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      flattenObject(obj[key], res);
    } else {
      res[key] = obj[key];
    }
  }
  return res;
};

exports.updateUser = async (req, res, next) => {
  try {
    // remove the password
    var user = await User.findById(req.userData._id).select("-password");
    let urls;

    if (req.files) {
      urls = await uploadImg(req.files);
    }
    const flattenedBody = flattenObject(req.body);

    var updatedUser = {
      ...flattenedBody,
      ...urls,
    };

    const updates = Object.keys(updatedUser);

    updates.forEach((element) => (user[element] = updatedUser[element]));
    if (urls) user["image"] = urls[0];

    await user.save();
    const formattedUser = formatUserData(user);
    res.send(formattedUser);
  } catch (e) {
    res.status(400).send({ error: e.toString() });
  }
};

// ############################# PASSWORD FUNCTIONS ############################# //

// const sendResetPassword = async (email, user) => {
//   //url to be used in the email
//   try {
//     const userToken = jwt.sign(
//       { _id: user._id.toString() },
//       process.env.JWT_KEY,
//       {
//         //TODO: Less time
//         expiresIn: "24h", // expires in 365 days
//       },
//     );
//     const user = await User.findById(user._id);
//     const mailOptions = {
//       from: `"Letaskono" <${process.env.AUTH_EMAIL}>`,
//       to: email,
//       subject: "Reset password",
//       html: ejs.render(template, {
//         name: user["name"],
//         verificationLink: process.env.RESET_PASS_URL + "/" + userToken,
//       }),
//     };

//     const info = await transporter.sendMail(mailOptions, (err) => {
//       console.log("Email sent");
//       if (err) {
//         console.log("error in nodemailer");
//         console.log(
//           "🚀 ~ file: user.js ~ line 93 ~ awaittransporter.sendMail ~ err",
//           err?.toString(),
//         );
//       }
//     });
//   } catch (e) {
//     console.log("101");
//     console.log(e);
//   }
// };

// exports.resetPassword = async (req, res) => {
//   try {
//     const user = await User.findOne({ email: req.body.email });
//     if (!user) throw new AppError("This user does not exist.", 401);

//     if (user === null) {
//       return res.status(404).json({
//         status: "Failed",
//         message: "User not found",
//       });
//     }
//     sendResetPassword(req.body.email, user);
//     res.status(200).json({
//       status: "Success",
//     });
//   } catch (e) {
//     res.status(400).json({
//       status: "Failed",
//       error: e.toString(),
//     });
//   }
// };

// exports.changePassword = async (req, res) => {
//   try {
//     const user = await User.findById(req.userData._id);
//     if (!user) throw new AppError("This user does not exist.", 401);

//     user.password = req.body.password;
//     await user.save();
//     res.status(200).json({
//       status: "Success",
//     });
//   } catch (e) {
//     res.status(400).json({
//       status: "Failed",
//       error: e.toString(),
//     });
//   }
// };

// ############################# Courses FUNCTIONS ############################# //
exports.getCourses = async (req, res) => {
  try {
    const user = await User.findById(req.userData._id).select("-password");
    if (!user) throw new AppError("This user does not exist.", 401);

    res.status(200).json({
      status: "Success",
      courses: user.courses,
    });
  } catch (e) {
    res.status(400).json({
      status: "Failed",
      error: e.toString(),
    });
  }
};