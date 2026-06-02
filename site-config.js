window.RS_CONFIG = {
  reviewInbox: "review@reservestandard.com",
  gateHash: "80301292497ab7bc53f16f585f2d506ad65d903db1756f0be5fdd70130086d4b",

  // GitHub Pages is static, so login tracking needs one external endpoint.
  // Easiest path: create the included Google Apps Script + Google Sheet logger,
  // deploy it as a web app, then paste the web app URL below.
  loginTrackerEndpoint: "",
  loginTrackerFormat: "form",

  // Visit ?rs_owner=RS-OWNER-2026-8K4M once from your own browser to mark it
  // as the owner's device. Future unlocks/authorized visits from that browser
  // will log isOwner: true. This is for analytics labeling, not authentication.
  ownerDeviceToken: "RS-OWNER-2026-8K4M",
  ownerDeviceLabel: "Zach",
  ownerGateHash: ""
};
