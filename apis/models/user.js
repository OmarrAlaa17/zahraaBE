const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const userSchema = mongoose.Schema(
  {
    email: {
      unique: true,
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    name: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    courseList: {
      // Array of course IDs
      type: [String],
      default: ["n7P5Gb9OKx"],
    },
    verified: {
      type: Boolean,
      default: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: "created_at" } }
);

userSchema.statics.findByCredentials = async (email, password) => {
  try {
    let user = await User.findOne({ email: email });

    if (!user) {
      throw new Error("unable to login");
    }
    console.log("first");
    const ismatch = await bcrypt.compare(password, user.password);
    console.log(
      "🚀 ~ file: user.js ~ line 103 ~ userSchema.statics.findByCredentials=async ~ ismatch",
      ismatch
    );
    if (!ismatch) {
      throw new Error("unable to login");
    }

    return user;
  } catch (error) {
    console.log(
      "🚀 ~ file: user.js ~ line 106 ~ userSchema.statics.findByCredentials=async ~ error",
      error
    );
    return error;
  }
};

userSchema.methods.toJSON = function () {
  const user = this;
  const userobject = user.toObject();
  delete userobject.password;
  return userobject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  console.log("🚀 ~ file: user.js:96 ~ user", user);

  const token = jwt.sign(
    { _id: user._id.toString(), userType: user.userType },
    process.env.JWT_KEY,
    {
      expiresIn: "24h", // expires in 365 days
    }
  );
  console.log("🚀 ~ file: user.js:100 ~ token ~ token", token);
  return token;
};

userSchema.pre("save", async function (next) {
  try {
    const user = this;
    if (user.isModified("password")) {
      console.log(2);
      user.password = await bcrypt.hash(user.password, 8);
      console.log(3);
    }
    console.log(4);
    next();
  } catch (error) {
    console.log("🚀 ~ file: user.js ~ line 136 ~ error", error);

    next();
  }
});

const User = mongoose.model("user", userSchema);
module.exports = User;
