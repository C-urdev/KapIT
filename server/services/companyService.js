const crypto = require('crypto');

const getOrCreateCompanyForUserId = async (client, userId) => {
  const existing = await client.query('SELECT * FROM companies WHERE user_id = $1', [userId]);
  if (existing.rows.length) {
    return existing.rows[0];
  }

  const userResult = await client.query('SELECT id, username, company_name, profile_image, bio, address, website FROM users WHERE id = $1', [
    userId,
  ]);
  if (!userResult.rows.length) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];
  const name = user.company_name || user.username || 'Company';

  const created = await client.query(
    `INSERT INTO companies (id, user_id, name, logo, description, location, website)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [crypto.randomUUID(), userId, name, user.profile_image || null, user.bio || null, user.address || null, user.website || null]
  );

  return created.rows[0];
};

const normalizeSkills = (skills) => {
  if (!skills) {
    return [];
  }
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean).slice(0, 30);
  }
  if (typeof skills === 'string') {
    return skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
      .slice(0, 30);
  }
  return [];
};

const normalizeRelatedCompanies = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      name: String(item?.name || '').trim(),
      shortDescription: String(item?.shortDescription || '').trim(),
      website: String(item?.website || '').trim(),
    }))
    .filter((item) => item.name)
    .slice(0, 12);
};

const serializeJobRow = (row) => ({
  ...row,
  applicant_count: Number(row?.applicant_count || 0),
  pay_per_use_fee: Number(row?.pay_per_use_fee || 0),
  posting_plan_duration_days: row?.posting_plan_duration_days == null ? null : Number(row.posting_plan_duration_days),
  posting_plan_price: row?.posting_plan_price == null ? null : Number(row.posting_plan_price),
});

module.exports = {
  getOrCreateCompanyForUserId,
  normalizeSkills,
  normalizeRelatedCompanies,
  serializeJobRow,
};
