const Message = require('../models/message');
const User = require('../models/user');

// REST API: Retrieve chat history between two users
const getChatHistory = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ timestamp: 1 }).populate('senderId receiverId');

    res.json(messages.map(msg => ({
      senderId: msg.senderId._id,
      receiverId: msg.receiverId._id,
      senderName: msg.senderId.username,
      receiverName: msg.receiverId.username,
      content: msg.content,
      timestamp: msg.timestamp
    })));
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving messages', error });
  }
};

// WebSocket: Handle socket connection
const handleSocketConnection = async (socket, io) => {
  console.log('A user connected:', socket.id);

  // Join chat room
  socket.on('joinRoom', async ({ senderId, receiverId }) => {
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      socket.emit('error', { message: 'Invalid user IDs' });
      return;
    }

    const room = [senderId, receiverId].sort().join('_');
    socket.join(room);
  });

  // Send message
  socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      socket.emit('error', { message: 'Invalid user IDs' });
      return;
    }

    const room = [senderId, receiverId].sort().join('_');

    // Save message to the database
    const message = new Message({ senderId, receiverId, content });
    await message.save();

    // Populate sender and receiver details before emitting
    const populatedMessage = await message.populate('senderId receiverId');

    // Emit message to room
    io.to(room).emit('receiveMessage', {
      senderId: populatedMessage.senderId._id,
      receiverId: populatedMessage.receiverId._id,
      senderName: populatedMessage.senderId.username,
      receiverName: populatedMessage.receiverId.username,
      content: populatedMessage.content,
      timestamp: populatedMessage.timestamp
    });
  });

  // Load previous messages
  socket.on('loadMessages', async ({ senderId, receiverId }) => {
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      socket.emit('error', { message: 'Invalid user IDs' });
      return;
    }

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort({ timestamp: 1 }).populate('senderId receiverId');

    // Format and send messages
    socket.emit('previousMessages', messages.map(msg => ({
      senderId: msg.senderId._id,
      receiverId: msg.receiverId._id,
      senderName: msg.senderId.username,
      receiverName: msg.receiverId.username,
      content: msg.content,
      timestamp: msg.timestamp
    })));
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
};

module.exports = {
  getChatHistory,
  handleSocketConnection,
};
