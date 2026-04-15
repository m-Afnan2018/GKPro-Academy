const nodemailer = require("nodemailer");

/* ── Transporter ────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",   // true = 465, false = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ── OTP Email Template ─────────────────────────────── */
function buildOtpHtml({ name, otp, expiryMinutes = 10 }) {
  const digits = String(otp).split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="padding:0 5px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="
                width:62px; height:62px; background:#fff; border:2px solid #E5E7EB;
                border-radius:10px; font-family:'Segoe UI',Arial,sans-serif;
                font-size:28px; font-weight:800; color:#111827;
                text-align:center; vertical-align:middle;
              ">${d}</td>
            </tr>
          </table>
        </td>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password – GKPro Academy</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#C0202F 0%,#D42B3A 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,1);border-radius:12px;padding:10px 20px;margin-bottom:14px;">
                <img
                  src="https://gkproacademy.com/logo.svg"
                  alt="GKPro Academy"
                  width="140"
                  style="display:block;height:auto;border:0;"
                />
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
                <tr>
                  <td style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;
                            text-align:center;vertical-align:middle;font-size:26px;">
                    🔐
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px;">
                Password Reset Request
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">

              <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
                Hi <strong style="color:#111827;">${name}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#6B7280;line-height:1.7;">
                We received a request to reset the password for your GKPro Academy account.
                Use the OTP below to proceed. This code is valid for
                <strong style="color:#111827;">${expiryMinutes} minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#FFF7F7;border:1.5px solid #FECDD3;border-radius:14px;
                          padding:28px 20px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#9CA3AF;
                           text-transform:uppercase;letter-spacing:1.5px;">
                  Your One-Time Password
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0"
                  style="margin:0 auto 16px;">
                  <tr>${digitBoxes}</tr>
                </table>
                <p style="margin:0;font-size:12px;color:#EF4444;font-weight:600;">
                  ⏰ Expires in ${expiryMinutes} minutes
                </p>
              </div>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #F3F4F6;margin:0 0 24px;" />

              <!-- Security Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 16px;">
                    <p style="margin:0;font-size:12.5px;color:#92400E;line-height:1.6;">
                      <strong>Security Notice:</strong> If you did not request a password reset,
                      please ignore this email. Your account password will remain unchanged.
                      Do not share this OTP with anyone.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">
                This email was sent by <strong style="color:#6B7280;">GKPro Academy</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#D1D5DB;">
                © ${new Date().getFullYear()} GKPro Academy. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/* ── Signup Welcome OTP Template ────────────────────── */
function buildSignupOtpHtml({ name, otp, expiryMinutes = 10 }) {
  const digits = String(otp).split("");
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="padding:0 5px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="
                width:62px; height:62px; background:#fff; border:2px solid #E5E7EB;
                border-radius:10px; font-family:'Segoe UI',Arial,sans-serif;
                font-size:28px; font-weight:800; color:#111827;
                text-align:center; vertical-align:middle;
              ">${d}</td>
            </tr>
          </table>
        </td>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email – GKPro Academy</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#C0202F 0%,#D42B3A 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,1);border-radius:12px;padding:10px 20px;margin-bottom:14px;">
                <img
                  src="https://gkproacademy.com/logo.svg"
                  alt="GKPro Academy"
                  width="140"
                  style="display:block;height:auto;border:0;"
                />
              </div>
              <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;
                          margin:0 auto 10px;text-align:center;line-height:56px;">
                <span style="font-size:26px;line-height:56px;">🎓</span>
              </div>
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px;">
                Verify Your Email
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.6;">
                Hi <strong style="color:#111827;">${name}</strong>,
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#6B7280;line-height:1.7;">
                Welcome to GKPro Academy! Use the OTP below to verify your email and complete your registration.
                This code is valid for <strong style="color:#111827;">${expiryMinutes} minutes</strong>.
              </p>

              <!-- OTP Box -->
              <div style="background:#FFF7F7;border:1.5px solid #FECDD3;border-radius:14px;
                          padding:28px 20px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#9CA3AF;
                           text-transform:uppercase;letter-spacing:1.5px;">
                  Your Verification Code
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                  <tr>${digitBoxes}</tr>
                </table>
                <p style="margin:0;font-size:12px;color:#EF4444;font-weight:600;">
                  ⏰ Expires in ${expiryMinutes} minutes
                </p>
              </div>

              <hr style="border:none;border-top:1px solid #F3F4F6;margin:0 0 24px;" />

              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 16px;">
                    <p style="margin:0;font-size:12.5px;color:#92400E;line-height:1.6;">
                      <strong>Didn't create an account?</strong> If you did not sign up for GKPro Academy,
                      please ignore this email. No account will be created.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">
                This email was sent by <strong style="color:#6B7280;">GKPro Academy</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#D1D5DB;">
                © ${new Date().getFullYear()} GKPro Academy. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/* ── Public API ─────────────────────────────────────── */
async function sendOtpEmail({ to, name, otp }) {
  const html = buildOtpHtml({ name, otp });
  await transporter.sendMail({
    from: `"GKPro Academy" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `${otp} is your GKPro Academy password reset OTP`,
    text: `Hi ${name},\n\nYour password reset OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nGKPro Academy`,
    html,
  });
}

async function sendSignupOtpEmail({ to, name, otp }) {
  const html = buildSignupOtpHtml({ name, otp });
  await transporter.sendMail({
    from: `"GKPro Academy" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `${otp} – Verify your GKPro Academy account`,
    text: `Hi ${name},\n\nYour email verification OTP is: ${otp}\n\nThis code expires in 10 minutes.\n\nGKPro Academy`,
    html,
  });
}

module.exports = { sendOtpEmail, sendSignupOtpEmail };