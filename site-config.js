window.RS_CONFIG = {
  reviewInbox: "support@reservestandard.com",
  gateHash: "",
  gateVerifier: {
    algorithm: "PBKDF2-SHA256",
    iterations: 600000,
    salt: "2y611UTplWuGZ+b5Ymp1dQ==",
    hash: "25cd794cac47f6b5d23cc5afd0516f20f330856ae74ef216e0eebf88319bcd63"
  },

  // Login email alerts for GitHub Pages.
  // Uses FormSubmit in the background after a successful gate unlock.
  // No access code is ever sent.
  loginEmailAlertsEnabled: true,
  loginEmailAlertEndpoint: "https://formsubmit.co/ajax/support@reservestandard.com",
  loginEmailAlertSubject: "Reserve Standard access opened",
  loginEmailAlertTemplate: "table",
  loginEmailAlertCc: "",
  loginEmailAlertReturnVisits: false,

  // Optional generic webhook support, kept blank by default.
  loginTrackerEndpoint: "",
  loginTrackerFormat: "form",

  // Owner identification is local-browser only. Use the private owner code once
  // to mark your browser; the code itself is not stored in this public file.
  ownerDeviceToken: "",
  ownerDeviceLabel: "Owner",
  accessMaxAgeDays: 30,
  ownerGateHash: "2cb06e24ab1eca47966971ec28e15ab43d5bc38ed0ae781f4e5006972eede532"
};
