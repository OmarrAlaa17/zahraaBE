const User = require("../models/user");

exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database, excluding the password field and the admin user
    // Admin user is the user with isAdmin set to true
    const users = await User.find({ isAdmin: false }).select("-password");
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
};

exports.addCourse = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!req.body.courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }
    if (user.courseList) {
      if (user.courseList.includes(req.body.courseId)) {
        return res.status(400).json({ message: "Course already added" });
      }
    }
    user.courseList.push(req.body.courseId);
    await user.save();
    return res.status(200).json({ message: "Course added successfully" });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
};
