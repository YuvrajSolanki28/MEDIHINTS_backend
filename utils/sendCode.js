const nodemailer = require("nodemailer");
const { Verification_Email_Template } = require("./EmailTemplate");
require("dotenv").config();

// Create transporter with proper SMTP config
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.EMAIL_SERVICE,      // your Gmail address
    pass: process.env.EMAIL_PASSWORD,     // Gmail App Password
  },
  connectionTimeout: 10000, // optional timeout setting
});

// Optional: verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection failed:", error);
  } else {
    console.log("SMTP connection successful");
  }
});

exports.sendVerificationCode = (email, code) => {
  const mailOptions = {
    from: `"MEDIHINTS" <${process.env.EMAIL_SERVICE}>`,
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is: ${code}`,
    html: Verification_Email_Template.replace("{code}", code),
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Verification code sent:", info.response);
    }
  });
};
