const nodemailer = require("nodemailer");
const { Verification_Email_Template } = require("./EmailTemplate");

const port = parseInt(process.env.SMTP_PORT); // Parse once

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.gmail.com
  port: port,
  secure: port === 465, // true if SSL
  auth: {
    user: process.env.EMAIL_SERVICE,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Remove transporter.verify — causes issues on serverless

exports.sendVerificationCode = (email, code) => {
  const mailOptions = {
    from: `"MEDIHINTS" <${process.env.EMAIL_SERVICE}>`,
    to: email,
    subject: "Your Verification Code",
    html: Verification_Email_Template.replace("{code}", code),
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Error sending email:", error);
    } else {
      console.log("✅ Verification code sent:", info.response);
    }
  });
};
