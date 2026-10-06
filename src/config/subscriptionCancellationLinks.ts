// Cancellation/Management URLs for popular subscription services
// Based on official provider documentation

export const subscriptionCancellationLinks: Record<string, {
  url: string;
  name: string;
  instructions?: string;
}> = {
  // Streaming Services
  netflix: {
    url: 'https://www.netflix.com/cancelplan',
    name: 'Netflix',
    instructions: 'Opening Netflix - Sign in and confirm cancellation'
  },
  spotify: {
    url: 'https://www.spotify.com/account/subscription/',
    name: 'Spotify',
    instructions: 'Opening Spotify - Click "Change plan" then "Cancel Premium"'
  },
  'amazon prime': {
    url: 'https://www.amazon.com/mc/manageyourmembership',
    name: 'Amazon Prime',
    instructions: 'Opening Amazon - Click "End Membership" to cancel'
  },
  showmax: {
    url: 'https://www.showmax.com/account',
    name: 'Showmax',
    instructions: 'Opening Showmax - Go to Settings and cancel subscription'
  },
  dstv: {
    url: 'https://now.dstv.com/account',
    name: 'DStv',
    instructions: 'Opening DStv - Manage your subscription from account settings'
  },

  // Music Services
  'apple music': {
    url: 'https://music.apple.com/account/subscriptions',
    name: 'Apple Music',
    instructions: 'Opening Apple Music - Click your subscription and select "Cancel"'
  },
  'youtube premium': {
    url: 'https://www.youtube.com/paid_memberships',
    name: 'YouTube Premium',
    instructions: 'Opening YouTube - Click "Deactivate" next to your membership'
  },

  // Cloud Storage
  dropbox: {
    url: 'https://www.dropbox.com/account/billing',
    name: 'Dropbox',
    instructions: 'Opening Dropbox - Change to Basic (free) plan'
  },
  'google one': {
    url: 'https://one.google.com/storage',
    name: 'Google One',
    instructions: 'Opening Google One - Click settings and cancel plan'
  },
  icloud: {
    url: 'https://www.icloud.com/settings/',
    name: 'iCloud+',
    instructions: 'Opening iCloud - Go to Account Settings and downgrade storage'
  },

  // Productivity
  'microsoft 365': {
    url: 'https://account.microsoft.com/services/',
    name: 'Microsoft 365',
    instructions: 'Opening Microsoft - Select your subscription and turn off recurring billing'
  },
  'adobe creative cloud': {
    url: 'https://account.adobe.com/plans',
    name: 'Adobe Creative Cloud',
    instructions: 'Opening Adobe - Click "Manage plan" and cancel subscription'
  },

  // Fitness
  peloton: {
    url: 'https://members.onepeloton.com/membership',
    name: 'Peloton',
    instructions: 'Opening Peloton - Manage or cancel your membership'
  },

  // News & Media
  'new york times': {
    url: 'https://myaccount.nytimes.com/seg/subscription',
    name: 'New York Times',
    instructions: 'Opening NY Times - Click "Cancel my subscription"'
  },

  // Gaming
  'playstation plus': {
    url: 'https://www.playstation.com/en-us/support/subscriptions/cancel-playstation-subscriptions/',
    name: 'PlayStation Plus',
    instructions: 'Opening PlayStation - Follow steps to cancel from console or web'
  },
  'xbox game pass': {
    url: 'https://account.microsoft.com/services/',
    name: 'Xbox Game Pass',
    instructions: 'Opening Xbox - Select Game Pass and turn off recurring billing'
  },

  // African Services
  multichoice: {
    url: 'https://www.dstv.com/en-za/account',
    name: 'MultiChoice',
    instructions: 'Opening MultiChoice - Manage your DStv/GOtv subscription'
  },
  gotv: {
    url: 'https://www.gotvafrica.com/',
    name: 'GOtv',
    instructions: 'Opening GOtv - Visit your account to manage subscription'
  },

  // Additional Streaming
  'disney plus': {
    url: 'https://www.disneyplus.com/account',
    name: 'Disney+',
    instructions: 'Opening Disney+ - Go to Billing Details and cancel subscription'
  },
  'hbo max': {
    url: 'https://play.hbomax.com/subscription',
    name: 'HBO Max',
    instructions: 'Opening HBO Max - Click "Cancel Subscription"'
  },
  hulu: {
    url: 'https://secure.hulu.com/account',
    name: 'Hulu',
    instructions: 'Opening Hulu - Click "Cancel" under your subscription'
  },
  paramount: {
    url: 'https://www.paramountplus.com/account/subscription/',
    name: 'Paramount+',
    instructions: 'Opening Paramount+ - Manage your subscription and cancel'
  },
};

// Helper function to find cancellation link by subscription name
export const getCancellationLink = (subscriptionName: string): typeof subscriptionCancellationLinks[string] | null => {
  const normalizedName = subscriptionName.toLowerCase();

  // Direct match
  if (subscriptionCancellationLinks[normalizedName]) {
    return subscriptionCancellationLinks[normalizedName];
  }

  // Partial match
  for (const [key, value] of Object.entries(subscriptionCancellationLinks)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }

  return null;
};
