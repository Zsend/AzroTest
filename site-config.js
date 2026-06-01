window.RS_CONFIG = {
  reviewInbox: "review@reservestandard.com",
  gateHash: "80301292497ab7bc53f16f585f2d506ad65d903db1756f0be5fdd70130086d4b",

  // Static-site access tracking. Leave endpoint blank to use Netlify Forms.
  // To use Google Apps Script, Formspree, Zapier, Make, or another webhook,
  // paste the endpoint URL here and logs will be sent as JSON/beacon events.
  loginTrackerEndpoint: "",
  loginTrackerMode: "netlify",
  loginTrackerFormName: "rs-login-events",

  // Visit ?rs_owner=RS-OWNER-2026-8K4M once from your own browser to mark it
  // as the owner's device. Future unlocks/authorized visits from that browser
  // will log isOwner: true. This is for analytics labeling, not authentication.
  ownerDeviceToken: "RS-OWNER-2026-8K4M",
  ownerDeviceLabel: "Zach",
  ownerGateHash: ""
};
