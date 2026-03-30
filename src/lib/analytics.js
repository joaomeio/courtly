import posthog from 'posthog-js'

export const analytics = {
  // Call after Supabase auth login/signup
  identify: (userId, properties) => {
    posthog.identify(userId, properties)
  },

  // Call on logout
  reset: () => {
    posthog.reset()
  },

  // Custom events — use these throughout the app
  track: (event, properties) => {
    posthog.capture(event, properties)
  },
}

// Pre-defined event names for consistency
export const EVENTS = {
  COACH_SIGNED_UP: 'coach_signed_up',
  COACH_ONBOARDING_COMPLETE: 'coach_onboarding_complete',
  STUDENT_ADDED: 'student_added',
  LESSON_SCHEDULED: 'lesson_scheduled',
  LESSON_CANCELLED: 'lesson_cancelled',
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  STRIPE_CONNECTED: 'stripe_connected',
  INVITE_SENT: 'invite_sent',
}
