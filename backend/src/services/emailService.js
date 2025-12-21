const nodemailer = require("nodemailer");

const sendResetOtpEmail = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Support" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Mã xác nhận đặt lại mật khẩu",
    html: `
      <h2>Đặt lại mật khẩu</h2>
      <p>Mã xác nhận của bạn là:</p>
      <h1 style="color:red">${otp}</h1>
      <p>Mã có hiệu lực trong 5 phút.</p>
    `,
  });
};

module.exports = {
  sendResetOtpEmail,
};
