const express = require("express");
const Users = require("../models/User");
const Laboratory = require("../models/Laboratory");
const Appointment = require("../models/Appoinment");
const Doctor = require("../models/Doctor")

const router = express.Router();

// Admin login
// Predefined admin credentials
const ADMIN_EMAIL = "medihints@gmail.com";
const ADMIN_PASSWORD = "medihints1234";

// API to handle login
router.post('/api/adminlogin', (req, res) => {
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return res.status(200).json({ message: "Login successful", isAdmin: true });
    } else {
        return res.status(401).json({ message: "Invalid credentials" });
    }
});

// fetch user
router.get('/api/user', async (req, res) => {
    try {
        const datafetch = await Users.find();
        res.send({ status: "ok", data: datafetch });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// fetch laboratory
router.get('/api/laboratory', async (req, res) => {
    try {
        const datafetch = await Laboratory.find();
        res.send({ status: "ok", data: datafetch });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// fetch doctor
router.get('/api/doctor', async (req, res) => {
    try {
        const datafetch = await Doctor.find();
        res.send({ status: "ok", data: datafetch });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// fetch appointment
router.get('/api/appointment', async (req, res) => {
    try {
        const datafetch = await Appointment.find();
        res.send({ status: "ok", data: datafetch });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Update Endpoint
router.put('/api/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const update = req.body;
        const Model = { users: Users, laboratory: Laboratory, doctor: Doctor, appointment: Appointment }[table.toLowerCase()];
        if (!Model) return res.status(400).send({ message: 'Invalid table name' });

        const updatedRecord = await Model.findByIdAndUpdate(id, update, { new: true });
        if (!updatedRecord) {
            return res.status(404).json({ message: `${table} not found` });
        }

        res.send({ status: "ok", data: updatedRecord });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Delete Endpoint
router.delete('/api/delete/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const Model = {user: Users, laboratory: Laboratory, doctor: Doctor, appointment: Appointment }[table];
        if (!Model) return res.status(400).send({ message: 'Invalid table name' });

        await Model.findByIdAndDelete(id);
        res.send({ status: "ok", message: 'Record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// DELETE endpoint to remove a user
router.delete('/api/delete/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await Users.findByIdAndDelete(id); // Adjust this based on your DB setup
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully', deletedUser });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user
router.put('/api/update/user/:id', async (req, res) => {
    try {
        const updatedUser = await Users.findByIdAndUpdate(req.params._id, req.body, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User updated successfully", data: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// API endpoint to search user by email
router.get('/api/search', async (req, res) => {
    const { email } = req.query; // Get email from query params
    try {
        const user = await Users.findOne({ email });
        if (user) {
            res.json(user);
        } else {
            res.status(404).send({ message: "User not found" });
        }
    } catch (err) {
        res.status(500).send({ message: "Internal server error" });
    }
});

module.exports = router;