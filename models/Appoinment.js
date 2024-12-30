const mongoose = require("mongoose");

const appoinmentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String },
    address: { type: String },
    birthDate: { type: Date, required: true },
    gender: { type: String },
    time: { type: String, required: true }, 
    doctor: { type: String, required: true },
    department: { type: String, required: true },
    messageBox: { type: String },
});

const Appoinment = mongoose.model('Appoinment ', appoinmentSchema);

module.exports = Appoinment;