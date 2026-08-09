const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { ensureBaseTestEnv } = require('./testEnv.ts');

ensureBaseTestEnv();

const serverRoot = path.resolve(__dirname, '..');

const clearServerModuleCache = () => {
  Object.keys(require.cache).forEach((key) => {
    if (key.startsWith(serverRoot)) {
      delete require.cache[key];
    }
  });
};

const mockServerModule = (relativePath, exportsValue) => {
  const modulePath = require.resolve(path.join(serverRoot, relativePath));
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: exportsValue,
  } as unknown as NodeJS.Module;
};

const createAuthSessionServiceMock = () => ({
  ACCESS_COOKIE_NAME: 'kapit_access_token',
  REFRESH_COOKIE_NAME: 'kapit_refresh_token',
  CSRF_COOKIE_NAME: 'kapit_csrf_token',
  getTokenPayload: (user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    userType: user.user_type,
    role: user.role || user.user_type,
    accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
  }),
  signAccessToken: (user) =>
    jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        userType: user.user_type,
        role: user.role || user.user_type,
        accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
      },
      process.env.JWT_SECRET,
      { expiresIn: '20m' }
    ),
  attachSessionCookies: async () => ({ csrfToken: 'csrf-test-token' }),
  clearSessionCookies: () => {},
  verifyRefreshTokenSession: async () => {
    throw new Error('refresh not available in test');
  },
  revokeSessionById: async () => {},
  revokeSessionByToken: async () => {},
});

const createDeveloperProfilePoolMock = () => {
  const users = [
    {
      id: 'dev-locked-1',
      username: 'locked_user',
      email: 'locked@example.com',
      password: 'hashed',
      user_type: 'employee',
      account_type: 'developer',
      role: 'employee',
      is_premium: false,
      profile_completed: true,
      bio: 'old bio',
      socials: '',
      profile_image: '',
      phone: '09990000000',
      address: 'Old Address',
      name: 'Locked Name',
      education: 'Old Education',
      desired_job: 'Old Role',
      created_at: new Date().toISOString(),
    },
    {
      id: 'dev-new-1',
      username: 'new_user',
      email: 'new@example.com',
      password: 'hashed',
      user_type: 'employee',
      account_type: 'developer',
      role: 'employee',
      is_premium: false,
      profile_completed: false,
      bio: '',
      socials: '',
      profile_image: '',
      phone: '',
      address: '',
      name: '',
      education: '',
      desired_job: '',
      created_at: new Date().toISOString(),
    },
  ];

  const developerProfiles = new Map();

  const client = {
    query: async (sql, params = []) => {
      const normalized = String(sql).replace(/\s+/g, ' ').trim();

      if (normalized === 'SELECT * FROM users WHERE id = $1') {
        const row = users.find((entry) => entry.id === params[0]);
        return { rows: row ? [row] : [] };
      }

      if (normalized.startsWith('UPDATE users SET') && normalized.includes('WHERE id = $10')) {
        const [
          username,
          fullName,
          location,
          phoneNumber,
          profileImage,
          preferredRole,
          educationAttainment,
          aboutMe,
          socials,
          userId,
        ] = params;
        const row = users.find((entry) => entry.id === userId);
        if (!row) {
          return { rows: [] };
        }
        row.username = username;
        row.name = fullName;
        row.address = location;
        row.phone = phoneNumber;
        row.profile_image = profileImage ? profileImage : row.profile_image;
        row.desired_job = preferredRole;
        row.education = educationAttainment;
        row.bio = aboutMe;
        row.socials = socials || '';
        row.account_type = row.account_type || 'developer';
        row.profile_completed = true;
        return { rows: [row] };
      }

      if (normalized.startsWith('INSERT INTO developer_profiles')) {
        const [
          userId,
          fullName,
          username,
          location,
          phoneNumber,
          email,
          jobTitle,
          experienceYears,
          skills,
          preferredRole,
          preferredRoles,
          education,
          bio,
          github,
          portfolio,
          linkedin,
          resumeUrl,
          profilePhotoUrl,
          otherLinks,
          workPreference,
          activelyLooking,
          roleCategories,
          jobPriorities,
          salaryExpectationMin,
          salaryExpectationMax,
          jobSearchGoal,
          experienceLevel,
          certifications,
          school,
        ] = params;
        developerProfiles.set(userId, {
          user_id: userId,
          full_name: fullName,
          username,
          location,
          phone_number: phoneNumber,
          email,
          job_title: jobTitle,
          experience_years: experienceYears,
          skills,
          preferred_it_role: preferredRole,
          preferred_it_roles: preferredRoles,
          education,
          bio,
          github_link: github,
          portfolio_link: portfolio,
          linkedin_link: linkedin,
          resume_url: resumeUrl,
          profile_photo_url: profilePhotoUrl,
          other_links: otherLinks,
          work_preference: workPreference,
          actively_looking: activelyLooking,
          role_categories: roleCategories,
          job_priorities: jobPriorities,
          salary_expectation_min: salaryExpectationMin,
          salary_expectation_max: salaryExpectationMax,
          job_search_goal: jobSearchGoal,
          experience_level: experienceLevel,
          certifications,
          school_university: school,
        });
        return { rows: [] };
      }

      return { rows: [] };
    },
    release: () => {},
  };

  return {
    connect: async () => client,
    query: async () => ({ rows: [] }),
    __users: users,
    __profiles: developerProfiles,
  };
};

const loadApp = () => {
  clearServerModuleCache();
  const poolMock = createDeveloperProfilePoolMock();

  mockServerModule('config/database.ts', poolMock);
  mockServerModule('services/authSessionService.ts', createAuthSessionServiceMock());
  mockServerModule('config/runtimeSchema.ts', {
    warmRuntimeSchemas: async () => {},
    ensureBaseUserSchemaReady: async () => {},
    ensureHiringSchemaReady: async () => {},
    ensureOnboardingSchemaReady: async () => {},
  });

  return {
    app: require('../app.ts').createApp(),
    poolMock,
  };
};

const createDeveloperToken = (userId) =>
  jwt.sign(
    {
      id: userId,
      userType: 'employee',
      accountType: 'developer',
      role: 'employee',
    },
    process.env.JWT_SECRET
  );

const buildValidPayload = () => ({
  fullName: 'Requested Name',
  username: 'requested_name',
  location: 'Tanza, Cavite, Philippines',
  phoneNumber: '09123456789',
  email: 'changed@example.com',
  jobTitle: 'Software Engineer',
  preferredRole: 'Software Engineer',
  educationAttainment: 'Bachelor of Science in Information Technology',
  aboutMe: 'About me text',
  yearsOfExperience: '2',
  skills: ['React'],
});

const buildQuestionFlowPayload = () => ({
  fullName: 'Question Flow User',
  username: 'question_flow_user',
  location: '',
  phoneNumber: '',
  email: 'questionflow@example.com',
  jobTitle: 'Software Engineer',
  preferredRole: 'Backend Engineer',
  preferredRoles: ['Backend Engineer', 'Fullstack Engineer', 'DevOps Engineer'],
  educationAttainment: 'Bachelor of Science in Information Technology',
  aboutMe: 'I build backend systems for web products.',
  yearsOfExperience: '2',
  skills: ['Node.js', 'React'],
  activelyLooking: 'yes',
  roleCategories: ['Software Engineering', 'Cloud & DevOps'],
  workPreference: 'remote',
  jobPriorities: ['Flexible hours', 'Meaningful work'],
  salaryExpectationMin: 45000,
  salaryExpectationMax: 90000,
  jobSearchGoal: 'land-asap',
});

test('developer profile save keeps identity immutable for existing users', async () => {
  const { app, poolMock } = loadApp();
  const token = createDeveloperToken('dev-locked-1');

  const response = await request(app)
    .put('/api/developer/profile')
    .set('Authorization', `Bearer ${token}`)
    .send(buildValidPayload());

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(poolMock.__users[0].name, 'Locked Name');
  assert.equal(poolMock.__users[0].phone, '09990000000');
  assert.equal(poolMock.__users[0].email, 'locked@example.com');
});

test('developer profile save allows new users to set identity during onboarding', async () => {
  const { app, poolMock } = loadApp();
  const token = createDeveloperToken('dev-new-1');

  const response = await request(app)
    .put('/api/developer/profile')
    .set('Authorization', `Bearer ${token}`)
    .send(buildValidPayload());

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(poolMock.__users[1].name, 'Requested Name');
  assert.equal(poolMock.__users[1].phone, '09123456789');
  assert.equal(poolMock.__users[1].email, 'new@example.com');
});

test('developer profile save accepts longer profile image data-url payloads', async () => {
  const { app, poolMock } = loadApp();
  const token = createDeveloperToken('dev-new-1');
  const payload = {
    ...buildValidPayload(),
    profileImage: `data:image/png;base64,${'A'.repeat(12000)}`,
  };

  const response = await request(app)
    .put('/api/developer/profile')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(poolMock.__users[1].profile_image, payload.profileImage);
});

test('developer onboarding save allows missing location and phone for question-first onboarding', async () => {
  const { app } = loadApp();
  const token = createDeveloperToken('dev-new-1');

  const response = await request(app)
    .put('/api/developer/profile')
    .set('Authorization', `Bearer ${token}`)
    .send(buildQuestionFlowPayload());

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test('developer profile save persists up to 3 preferred roles while keeping the first role primary', async () => {
  const { app, poolMock } = loadApp();
  const token = createDeveloperToken('dev-new-1');

  const response = await request(app)
    .put('/api/developer/profile')
    .set('Authorization', `Bearer ${token}`)
    .send(buildQuestionFlowPayload());

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(poolMock.__profiles.get('dev-new-1')?.preferred_it_roles, ['Backend Engineer', 'Fullstack Engineer', 'DevOps Engineer']);
  assert.equal(poolMock.__users[1].desired_job, 'Backend Engineer');
});
