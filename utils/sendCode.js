const nodemailer = require("nodemailer");
const {Verification_Email_Template} = require("./EmailTemplate")
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVICE,
    pass: process.env.EMAIL_PASSWORD,
  },
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
    from: '"MEDIHINTS" <medihints@gmail.com>',
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is:`,
    html: Verification_Email_Template.replace("{code}",code)
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Verification code sent:", info.response);
    }
  });
};
