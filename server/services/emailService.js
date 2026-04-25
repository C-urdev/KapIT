const getFromAddress = () => String(process.env.EMAIL_FROM || '').trim();

const canSendEmail = () => {
  return Boolean(process.env.RESEND_API_KEY && getFromAddress());
};

const sendViaResend = async ({ to, subject, html, text }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const data = await response.text().catch(() => '');
    throw new Error(`Resend delivery failed: ${data || response.statusText}`);
  }
};

const sendEmail = async (input) => {
  if (!canSendEmail()) {
    return { delivered: false, skipped: true, reason: 'Resend is not configured' };
  }

  await sendViaResend(input);
  return { delivered: true, provider: 'resend' };
};

const sendApplicationStatusEmail = async ({
  to,
  candidateName,
  jobTitle,
  companyLabel,
  status,
}) => {
  if (!to) {
    return { delivered: false, skipped: true, reason: 'No recipient email' };
  }

  const normalizedStatus = String(status || '').trim().toLowerCase();
  const subject =
    normalizedStatus === 'accepted'
      ? `KapIT: You were accepted for ${jobTitle}`
      : `KapIT: Application update for ${jobTitle}`;

  const text = normalizedStatus === 'accepted'
    ? `${companyLabel} accepted ${candidateName || 'your'} application for ${jobTitle}.`
    : `${companyLabel} updated your application for ${jobTitle} to ${normalizedStatus}.`;

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">
      <h2 style="color:#3a5a40;">Application update</h2>
      <p>${text}</p>
      <p>Sign in to KapIT to review the latest hiring updates.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

const sendPasswordResetEmail = async ({ to, resetLink, expiresInMinutes = 15 }) => {
  if (!to) {
    return { delivered: false, skipped: true, reason: 'No recipient email' };
  }

  const subject = 'KapIT password reset request';
  const text = [
    'We received a request to reset your KapIT password.',
    `Reset your password here: ${resetLink}`,
    `This link expires in ${expiresInMinutes} minutes.`,
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;">
      <h2 style="color:#3a5a40;">Reset your KapIT password</h2>
      <p>We received a request to reset your password.</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#3a5a40;color:#fff;text-decoration:none;border-radius:6px;">
          Reset password
        </a>
      </p>
      <p>If the button does not work, copy this URL:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link expires in <strong>${expiresInMinutes} minutes</strong>.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

const sendOtpEmail = async ({ to, code, expiresInMinutes = 10 }) => {
  if (!to) {
    return { delivered: false, skipped: true, reason: 'No recipient email' };
  }

  const subject = 'Your KapIT verification code';
  const text = [
    `Your KapIT password reset code is: ${code}`,
    `This code expires in ${expiresInMinutes} minutes.`,
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:480px;margin:0 auto;">
      <h2 style="color:#3a5a40;">Verify your identity</h2>
      <p>Use the code below to reset your KapIT password.</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:10px;padding:16px 24px;background:#f5f5f2;border-radius:8px;text-align:center;color:#3a5a40;margin:16px 0;">
        ${code}
      </div>
      <p>This code expires in <strong>${expiresInMinutes} minutes</strong>.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

module.exports = {
  canSendEmail,
  sendEmail,
  sendApplicationStatusEmail,
  sendPasswordResetEmail,
  sendOtpEmail,
};
