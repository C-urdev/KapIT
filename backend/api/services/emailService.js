const getFromAddress = () => String(process.env.EMAIL_FROM || '').trim();
const escapeHtml = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const formatPhp = (amount) => `PHP ${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
    <div style="margin:0;background:#f4f7f3;padding:24px 12px;font-family:Arial,sans-serif;color:#1f2937;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #dde5d8;border-radius:14px;overflow:hidden;">
        <div style="background:linear-gradient(120deg,#3a5a40,#588157);padding:18px 22px;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.08em;opacity:0.9;">KAPIT SECURITY</div>
          <h2 style="margin:6px 0 0 0;font-size:22px;line-height:1.3;">Your verification code</h2>
        </div>
        <div style="padding:22px;">
          <p style="margin:0 0 10px 0;">Use this one-time code to continue your request.</p>
          <div style="margin:14px 0 16px 0;padding:14px 16px;border:1px dashed #b6c7aa;background:#f8fbf6;border-radius:10px;text-align:center;">
            <span style="font-size:34px;font-weight:700;letter-spacing:0.34em;color:#2f4b34;">${escapeHtml(code)}</span>
          </div>
          <p style="margin:0 0 6px 0;font-size:14px;">Expires in <strong>${escapeHtml(expiresInMinutes)} minutes</strong>.</p>
          <p style="margin:0;font-size:13px;color:#4b5563;">If this was not you, ignore this email. Never share this code.</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

const sendUserPremiumPaymentEmail = async ({
  to,
  fullName,
  planLabel,
  amount,
  actualPaidAmount,
  originalPlanAmount,
  isDemoPayment = false,
  durationLabel,
  paidAt,
  provider,
}) => {
  if (!to) {
    return { delivered: false, skipped: true, reason: 'No recipient email' };
  }

  const safePlan = String(planLabel || 'Premium').trim() || 'Premium';
  const safeDuration = String(durationLabel || 'subscription').trim() || 'subscription';
  const chargedAmount = Number(actualPaidAmount != null ? actualPaidAmount : amount || 0);
  const planAmount = Number(originalPlanAmount != null ? originalPlanAmount : amount || 0);
  const subjectPrefix = isDemoPayment ? 'KapIT DEMO receipt' : 'KapIT receipt';
  const subject = `${subjectPrefix}: ${safePlan} (${formatPhp(chargedAmount)})`;
  const greeting = String(fullName || '').trim() || 'there';
  const safeProvider = String(provider || '').trim().toUpperCase() || 'PAYMENT';
  const paidText = paidAt ? new Date(paidAt).toLocaleString('en-PH') : new Date().toLocaleString('en-PH');
  const demoLine = isDemoPayment
    ? `Demo note: This was a demo payment charge (${formatPhp(chargedAmount)}). Original plan amount is ${formatPhp(planAmount)}.`
    : null;

  const text = [
    `Hi ${greeting},`,
    '',
    `Your KapIT premium purchase was successful.${isDemoPayment ? ' [DEMO PAYMENT]' : ''}`,
    `Plan: ${safePlan}`,
    `Duration: ${safeDuration}`,
    `Charged amount: ${formatPhp(chargedAmount)}`,
    ...(isDemoPayment ? [`Original plan amount: ${formatPhp(planAmount)}`] : []),
    `Provider: ${safeProvider}`,
    `Paid at: ${paidText}`,
    ...(demoLine ? ['', demoLine] : []),
    '',
    `Thank you for upgrading to KapIT Premium.`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;">
      <h2 style="color:#3a5a40;">Premium purchase confirmed</h2>
      ${isDemoPayment ? '<p style="color:#92400e;background:#fff7ed;border:1px solid #fed7aa;padding:8px 10px;border-radius:8px;"><strong>DEMO PAYMENT</strong>: This payment was processed in demo pricing mode.</p>' : ''}
      <p>Hi ${escapeHtml(greeting)}, your payment was completed successfully.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #dbe7d3;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Plan</td><td style="padding:10px;border-bottom:1px solid #e5ece0;"><strong>${escapeHtml(safePlan)}</strong></td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Duration</td><td style="padding:10px;border-bottom:1px solid #e5ece0;">${escapeHtml(safeDuration)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Charged amount</td><td style="padding:10px;border-bottom:1px solid #e5ece0;"><strong>${escapeHtml(formatPhp(chargedAmount))}</strong></td></tr>
        ${isDemoPayment ? `<tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Original plan amount</td><td style="padding:10px;border-bottom:1px solid #e5ece0;">${escapeHtml(formatPhp(planAmount))}</td></tr>` : ''}
        <tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Provider</td><td style="padding:10px;border-bottom:1px solid #e5ece0;">${escapeHtml(safeProvider)}</td></tr>
        <tr><td style="padding:10px;">Paid at</td><td style="padding:10px;">${escapeHtml(paidText)}</td></tr>
      </table>
      <p style="margin-top:14px;">Thank you for choosing KapIT.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

const sendCompanyJobPostPaymentEmail = async ({
  to,
  companyName,
  jobTitle,
  planLabel,
  amount,
  actualPaidAmount,
  originalPlanAmount,
  isDemoPayment = false,
  durationLabel,
  paidAt,
  provider,
}) => {
  if (!to) {
    return { delivered: false, skipped: true, reason: 'No recipient email' };
  }

  const safeCompany = String(companyName || '').trim() || 'your company';
  const safeTitle = String(jobTitle || '').trim() || 'Untitled job';
  const safePlan = String(planLabel || 'Job posting').trim() || 'Job posting';
  const safeDuration = String(durationLabel || 'listing').trim() || 'listing';
  const chargedAmount = Number(actualPaidAmount != null ? actualPaidAmount : amount || 0);
  const planAmount = Number(originalPlanAmount != null ? originalPlanAmount : amount || 0);
  const safeProvider = String(provider || '').trim().toUpperCase() || 'PAYMENT';
  const paidText = paidAt ? new Date(paidAt).toLocaleString('en-PH') : new Date().toLocaleString('en-PH');
  const subjectPrefix = isDemoPayment ? 'KapIT DEMO receipt' : 'KapIT receipt';
  const subject = `${subjectPrefix}: ${safePlan} for "${safeTitle}"`;

  const text = [
    `Hello ${safeCompany},`,
    '',
    `Your job post payment was successful.${isDemoPayment ? ' [DEMO PAYMENT]' : ''}`,
    `Job: ${safeTitle}`,
    `Plan: ${safePlan}`,
    `Duration: ${safeDuration}`,
    `Charged amount: ${formatPhp(chargedAmount)}`,
    ...(isDemoPayment ? [`Original plan amount: ${formatPhp(planAmount)}`] : []),
    `Provider: ${safeProvider}`,
    `Paid at: ${paidText}`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;">
      <h2 style="color:#3a5a40;">Job post payment confirmed</h2>
      ${isDemoPayment ? '<p style="color:#92400e;background:#fff7ed;border:1px solid #fed7aa;padding:8px 10px;border-radius:8px;"><strong>DEMO PAYMENT</strong>: This payment was processed in demo pricing mode.</p>' : ''}
      <p>Hello ${escapeHtml(safeCompany)}, your payment was completed.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #dbe7d3;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Job</td><td style="padding:10px;border-bottom:1px solid #e5ece0;"><strong>${escapeHtml(safeTitle)}</strong></td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Plan</td><td style="padding:10px;border-bottom:1px solid #e5ece0;">${escapeHtml(safePlan)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Duration</td><td style="padding:10px;border-bottom:1px solid #e5ece0;">${escapeHtml(safeDuration)}</td></tr>
        <tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Charged amount</td><td style="padding:10px;border-bottom:1px solid #e5ece0;"><strong>${escapeHtml(formatPhp(chargedAmount))}</strong></td></tr>
        ${isDemoPayment ? `<tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Original plan amount</td><td style="padding:10px;border-bottom:1px solid #e5ece0;">${escapeHtml(formatPhp(planAmount))}</td></tr>` : ''}
        <tr><td style="padding:10px;border-bottom:1px solid #e5ece0;">Provider</td><td style="padding:10px;border-bottom:1px solid #e5ece0;">${escapeHtml(safeProvider)}</td></tr>
        <tr><td style="padding:10px;">Paid at</td><td style="padding:10px;">${escapeHtml(paidText)}</td></tr>
      </table>
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
  sendUserPremiumPaymentEmail,
  sendCompanyJobPostPaymentEmail,
};
