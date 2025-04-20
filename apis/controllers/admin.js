const User = require("../models/user");


exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isBlocked) {
      user.isBlocked = true;
      await user.save();
      return res.status(200).json({ message: "User blocked successfully" });
    }
    user.isBlocked = false;
    await user.save();
    return res.status(200).json({ message: "User unblocked successfully" });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
};

