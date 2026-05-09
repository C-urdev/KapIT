const { normalizeSocialsText } = require('./socials');

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

module.exports = {
  serializeUser,
};
