const EMAIL_PROVIDER = String(process.env.EMAIL_PROVIDER || 'resend').trim().toLowerCase();

const canSendEmail = () =>
  EMAIL_PROVIDER === 'resend' &&
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const sendViaResend = async ({ to, subject, html, text }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const data = await response.text().catch(() => '');
    throw new Error(`Email delivery failed: ${data || response.statusText}`);
  }
};

const sendEmail = async (input) => {
  if (!canSendEmail()) {
    return { delivered: false, skipped: true, reason: 'Email provider not configured' };
  }

  await sendViaResend(input);
  return { delivered: true };
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

module.exports = {
  canSendEmail,
  sendEmail,
  sendApplicationStatusEmail,
};
