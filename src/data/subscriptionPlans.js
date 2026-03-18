// subscriptionPlans.js - 3 Test Levels

export const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'mock-basic',
    name: 'Basic Python Test',
    level: 'basic',
    price: 'Free',
    timeLimit: 60,
    totalQuestions: 60,
    description: 'Foundation level Python for beginners',
    badge: '🌱 Starter',
    features: [
      '60 Basic Python questions',
      '60 minutes (1 min per question)',
      'Easy difficulty level',
      'Variables, loops, functions',
      'Certificate on completion'
    ]
  },
  
  advanced: {
    id: 'mock-advanced',
    name: 'Advanced Python Test',
    level: 'advanced',
    price: 19,
    timeLimit: 120,
    totalQuestions: 60,
    description: 'Mixed difficulty with advanced concepts',
    badge: '🔥 Popular',
    features: [
      '60 Advanced questions',
      '120 minutes (2 min per question)',
      'Medium-Hard difficulty',
      'OOP, decorators, comprehensions',
      'Premium certificate'
    ]
  },
  
  pro: {
    id: 'mock-pro',
    name: 'Pro Python Test',
    level: 'pro',
    price: 29,
    timeLimit: 180,
    totalQuestions: 60,
    description: 'Job-interview level challenges',
    badge: '⭐ BEST',
    features: [
      '60 Pro-level questions',
      '180 minutes (3 min per question)',
      'Job interview standard',
      'Algorithms, design patterns',
      'Professional certificate'
    ]
  }
};

export const getPlanById = (planId) => {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.id === planId);
};

export const getPlanByLevel = (level) => {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.level === level);
};

export const getAllPlans = () => {
  return Object.values(SUBSCRIPTION_PLANS);
};

export const isAdmin = (userEmail) => {
  return userEmail === 'luckyfaizu3@gmail.com';
};

// Free plan check helper
export const isFreePlan = (plan) => {
  return plan?.price === 'Free';
};