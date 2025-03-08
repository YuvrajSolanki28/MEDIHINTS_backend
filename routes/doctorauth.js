const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor")
const { sendVerificationCode } = require("../utils/sendCode");
require('dotenv').config();
const nodemailer = require("nodemailer");

const router = express.Router();

// In-memory storage for verification codes (Use Redis or DB for production)
let verificationCodes = {};

// Doctor Signup Route
router.post("/api/doctor/signup", async (req, res) => {
    try {
        const {
            fullName,
            email,
            contactNumber,
            clinicAddress,
            yearsOfExperience,
            specialization,
            licenseNumber,
            password,
            termsAccepted,
        } = req.body;

        // Check if terms are accepted
        if (!termsAccepted) {
            return res.status(400).json({ error: "You must accept the terms and conditions" });
        }

        // Validate required fields
        if (
            !fullName ||
            !email ||
            !contactNumber ||
            !clinicAddress ||
            !yearsOfExperience ||
            !specialization ||
            !licenseNumber ||
            !password
        ) {
            return res.status(400).json({ error: "All required fields must be provided" });
        }

        // Check if the email is already registered
        const existingDoctor = await Doctor.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new doctor
        const newDoctor = new Doctor({
            fullName,
            email,
            contactNumber,
            clinicAddress,
            yearsOfExperience,
            specialization,
            licenseNumber,
            password: hashedPassword,
            termsAccepted,
        });

        // Save the new doctor to the database
        await newDoctor.save();

        // Generate a JWT token
        const token = jwt.sign({ id: newDoctor._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        // Respond with success message and token
        res.status(201).json({ message: "Doctor registered successfully!", token });
    } catch (error) {
        console.error("Error in doctor signup:", error);
        res.status(500).json({ error: "Server error during signup" });
    }
});


//login
router.post("/api/login/doctor", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        // Check if the doctor exists
        const doctors = await Doctor.findOne({ email });
        if (!doctors) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, doctors.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign({ id: doctors._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Save the token in the doctor's record
        doctors.token = token;
        await doctors.save();

        // Optional: Generate and send verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes[email] = code;
        sendVerificationCode(email, code);

        res.status(200).json({
            message: "Login successful. Verification code sent.",
            token,
            uid: doctors._id, // Send UID to the client
        });
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ error: "Server error during login" });
    }
  });

 
  // Send verification code for doctor
router.post("/api/verify-code/doctor", async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
    }

    if (verificationCodes[email] === code) {
        try {
            // Find the doctor by email
            const doctor = await Doctor.findOne({ email });
            if (!doctor) {
                return res.status(404).json({ error: "doctor not found" });
            }

            // Generate new JWT token (optional: update token on verification success)
            const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

            // Save the token to the doctor's record
            doctor.token = token;
            await doctor.save();

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

// Password change
router.post("/api/change-password/doctor", async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;

    try {
        // Find the doctor from the database
        const doctor = await Doctor.findOne({ username });
        if (!doctor) {
            return res.status(404).json({ message: "doctor not found" });
        }

        // Check if the current password is correct
        const isPasswordValid = await bcrypt.compare(currentPassword, doctor.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the doctor's password in the database
        doctor.password = hashedNewPassword;
        await doctor.save();

        res.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Error during password change:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Forgot password
router.post('/api/forgotpassword/doctor', async (req, res) => {
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
        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetLink = `http://localhost:3000/doctor_resetpassword/doctor/${token}`;

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
router.post('/api/resetpassword/doctor/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ error: "New password is required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const doctor = await Doctor.findById(decoded.id);
        if (!doctor) {
            return res.status(404).json({ error: "doctor not found" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        doctor.password = hashedPassword;
        await doctor.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Error in reset password:", error);
        res.status(400).json({ error: "Invalid or expired token" });
    }
});

// update profile
router.post('/api/update-profile/doctor', async (req, res) => {
    const { fullName, email, clinicAddress, contactNumber, yearsOfExperience, specialization, licenseNumber } = req.body;
    const token = req.headers['authorization']; 

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required.' });
    }

    try {
        // Find the doctor by token
        let doctor = await Doctor.findOne({ token });

        if (!doctor) {
            return res.status(404).json({ message: 'doctor not found.' });
        }

        // Update the doctor's profile
        doctor.fullName = fullName || doctor.fullName;
        doctor.email = email || doctor.email;
        doctor.clinicAddress = clinicAddress|| doctor.clinicAddress;
        doctor.contactNumber = contactNumber || doctor.contactNumber;
        doctor.yearsOfExperience = yearsOfExperience || doctor.yearsOfExperience;
        doctor.specialization = specialization || doctor.specialization;
        doctor.licenseNumber = licenseNumber || doctor.licenseNumber;

        // Save the updated profile
        await doctor.save();
        return res.json({ message: 'Profile updated successfully!', doctor });

    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ message: 'An error occurred while saving your profile.' });
    }
});

//profile
router.get('/api/doctor/:token', async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).send('Token is required');
    }

    try {
        // Fetch doctor by token
        const doctorProfile = await Doctor.findOne({ token });
        if (!doctorProfile) {
            return res.status(404).send('doctor not found');
        }

        res.json(doctorProfile); // Return doctor data as JSON
    } catch (error) {
        console.error("Error fetching doctor:", error);
        res.status(500).send('Server error');
    }
});

// logout
router.post('/api/doctor/logout', async (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is required to log out.' });
    }
    try {
        const doctor = await Doctor.findOne({ token });

        if (!doctor) {
            return res.status(404).json({ message: 'doctor not found.' });
        }

        doctor.token = null;
        await doctor.save();

        res.json({ message: 'Logged out successfully.' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Server error during logout.' });
    }
});

module.exports = router;