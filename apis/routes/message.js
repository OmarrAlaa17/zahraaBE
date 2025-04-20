const express = require('express');
const router = express.Router();
const { getChatHistory } = require('../controllers/message');

router.get('/history/:senderId/:receiverId', getChatHistory);

module.exports = router;
