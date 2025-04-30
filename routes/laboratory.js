const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Laboratory = require("../models/Laboratory"); 

router.post("/api/signup/laboratory", async (req, res) => {
  try {
    const {
      labName,
      email,
      contactNumber,
      address,
      registrationNumber,
      password,
      termsAccepted,
    } = req.body;

    // Input validation
    if (!termsAccepted) {
      return res.status(400).json({ error: "You must accept the terms and conditions" });
    }

    if (!email || !password || !labName || !contactNumber || !address || !registrationNumber) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    // Contact number validation
    if (!/^\d{10}$/.test(contactNumber)) {
      return res.status(400).json({ error: "Contact number must be exactly 10 digits" });
    }

    // Check if email already exists
    const existingLab = await Laboratory.findOne({ email });
    if (existingLab) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Check if registration number already exists
    const existingRegNumber = await Laboratory.findOne({ registrationNumber });
    if (existingRegNumber) {
      return res.status(400).json({ error: "Registration number is already registered" });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newLab = new Laboratory({
      labName,
      email,
      contactNumber,
      address,
      registrationNumber,
      password: hashedPassword,
      termsAccepted,
    });

    await newLab.save();

    // Generate JWT token
    const token = jwt.sign({ id: newLab._id, role: "laboratory" }, process.env.JWT_SECRET, {
      expiresIn: "1d", // Increased token expiration time for better UX
    });

    res.status(201).json({ 
      message: "Laboratory registered successfully!", 
      token,
      laboratory: {
        id: newLab._id,
        labName: newLab.labName,
        email: newLab.email
      }
    });
  } catch (error) {
    console.error("Error in laboratory signup:", error);
    res.status(500).json({ error: "Server error during laboratory signup" });
  }
});

module.exports = router;