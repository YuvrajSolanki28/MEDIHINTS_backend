const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
    token: { type: String },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    clinicAddress: { type: String, required: true },
    yearsOfExperience: { type: Number, required: true },
    specialization: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    password: { type: String, required: true },
    img: { type: String },
});

const Doctor = mongoose.model("Doctor", DoctorSchema);

module.exports = Doctor;