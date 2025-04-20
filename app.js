const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

var cors = require("cors");
app.use(cors());

const port = process.env.PORT || 3000;
const userRoutes = require("./apis/routes/user");
const chatRoutes = require('./apis/routes/message');
const { handleSocketConnection } = require('./apis/controllers/message');


require("dotenv").config();

mongoose.connect(process.env.NGO_URL_HOSTED);

mongoose.connection.on("connected", () => {
  console.log("mongodb connection established successfully");
});
mongoose.connection.on("error", () => {
  console.log("mongodb connection Failed");
  mongoose.connect(process.env.NGO_URL_HOSTED);
});
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors());

// Use body parser middleware to parse body of incoming requests
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log({ body: req.body });
  console.log({ query: req.query });
  console.log({ params: req.params });
  console.log({ params: req.headers });
  next();
});

// Routes which should handle requests
app.use("/api/user", userRoutes);
app.use('/api/chat', chatRoutes);

// Socket.IO connection
io.on('connection', (socket) => handleSocketConnection(socket, io));

app.use("/test", (req, res) => {
  res.json({ message: "API IS WORKING..." });
});

app.use("/api/uploads*", (req, res, next) => {
  try {
    res.sendFile(__dirname + "/uploads" + req.params[0]);
  } catch (error) {
    next();
  }
});

app.use((req, res, next) => {
  const error = new Error();
  error.message = "Not Found";
  error.status = 404;

  next(error);
});

app.use((error, req, res, next) => {
  console.log(error);

  res.status(error.status || 500).json({
    error,
  });
});

module.exports = app;
