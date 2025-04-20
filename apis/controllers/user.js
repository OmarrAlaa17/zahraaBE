const User = require("../models/user");
const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const uploadImg = require("../utils/uploadImg");
const firebase = require("../utils/firebase");

var ejs = require("ejs");
var fs = require("fs");
const path = require("path");
var template = fs.readFileSync(
  path.join(process.cwd(), "./templates/verificationMail.html"),
  { encoding: "utf-8" },
);

const nodemailer = require("nodemailer");
let transporter = nodemailer.createTransport({
  service: "gmail",
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.AUTH_EMAIL, // generated ethereal user
    pass: process.env.AUTH_ETH_PASS, // generated ethereal password
  },
});

// ############################# USER FUNCTIONS ############################# //
const formatUserData = (user) => {
  const {
    DOB,
    nationality,
    currentCountry,
    currentCity,
    parent,
    parentNumber,
    mobileNumber, // Personal info
    socialState,
    numberOfChildren, // Social
    aboutPartner, // About partner user
    education,
    educationClarification,
    currentJob,
    currentJobClarification, // Education info
    height,
    weight,
    skinColor,
    eyeColor,
    hairColor, // Physical
    healthStatus,
    handicapped,
    healthCondition,
    smokingStatus,
    sportsStatus, // Health
    prayStatus,
    quranStatus,
    beardStatus,
    hijabStatus, // Religion
    financialStatus,
    accommodationStatus,
    carStatus, // Financial
    aboutYou, // About user
    ...rest // Everything else
  } = user.toObject(); // Convert the mongoose document to plain object

  return {
    personalInfo: {
      DOB,
      nationality,
      currentCountry,
      currentCity,
      parent,
      parentNumber,
      mobileNumber,
    },
    social: {
      socialState,
      numberOfChildren,
    },
    aboutPartnerUser: {
      aboutPartner,
    },
    educationInfo: {
      education,
      educationClarification,
      currentJob,
      currentJobClarification,
    },
    physical: {
      height,
      weight,
      skinColor,
      eyeColor,
      hairColor,
    },
    health: {
      healthStatus,
      handicapped,
      healthCondition,
      smokingStatus,
      sportsStatus,
    },
    religion: {
      prayStatus,
      quranStatus,
      beardStatus,
      hijabStatus,
    },
    financial: {
      financialStatus,
      accommodationStatus,
      carStatus,
    },
    aboutUser: {
      aboutYou,
    },
    // Return the rest of the fields outside the nested objects
    ...rest,
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

const sendResetPassword = async (email, user) => {
  //url to be used in the email
  try {
    const userToken = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_KEY,
      {
        //TODO: Less time
        expiresIn: "24h", // expires in 365 days
      },
    );
    const user = await User.findById(user._id);
    const mailOptions = {
      from: `"Letaskono" <${process.env.AUTH_EMAIL}>`,
      to: email,
      subject: "Reset password",
      html: ejs.render(template, {
        name: user["name"],
        verificationLink: process.env.RESET_PASS_URL + "/" + userToken,
      }),
    };

    const info = await transporter.sendMail(mailOptions, (err) => {
      console.log("Email sent");
      if (err) {
        console.log("error in nodemailer");
        console.log(
          "🚀 ~ file: user.js ~ line 93 ~ awaittransporter.sendMail ~ err",
          err?.toString(),
        );
      }
    });
  } catch (e) {
    console.log("101");
    console.log(e);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw new AppError("This user does not exist.", 401);

    if (user === null) {
      return res.status(404).json({
        status: "Failed",
        message: "User not found",
      });
    }
    sendResetPassword(req.body.email, user);
    res.status(200).json({
      status: "Success",
    });
  } catch (e) {
    res.status(400).json({
      status: "Failed",
      error: e.toString(),
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.userData._id);
    if (!user) throw new AppError("This user does not exist.", 401);

    user.password = req.body.password;
    await user.save();
    res.status(200).json({
      status: "Success",
    });
  } catch (e) {
    res.status(400).json({
      status: "Failed",
      error: e.toString(),
    });
  }
};

// ############################# FRIENDS FUNCTIONS ############################# //
const removeFriendRequests = (user) => {
  const { friendRequests, ...userDataWithoutFriendRequests } = user; // Convert to plain object and exclude friendRequests
  return userDataWithoutFriendRequests;
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userData._id)
      .populate("friends")
      .populate("friendRequests");

    var formattedFriends = user.friends.map(formatUserData);
    var formattedFriendRequests = user.friendRequests.map(formatUserData);

    formattedFriends = formattedFriends.map(removeFriendRequests);
    formattedFriendRequests = formattedFriendRequests.map(removeFriendRequests);

    res.send({
      friends: formattedFriends,
      friendRequests: formattedFriendRequests,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.addFriend = async (req, res) => {
  try {
    const user = await User.findById(req.userData._id);
    const friendToAdd = await User.findById(req.params.friendId);
    if (!friendToAdd) {
      return res.status(404).send({ message: "User not found" });
    }
    if (user.friends.includes(friendToAdd._id)) {
      return res.status(400).send({ message: "Already friends" });
    }
    if (friendToAdd.friendRequests.includes(user._id)) {
      return res.status(400).send({ message: "Friend request already sent" });
    }
    firebase.db.collection("notifications").add({
      date: Date.now(),
      friendId: user.id,
      friendName: user.name,
      type: "FRIEND_REQUEST",
      userId: friendToAdd.id,
    });
    friendToAdd.friendRequests.push(user._id);
    await friendToAdd.save();

    res.send({ message: "Friend request sent successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.acceptFriend = async (req, res) => {
  try {
    const user = await User.findById(req.userData._id);
    const friendToAccept = await User.findById(req.params.friendId);

    if (!friendToAccept) {
      return res.status(404).send({ message: "User not found" });
    }

    const requestIndex = user.friendRequests.indexOf(friendToAccept._id);
    if (requestIndex === -1) {
      return res.status(400).send({ message: "No friend request found" });
    }

    user.friends.push(friendToAccept._id);
    friendToAccept.friends.push(user._id);

    user.friendRequests.splice(requestIndex, 1);

    await user.save();
    await friendToAccept.save();

    firebase.db.collection("notifications").add({
      date: Date.now(),
      friendId: user.id,
      friendName: user.name,
      type: "FRIEND_ACCEPTED",
      userId: friendToAccept.id,
    });

    res.send({ message: "Friend request accepted successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// ############################# WISHLIST FUNCTIONS ############################# //
exports.addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.userData._id);
    const userToAdd = await User.findById(req.params.userId);

    if (!userToAdd) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if the user is already in the wishlist
    if (user.wishlist.includes(userToAdd._id)) {
      return res.status(400).send({ message: "User already in wishlist" });
    }

    // Add the user's ID to the wishlist
    user.wishlist.push(userToAdd._id);
    await user.save();

    res.send({ message: "User added to wishlist" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.userData._id);
    const userToRemove = await User.findById(req.params.userId);

    if (!userToRemove) {
      return res.status(404).send({ message: "User not found" });
    }

    // Check if the user is in the wishlist
    const index = user.wishlist.indexOf(userToRemove._id);
    if (index === -1) {
      return res.status(400).send({ message: "User not in wishlist" });
    }

    // Remove the user from the wishlist
    user.wishlist.splice(index, 1);
    await user.save();

    res.send({ message: "User removed from wishlist" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.userData._id).populate("wishlist");
    var formattedWishlist = user.wishlist.map(formatUserData);

    formattedWishlist = formattedWishlist.map(removeFriendRequests);

    res.send({ wishlist: formattedWishlist });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

// ###################### CHAT FUNCTIONS #############################
exports.chatNotification = async (req, res) => {
  try {
    const user = await User.findById(req.userData._id);
    const otherUser = await User.findById(req.params.otherUserId);
    if (!user || !otherUser) {
      return res.status(404).send({ message: "User not found" });
    }

    const notificationsRef = firebase.db.collection("notifications");
    const snapshot = await notificationsRef
      .where("userId", "==", otherUser.id)
      .where("friendId", "==", user.id)
      .where("type", "==", "CHAT")
      .get();
    if (!snapshot.empty) {
      console.log("No matching documents.");
      res.status(200).send({ message: "Notification already sent" });
    }

    firebase.db.collection("notifications").add({
      date: Date.now(),
      friendId: user.id,
      friendName: user.name,
      type: "CHAT",
      userId: otherUser.id,
    });
    res.status(200).send({ message: "Notification sent" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

