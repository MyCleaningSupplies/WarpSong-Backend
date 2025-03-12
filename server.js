const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const remixHandlers = require("./socket/RemixHandlers");
const path = require("path");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://warpsong.vercel.app",
];

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add this line to serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/user", require("./routes/user"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/qrcode", require("./routes/qrcode"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/stems", require("./routes/stems"));
app.use("/api/remix", require("./routes/remix"));
app.use("/api/mashup", require("./routes/mashup"));
app.use("/api/gamification", require("./routes/gamification")); // Add this line

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize socket handlers
remixHandlers(io);

server.listen(3001, () => console.log("✅ Server running on port 3001"));
