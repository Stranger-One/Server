import { createTransport } from 'nodemailer';

const transporter = createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendMail({ to, subject, html, text }) {
  const info = await transporter.sendMail({
    from: `"No-Reply" ${process.env.PROJECT_NAME} - <${process.env.EMAIL_USER_EMAIL}>`,
    to,
    subject,
    text,
    html
  });
  console.log('Mail sent:', info);
  console.log('Mail sent:', info.messageId);
}

