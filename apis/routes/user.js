const express = require('express');
const router = express.Router();
const auth = require('../middleware/check-auth');
const passport = require('../middleware/passport');

const UserController = require('../controllers/user');
const AdminController = require('../controllers/admin');
const authController = require('../controllers/authorization');


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

router.post('/signup', upload.array("image"), authController.signUp);
// router.post('/facebook', passport.authenticate('facebook-token', { session: false }), authController.loginWithFacebookOrGoogle)
router.post('/google', authController.loginWithFacebookOrGoogle)

router.post('/login', authController.logIn);
router.get("/verify/:userId", authController.verify);

router.post('/addFriend/:friendId', auth.userAuth, UserController.addFriend);
router.post('/acceptFriend/:friendId', auth.userAuth, UserController.acceptFriend);
router.get('/friends', auth.userAuth, UserController.getFriends);

router.post('/wishlist/add/:userId', auth.userAuth, UserController.addToWishlist);
router.delete('/wishlist/remove/:userId', auth.userAuth, UserController.removeFromWishlist);
router.get('/wishlist', auth.userAuth, UserController.getWishlist);

router.put('', upload.array("image"), auth.userAuth, UserController.updateUser);

router.post('/chatNotification/:otherUserId', auth.userAuth, UserController.chatNotification);

router.patch('/reset-password', UserController.resetPassword);
router.patch('/change-password', auth.userAuth, UserController.changePassword);

router.get('/allUsers', UserController.getAllUsers);
router.get('/:id', UserController.getUser);

//Admin router
// block user post
router.post('/block/:userId', auth.adminAuth, AdminController.blockUser);



module.exports = router;
