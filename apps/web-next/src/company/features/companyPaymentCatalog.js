import { BadgeDollarSign, CreditCard } from 'lucide-react';

export const PLAN_FEATURES = ['AI Candidate Matching', 'Smart Filtering', 'Resume Insights', 'Priority Visibility'];

export const JOB_POST_PLANS = [
  {
    id: '1-week',
    label: '1 Week',
    price: 699,
    description: 'Best for urgent hiring',
    durationLabel: '1 week',
    durationDays: 7,
  },
  {
    id: '1-month',
    label: '1 Month',
    price: 1699,
    description: 'Perfect for consistent hiring',
    durationLabel: '1 month',
    durationDays: 30,
    badge: 'Most Popular',
    highlighted: true,
  },
  {
    id: '3-months',
    label: '3 Months',
    price: 4499,
    description: 'Great for ongoing recruitment',
    durationLabel: '3 months',
    durationDays: 90,
  },
  {
    id: '6-months',
    label: '6 Months',
    price: 7999,
    description: 'Best value for long-term hiring',
    durationLabel: '6 months',
    durationDays: 180,
  },
];

export const PAYMENT_PROVIDERS = [
  {
    id: 'stripe',
    label: 'Stripe',
    merchantName: 'KapIT Stripe Checkout',
    merchantCode: 'KAPIT-STRIPE-201',
    accountHint: 'Card checkout handled by Stripe',
    description: 'Accept secure card payments through hosted Stripe Checkout.',
    icon: CreditCard,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    merchantName: 'KapIT PayPal Merchant',
    merchantCode: 'KAPIT-PAYPAL-314',
    accountHint: 'merchant checkout via PayPal',
    description: 'Accept PayPal wallet and supported guest checkout payments.',
    icon: BadgeDollarSign,
  },
];
