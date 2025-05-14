const nodemailer = require("nodemailer");
const { Verification_Email_Template } = require("./EmailTemplate")
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVICE,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true, // Add this
  logger: true, // And this
});

exports.sendVerificationCode = (email, code) => {
  const mailOptions = {
    from: '"MEDIHINTS" <medihints@gmail.com>',
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is:`,
    html: Verification_Email_Template.replace("{code}", code)
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Error sending email:", error);
    } else {
      console.log("✅ Verification code sent:", info.response);
    }
  });
};
