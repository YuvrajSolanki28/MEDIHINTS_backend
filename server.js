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
const PORT = 3000;

// Connect to MongoDB
connectDB();

//configer cors
const corsOptions = {
    origin: process.env.FRONTEND_URL, // Replace with your frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.use(authRoutes);
app.use(adminRoutes);
app.use(doctorRoutes);

app.get("/",(req, res) => {
    res.send("API is running...");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
