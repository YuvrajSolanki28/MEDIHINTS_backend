const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendVerificationCode } = require("../utils/sendCode");

// Mock user database
const users = [{ email: "user@example.com", password: "$2a$10$examplehashedpassword" }];
let verificationCodes = {}; // Store codes temporarily

// Login handler
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((user) => user.email === email);

  if (!user) return res.status(400).json({ message: "User not found" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log('isPasswordValid ->>',isPasswordValid)
  if (!isPasswordValid) return res.status(400).json({ message: "Invalid credentials" });

  // Generate and send verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;
  sendVerificationCode(email, code);

  res.json({ message: "Verification code sent" });
};

// Verify code handler
exports.verifyCode = (req, res) => {
  const { email, code } = req.body;
  if (verificationCodes[email] === code) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    delete verificationCodes[email]; // Clear the code after successful login
    res.json({ message: "Login successful", token });
  } else {
    res.status(400).json({ message: "Invalid code" });
  }
};
