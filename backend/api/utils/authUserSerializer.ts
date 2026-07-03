const { normalizeSocialsText } = require('./socials');

/**
 * Resolve an r2:// profile image reference into a presigned download URL.
 * Non-R2 values (Base64, https://, empty) are returned as-is.
 */
const resolveProfileImage = async (profileImage: unknown): Promise<string> => {
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

interface UserRow {
  id: unknown;
  username: unknown;
  email: unknown;
  user_type: unknown;
  role?: unknown;
  account_type?: unknown;
  is_premium: unknown;
  terms_accepted: unknown;
  terms_accepted_at?: unknown;
  profile_completed: unknown;
  bio?: unknown;
  socials?: unknown;
  profile_image?: unknown;
  phone?: unknown;
  address?: unknown;
  name?: unknown;
  education?: unknown;
  vocational_course?: unknown;
  desired_job?: unknown;
  birthday?: unknown;
  age?: unknown;
  sex?: unknown;
  company_name?: unknown;
  industry?: unknown;
  company_size?: unknown;
  website?: unknown;
  hiring_for?: unknown;
}

interface SerializedUser {
  id: unknown;
  username: unknown;
  email: unknown;
  type: unknown;
  role: unknown;
  accountType: string;
  isPremium: unknown;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  profileCompleted: boolean;
  bio: string;
  socials: string;
  profileImage: string;
  phone: string;
  address: string;
  name: string;
  education: string;
  vocationalCourse: string;
  desiredJob: string;
  birthday: string;
  age: string;
  sex: string;
  companyName: string;
  industry: string;
  companySize: string;
  website: string;
  hiringFor: string;
}

const serializeUser = (user: UserRow): SerializedUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  type: user.user_type,
  role: user.role || user.user_type,
  accountType: user.account_type ? String(user.account_type) : (user.user_type === 'company' ? 'company' : 'developer'),
  isPremium: user.is_premium,
  termsAccepted: Boolean(user.terms_accepted),
  termsAcceptedAt: user.terms_accepted_at ? new Date(user.terms_accepted_at as string | number).toISOString() : null,
  profileCompleted: Boolean(user.profile_completed),

  bio: String(user.bio || ''),
  socials: normalizeSocialsText(user.socials),
  profileImage: String(user.profile_image || ''),
  phone: String(user.phone || ''),
  address: String(user.address || ''),

  name: String(user.name || ''),
  education: String(user.education || ''),
  vocationalCourse: String(user.vocational_course || ''),
  desiredJob: String(user.desired_job || ''),
  birthday: user.birthday ? new Date(user.birthday as string | number).toISOString().slice(0, 10) : '',
  age: user.age == null ? '' : String(user.age),
  sex: String(user.sex || ''),

  companyName: String(user.company_name || ''),
  industry: String(user.industry || ''),
  companySize: String(user.company_size || ''),
  website: String(user.website || ''),
  hiringFor: String(user.hiring_for || ''),
});

/**
 * Async version of serializeUser that resolves r2:// profile images
 * into real presigned download URLs before sending to the frontend.
 */
const serializeUserAsync = async (user: UserRow): Promise<SerializedUser> => {
  const serialized = serializeUser(user);
  serialized.profileImage = await resolveProfileImage(serialized.profileImage);
  return serialized;
};

module.exports = {
  serializeUser,
  serializeUserAsync,
  resolveProfileImage,
};
