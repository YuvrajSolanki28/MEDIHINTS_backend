const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNumber: { type: String },
    address: { type: String },
    age: { type: Number, min: 1, max: 120 },
    gender: { type: String },
    password: { type: String, required: true },
    termsAccepted: { type: Boolean, required: true },
});

// Pre-save hook to generate a unique 5-digit userId
userSchema.pre("save", async function (next) {
    if (!this.userId) {
        try {
            // Generate a unique 5-digit ID
            const randomId = Math.floor(10000 + Math.random() * 90000).toString();

            // Check if this ID already exists in the database
            const existingUser = await mongoose.model("User").findOne({ userId: randomId });

            if (!existingUser) {
                this.userId = randomId;
            } else {
                // Retry if the generated ID is not unique
                return next(new Error("Failed to generate a unique userId. Please try again."));
            }
        } catch (err) {
            return next(err);
        }
    }
    next();
});

module.exports = mongoose.model("User", userSchema);