const express = require('express');
const router = express.Router();
const auth = require('../middleware/check-auth');

const UserController = require('../controllers/user');
const authController = require('../controllers/authorization');
const AdminController = require('../controllers/admin');


const multer = require("multer");
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 3 }
});

router.post('/signup', authController.signUp);

router.post('/login', authController.logIn);
router.get("/verify/:userId", authController.verify);

router.get('/courses', auth.userAuth, UserController.getCourses);
router.post('/addCourse', auth.userAuth, AdminController.addCourse);
router.post('/removeCourse', auth.userAuth, UserController.removeCourse);
router.get('/getUserById/:userId', auth.userAuth, AdminController.getUserById);
router.get('/getAllUsers', auth.adminAuth, AdminController.getAllUsers);

module.exports = router;
