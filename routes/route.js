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

//signup
router.post("/api/signup", async (req, res) => {
    try {
        const { fullName, email, contactNumber, address, birthDate, gender, bloodGroup, password, termsAccepted, } = req.body;

        // Check if terms are accepted
        if (!termsAccepted) {
            return res.status(400).json({ error: "You must accept the terms and conditions" });
        }

        // Validate required fields
        if (!email || !password || !fullName || !contactNumber || !birthDate || !address || !gender || !bloodGroup
        ) {
            return res.status(400).json({ error: "All required fields must be provided" });
        }

        // Check if the email is already registered
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            fullName,
            email,
            contactNumber,
            address,
            birthDate,
            gender,
            bloodGroup,
            password: hashedPassword,
            termsAccepted,
        });

        // Save the new user to the database
        await newUser.save();

        // Generate a JWT token
        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        // Respond with success message and token
        res.status(201).json({ message: "User registered successfully!", token });
    } catch (error) {
        console.error("Error in signup:", error);
        res.status(500).json({ error: "Server error during signup" });
    }
});


//login
router.post("/api/login", async (req, res) => {
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

        // Optional: Generate and send verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes[email] = code;
        sendVerificationCode(email, code);

        res.status(200).json({
            message: "Login successful. Verification code sent.",
            token,
            uid: user._id, // Send UID to the client
        });
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ error: "Server error during login" });
    }
});

// Password change
router.post("/api/change-password", async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    try {
        // Find the user from the database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if the current password is correct
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        user.password = hashedNewPassword;
        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Error during password change:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// Verify code
router.post("/api/verify-code", async (req, res) => {
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


// Forgot password
router.post('/api/forgotpassword', async (req, res) => {
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

// Reset password
router.post('/api/resetpassword/:token', async (req, res) => {
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

// Route to update profile
router.post('/api/update-profile', async (req, res) => {
    const { fullName, email, birthDate, contactNumber, address, bloodGroup } = req.body;
    const token = req.headers['authorization']; // Assuming the token is sent in the Authorization header

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required.' });
    }

    try {
        // Find the user by token
        let user = await User.findOne({ token });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update the user's profile
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.birthDate = birthDate|| user.birthDate;
        user.contactNumber = contactNumber || user.contactNumber;
        user.address = address || user.address;
        user.bloodGroup = bloodGroup || user.bloodGroup;

        // Save the updated profile
        await user.save();
        return res.json({ message: 'Profile updated successfully!', user });

    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ message: 'An error occurred while saving your profile.' });
    }
});

  

//profile
router.get('/api/users/:token', async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).send('Token is required');
    }

    try {
        // Fetch user by token
        const userProfile = await User.findOne({ token });
        if (!userProfile) {
            return res.status(404).send('User not found');
        }

        res.json(userProfile); // Return user data as JSON
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).send('Server error');
    }
});


module.exports = router;