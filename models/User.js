const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    token: { type: String },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String },
    address: { type: String },
    birthDate: { type: Date, required: true },
    gender: { type: String },
    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    password: { type: String, required: true },
    termsAccepted: { type: Boolean, required: true },
});

module.exports = mongoose.model("User", userSchema);
