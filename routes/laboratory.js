const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Laboratory = require("../models/Laboratory")
const { sendVerificationCode } = require("../utils/sendCode");
require('dotenv').config();
const nodemailer = require("nodemailer");

const router = express.Router();

// In-memory storage for verification codes (Use Redis or DB for production)
let verificationCodes = {};


//signup for laboratory
router.post("/api/signup/laboratory", async (req, res) => {
    try {
        const { labName, email, contactNumber, address, registrationNumber, password, termsAccepted } = req.body;

        // Check if terms are accepted
        if (!termsAccepted) {
            return res.status(400).json({ error: "You must accept the terms and conditions" });
        }

        // Validate required fields
        if (!email || !password || !labName || !contactNumber || !address || !registrationNumber) {
            return res.status(400).json({ error: "All required fields must be provided" });
        }

        // Check if the email is already registered
        const existingLab = await Laboratory.findOne({ email });
        if (existingLab) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new laboratory
        const newLab = new Laboratory({
            labName,
            email,
            contactNumber,
            address,
            registrationNumber,
            password: hashedPassword,
            termsAccepted,
        });

        // Save the new laboratory to the database
        await newLab.save();

        // Generate a JWT token
        const token = jwt.sign({ id: newLab._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        // Respond with success message and token
        res.status(201).json({ message: "Laboratory registered successfully!", token });
    } catch (error) {
        console.error("Error in laboratory signup:", error);
        res.status(500).json({ error: "Server error during laboratory signup" });
    }
});
