const JOB_POST_PLANS = [
  {
    id: '1-week',
    label: '1 Week',
    price: 699,
    description: 'Best for urgent hiring',
    durationLabel: '1 week',
    durationDays: 7,
    features: ['Verified payment before publishing', 'Timed job visibility', 'Basic applicant intake', 'Saved draft and reopen support'],
  },
  {
    id: '1-month',
    label: '1 Month',
    price: 1699,
    description: 'Perfect for consistent hiring',
    durationLabel: '1 month',
    durationDays: 30,
    badge: 'Most Popular',
    features: ['Verified payment before publishing', 'Timed job visibility', 'Basic applicant intake', 'Saved draft and reopen support'],
  },
  {
    id: '3-months',
    label: '3 Months',
    price: 4499,
    description: 'Great for ongoing recruitment',
    durationLabel: '3 months',
    durationDays: 90,
    features: ['Verified payment before publishing', 'Timed job visibility', 'Basic applicant intake', 'Saved draft and reopen support'],
  },
  {
    id: '6-months',
    label: '6 Months',
    price: 7999,
    description: 'Best value for long-term hiring',
    durationLabel: '6 months',
    durationDays: 180,
    features: ['Verified payment before publishing', 'Timed job visibility', 'Basic applicant intake', 'Saved draft and reopen support'],
  },
];

const getJobPostPlanById = (planId) => JOB_POST_PLANS.find((plan) => plan.id === String(planId || '').trim()) || null;

module.exports = {
  JOB_POST_PLANS,
  getJobPostPlanById,
};
