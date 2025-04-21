const User = require("../models/user");
const UserController = require("../controllers/user");
const bcrypt = require("bcryptjs");
var passwordHash = require("password-hash")
const jwt = require("jsonwebtoken");
var ejs = require('ejs');
var fs = require('fs');
const path = require("path");
var template = fs.readFileSync(path.join(process.cwd(), './templates/verificationMail.html'), { encoding: 'utf-8' });
const catchAsync = require("../utils/catchAsync")

// const ResendTransport  = require("@documenso/nodemailer-resend")
// const resend  = require("@documenso/nodemailer-resend")

const { Resend } = require('resend');
// const emailer = new resend.Resend(process.env.NEXT_PRIVATE_RESEND_API_KEY);

const resend = new Resend('re_YaWzJz4i_8F9NjPehvf4sPc9B3jrfp1cj');


const UserVerification = require("../models/userVerfication");
const nodemailer = require("nodemailer");
// let transporter = nodemailer.createTransport({
//   service: "gmail",
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: 'shopymontu@gmail.com', // generated ethereal user
//     pass: 'mxjbjvftmmngmtqo', // generated ethereal password
//     // clientId: process.env.CLIENT_ID,
//     // clientSecret: process.env.CLIENT_SECRET,
//     // refreshToken: process.env.TOKEN_URI
//     //
//   },
// });
// let transporter = nodemailer.createTransport(
//   nodemailer.createTransport(
//     resend.ResendTransport.makeTransport({
//       apiKey: process.env.NEXT_PRIVATE_RESEND_API_KEY || '',
//     }),
//   ),
// );


// ############################# LOGIN/SIGNUP #############################//
exports.signUp = async (req, res, next) => {
  try {
    console.log("req.body", req.body);
    const user = await User.create({ ...req.body });
    // await sendVerificationEmail(user._id, user.email);
    // if(req.files) urls = await uploadImg(req.files);
    // if (urls) user["image"] = urls[0]
    // await user.save();
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.logIn = async (req, res, next) => {
  try {
    var user = await User.findOne({ email: req.body.email });

    if (!user) {
      throw new Error("User is not found");
    }
    const ismatch = await bcrypt.compare(req.body.password, user.password);
    if (!ismatch) {
      throw new Error("Password is incorrect");
    }

    if (!user.verified) {
      throw new Error("email is not verified ");
    }

    if (user.isBlocked) {
      throw new Error("User is blocked");
    }
    const token = await user.generateAuthToken();

    // remove the password from the user and then user the formatUserData function
    user.password = undefined;
    user = UserController.formatUserData(user);

    return res.json({ token, user });
  } catch (err) {
    return res.status(401).json({ error: err.toString() });
  }
};

//   Creating Sign Token
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })
}

exports.loginWithFacebookOrGoogle = catchAsync(async (req, res, next) => {
  try {
    // Check if user signed up before using google
    const userExists = await User.findOne({ $or: [{ googleID: req.body.googleID }, { email: req.body.email }] })
      .select("verified dataComplete _id password userType");

    if (userExists) {
      const token = await userExists.generateAuthToken();
      return res.status(200).json({ status: "success", user: userExists, token: token });
    }

    // Create new user 
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      googleID: req.body.googleID,
      verified: true
    })
    await newUser.save()
    const token = await newUser.generateAuthToken();
    return res.status(200).json({ status: "success", user: newUser, token: token });
  }
  catch (err) {
    return res.status(401).json({ error: err.toString() });
  }
})


// ############################# EMAIL VERIFICATION ############################# //
const sendVerificationEmail = async (_id, email) => {
  try {
    const currenturl = process.env.CURRENTURL;
    const hashstring = _id.toString() + process.env.JWT_KEY;
    const uniqueString = await bcrypt.hash(hashstring, 8);
    const newVerification = new UserVerification({
      userId: _id,
      email: email,
      uniqueString: uniqueString,
      createdAt: Date.now(),
      expiresAt: Date.now() + 21600000, //6 hrs in ms]
    });
    // TODO: Change name to the user's name
    const mailOptions = {
      // from: `"Letaskono" <${process.env.AUTH_EMAIL}>`,
      from: `"Letaskono" <irushbullet@gmail.com>`,
      to: email,
      subject: " Verify Your Email",
      // html: ejs.render(template, {
      //   name: "fellow adventurer",
      //   verificationLink: currenturl + "api/user/verify/" + _id + "?hash=" + uniqueString
      // }),
      html: `<h1>Verify Your Email</h1>`
    };

    await newVerification.save();

    // const info = await transporter.sendMail(mailOptions, (err) => {
    //   if (err) {
    //     console.log("error in nodemailer");
    //     console.log(
    //       "🚀 ~ file: user.js ~ line 93 ~ awaittransporter.sendMail ~ err",
    //       err?.toString()
    //     );
    //   }
    // });
    await sendMail(mailOptions);
  } catch (e) {
    console.log("101");
    console.log(e);
  }
};

const sendMail = async (mailOptions) => {
  try {
    console.log("Sending email with options: ", mailOptions);
    const result = await resend.emails.send(mailOptions);
    console.log("Email sent: ", result);
  } catch (err) {
    console.log("Error in sending email: ", err.toString());
  }
};

exports.verify = async (req, res) => {
  try {
    let userId = req.params.userId;
    let uniqueString = req.query.hash;

    const result = await UserVerification.find({ userId });
    const user = await User.findById(userId);

    if (result.length > 0) {
      let hasheduniqueString = result[0].uniqueString;

      if (uniqueString === hasheduniqueString) {
        user.verified = true;
        await user.save();
        /*  await User.updateOne({_id:userId},{verified:true})  */
        await UserVerification.deleteOne({ userId });
      }
    }

    res.redirect(301, process.env.VERIFY_URL);
  } catch (e) {
    res.status(400).send(e);
  }
};

const verifyCompleteData = (user) => {

  for (data in user) {
    if (user[data] === "" || user[data] === null) {
      console.log(
        "🚀 ~ file: user.js ~ line 200 ~ verifyCompleteData ~ user[data] ",
        data,
        user[data]
      );
      console.log("====FALSE====");
      return false;
    }
  }

  return true;
};
