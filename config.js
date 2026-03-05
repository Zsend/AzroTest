/*
  AZRO Systems site config
  Update these links right before publish.

  Notes:
  - TradingView indicators are invite-only. Payments happen on Gumroad (or external checkout),
    then access is granted by adding the buyer's TradingView username to the script's access list.
  - For now, any missing purchase links fall back to email.
*/

window.AZRO_CONFIG = {
  supportEmail: 'support@azrosystems.com',

  links: {
    // XRP Top/Bottom Detector
    xrp_lifetime: 'https://azro.gumroad.com/l/xrp-top-bottom-detector',
    xrp_subscription: 'mailto:support@azrosystems.com?subject=XRP%20Indicator%20Subscription%20Request',
    xrp_tradingview: '',

    // BTC Engine
    btc_lifetime: 'mailto:support@azrosystems.com?subject=BTC%20Engine%20Lifetime%20Access%20Request',
    btc_subscription: 'mailto:support@azrosystems.com?subject=BTC%20Engine%20Subscription%20Request',
    btc_tradingview: '',

    // Bundle
    bundle_lifetime: 'mailto:support@azrosystems.com?subject=AZRO%20Bundle%20Lifetime%20Access%20Request',
    bundle_subscription: 'mailto:support@azrosystems.com?subject=AZRO%20Bundle%20Subscription%20Request',

    // Social
    x_url: 'https://x.com/AzroSystems',
    instagram_url: 'https://www.instagram.com/azrosystems/'
  },

  pricing: {
    xrp_lifetime_usd: 200,
    xrp_subscription_usd_month: 29,

    btc_lifetime_usd: 2000,
    btc_subscription_usd_month: 149,

    bundle_lifetime_usd: 1999,
    bundle_subscription_usd_month: 169
  }
};
