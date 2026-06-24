const { normalizeSocialsText } = require('./socials');

/**
 * Resolve an r2:// profile image reference into a presigned download URL.
 * Non-R2 values (Base64, https://, empty) are returned as-is.
 */
const resolveProfileImage = async (profileImage) => {
  const raw = String(profileImage || '').trim();
  if (!raw || !raw.startsWith('r2://')) {
    return raw;
  }

  try {
    const { isR2Enabled } = require('../config/r2');
    if (!isR2Enabled()) {
      return '';
    }
    const { generatePresignedDownloadUrl } = require('../services/r2UploadService');
    const objectKey = raw.replace(/^r2:\/\//, '');
    return await generatePresignedDownloadUrl({ objectKey, expiresSeconds: 3600 });
  } catch {
    return '';
  }
};

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  type: user.user_type,
  role: user.role || user.user_type,
  accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
  isPremium: user.is_premium,
  termsAccepted: Boolean(user.terms_accepted),
  termsAcceptedAt: user.terms_accepted_at ? new Date(user.terms_accepted_at).toISOString() : null,
  profileCompleted: Boolean(user.profile_completed),

  bio: user.bio || '',
  socials: normalizeSocialsText(user.socials),
  profileImage: user.profile_image || '',
  phone: user.phone || '',
  address: user.address || '',

  name: user.name || '',
  education: user.education || '',
  vocationalCourse: user.vocational_course || '',
  desiredJob: user.desired_job || '',
  birthday: user.birthday ? new Date(user.birthday).toISOString().slice(0, 10) : '',
  age: user.age == null ? '' : String(user.age),
  sex: user.sex || '',

  companyName: user.company_name || '',
  industry: user.industry || '',
  companySize: user.company_size || '',
  website: user.website || '',
  hiringFor: user.hiring_for || '',
});

/**
 * Async version of serializeUser that resolves r2:// profile images
 * into real presigned download URLs before sending to the frontend.
 */
const serializeUserAsync = async (user) => {
  const serialized = serializeUser(user);
  serialized.profileImage = await resolveProfileImage(serialized.profileImage);
  return serialized;
};

module.exports = {
  serializeUser,
  serializeUserAsync,
  resolveProfileImage,
};
