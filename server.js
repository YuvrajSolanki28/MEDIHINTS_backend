// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/patientauth");
const adminRoutes = require("./routes/adminauth");
const doctorRoutes = require("./routes/doctorauth");




dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use(authRoutes);
app.use(adminRoutes);
app.use(doctorRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
