const mongoose = require("mongoose");

const laboratorySchema = new mongoose.Schema({
    labName: { type: String, required: true },
    location: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String, required: true },
    time: { type: String, required: true },
    pincode: { type: String, required: true },
    testTypes: [{ type: String, required: true }],
});

const Laboratory = mongoose.model('Laboratory ', laboratorySchema);

module.exports = Laboratory;