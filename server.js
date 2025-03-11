const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http"); // Add this
const socketIo = require("socket.io"); // Add this
const remixHandlers = require("./socket/remixHandlers"); // Add this

dotenv.config();

const app = express();
const server = http.createServer(app); // Add this
const io = socketIo(server, { // Add this
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/user", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/stems", require("./routes/stems"));
app.use("/api/remix", require("./routes/remix")); // Add this for remix endpoints

// Initialize socket handlers
remixHandlers(io); // Add this

// Change app.listen to server.listen
server.listen(3001, () => console.log("✅ Server running on port 3001"));
