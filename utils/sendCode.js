const nodemailer = require("nodemailer");
const { Verification_Email_Template } = require("./EmailTemplate")
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVICE,
    pass: process.env.EMAIL_PASSWORD,
  },
   pool: true, // Enable connection pooling
  maxConnections: 5, // Limit connections
  maxMessages: 10, // Limit messages per connection
  logger: true, // Enable logging for debugging
  debug: true, // Enable debugging output
});

exports.sendVerificationCode = (email, code) => {
  const mailOptions = {
    from: '"MEDIHINTS" <medihints28@gmail.com>',
    to: email,
    subject: "Your Verification Code",
    text: `Your verification code is:`,
    html: Verification_Email_Template.replace("{code}", code)
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Error sending email:", error);
    } else {
      console.log("✅Verification code sent:", info.response);
    }
  });
};
