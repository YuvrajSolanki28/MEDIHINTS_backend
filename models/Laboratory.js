const mongoose = require("mongoose");

const laboratorySchema = new mongoose.Schema({
    labName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    labLicenseNumber: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    termsAccepted: {
        type: Boolean,
        required: true,
    },
}, { timestamps: true });

const Laboratory = mongoose.model('Laboratory ', laboratorySchema);

module.exports = Laboratory;