const { Resend } = require('resend');
const { Verification_Email_Template } = require("./EmailTemplate");
require('dotenv').config();

console.log("inside mail util");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendVerificationCode = async (email, code) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `"MEDIHINTS" <${process.env.FROM_EMAIL}>`,
      to: [email],
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`,
      html: Verification_Email_Template.replace("{code}", code),
    });

    if (error) {
      console.error("❌ Error sending email:", error);
    } else {
      console.log("✅ Verification code sent:", data);
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
};
