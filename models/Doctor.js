const mongoose = require('mongoose');

// Define the Doctor Schema
const doctorSchema = new mongoose.Schema({
    doctorName: {
        type: String,
        required: true, // Make it mandatory
        trim: true,     // Removes whitespace
    },
    contactNumber: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/, // Regular expression for a 10-digit number
    },
    presentTime: {
        type: String,
        required: true,
        trim: true,
    },
    department: {
        type: String,
        required: true,
        trim: true,
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt timestamps
});

// Create the Doctor Model
const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
