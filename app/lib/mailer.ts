import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'demo@ethereal.email',
    pass: process.env.SMTP_PASS || 'demo123',
  },
})

export async function sendOtpEmail(to: string, otp: string) {
  const html = `
    <div style="background-color: #FCF5EE; padding: 32px; font-family: sans-serif; text-align: center; color: #3D1A28;">
      <h1 style="font-family: serif; color: #D83B56; margin-bottom: 16px;">OurCwtch Password Reset</h1>
      <p style="font-size: 16px; margin-bottom: 24px;">Your 6-digit verification code is below. It expires in 10 minutes.</p>
      <div style="background-color: #FFCEE3; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #D83B56; display: inline-block; border-radius: 16px; margin-bottom: 24px;">
        ${otp}
      </div>
      <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
    </div>
  `

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"OurCwtch" <noreply@ourcwtch.app>',
      to,
      subject: 'Your OurCwtch Password Reset Code',
      html,
    })
  } catch (err) {
    console.error('Failed to send OTP email:', err)
  }
}
