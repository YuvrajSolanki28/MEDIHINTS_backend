const nodemailer = require("nodemailer");
const { Verification_Email_Template } = require("./EmailTemplate");

const port = parseInt(process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
  port: port,
  secure: port === 465, // true if 465
  auth: {
    user: process.env.EMAIL_SERVICE,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Check SMTP connection
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
