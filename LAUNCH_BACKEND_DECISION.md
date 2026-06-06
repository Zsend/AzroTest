# CragLink Power — Form Backend Decision

## Recommended first choice: Netlify Forms
Best if you want the fastest launch with low setup time. Deploy the folder to Netlify, enable form notifications, and test the `founder-access`, `community`, and `footer-community` forms.

## Best CRM path: HubSpot or Klaviyo
Best once you want segmentation, automation, and founder-list nurturing. Use endpoint mode in `config.js` or embed the CRM form after launch.

## Best simple endpoint: Formspree
Create a Formspree form, paste the endpoint into `config.js`, and set `captureMode` to `endpoint`.

## Data to capture later
Once backend is connected, add hidden fields for:
- source page
- UTM source / medium / campaign
- selected product interest
- user segment: climber, overlander, guide, remote worker, outdoor enthusiast
