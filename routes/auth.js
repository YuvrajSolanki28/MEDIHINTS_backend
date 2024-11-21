// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendVerificationCode } = require("../utils/sendCode");
require('dotenv').config();
const nodemailer = require("nodemailer");

const router = express.Router();

// In-memory storage for verification codes (Use Redis or DB for production)
let verificationCodes = {};

// Signup endpoint
router.post("/signup", async (req, res) => {
    const { fullName, email, contactNumber, address, age, gender, password, termsAccepted } = req.body;

    if (!termsAccepted) {
        return res.status(400).json({ error: "You must accept the terms and conditions" });
    }

    if (!email || !password || !fullName) {
        return res.status(400).json({ error: "All required fields must be provided" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            email,
            contactNumber,
            address,
            age,
            gender,
            password: hashedPassword,
            termsAccepted,
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(201).json({ message: "User registered successfully!", token });
    } catch (error) {
        console.error("Error in signup:", error);
        res.status(500).json({ error: "Server error during signup" });
    }
});

// Login route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Save the token in the user's record
        user.token = token;
        await user.save();

        // Generate and send verification code (optional)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes[email] = code;
        sendVerificationCode(email, code);

        res.status(200).json({
            message: "Login successful. Verification code sent.",
            token,
        });
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ error: "Server error during login" });
    }
});


// Verify code route
router.post("/verify-code", async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
    }

    if (verificationCodes[email] === code) {
        try {
            // Find the user by email
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Generate new JWT token (optional: update token on verification success)
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

            // Save the token to the user's record
            user.token = token;
            await user.save();

            // Clear the verification code after successful verification
            delete verificationCodes[email];

            res.json({ message: "Verification successful. Login complete.", token });
        } catch (error) {
            console.error("Error during verification:", error);
            res.status(500).json({ error: "Server error during verification" });
        }
    } else {
        return res.status(400).json({ error: "Invalid or expired verification code" });
    }
});


// Forgot password route
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        auth: {
            user: process.env.EMAIL_SERVICE,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetLink = `http://localhost:3000/resetpassword/${token}`;

        const mailOptions = {
            from: process.env.EMAIL_SERVICE,
            to: email,
            subject: 'Password Reset',
            html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password.</p>`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
        console.error("Error in forgot password:", error);
        res.status(500).json({ error: "Server error during password reset request" });
    }
});

// Reset password route
router.post('/resetpassword/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ error: "New password is required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Error in reset password:", error);
        res.status(400).json({ error: "Invalid or expired token" });
    }
});

// backend code (user route)
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Ensure that the userId is being queried correctly
        const user = await User.findOne({ userId }); // Use _id if you're using MongoDB's default ObjectId
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error in fetching user profile:", error);
        res.status(500).json({ error: "Server error during user profile fetch" });
    }
});


module.exports = router;
