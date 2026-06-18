# State Access Engine

## Purpose

A cannabis conviction does not have one national employment effect. The engine maps the intersection of:

- Candidate location and supervision
- Role location and duties
- Plant-touching versus ancillary work
- State and local cannabis licensing
- Employee badge/permit requirements
- Owner, financial-interest, and key-person rules
- Criminal-history timing and disqualifiers
- Fair-chance and background-check procedure
- Record relief, pardon, set-aside, and appeal options
- Transportation, cash, firearm, security, healthcare, and federal-contract restrictions
- Remote work, relocation, training, and ownership pathways

## Output statuses

- **Eligible:** confirmed rule set indicates no identified bar for the role as described.
- **Likely eligible:** no bar identified, but employer/local confirmation remains.
- **Counsel review:** ambiguous rule, incomplete record, ownership/key-person status, or local overlay.
- **Alternative pathway:** current role appears blocked; route to ancillary, remote, training, relocation, or different duties.
- **Not eligible for this role:** a confirmed legal or licensing rule applies. This is role-specific, not a platform-wide candidate exclusion.
- **Unknown:** research incomplete; never convert unknown into denial.

## Data contract

Each rule requires:

- Jurisdiction and regulator
- Role/credential/license scope
- Plant-touching status
- Statutory/regulatory citation
- Effective date
- Rule summary
- Disqualifying condition
- Lookback period
- Rehabilitation/appeal/waiver route
- Local overlay flag
- Reviewer and counsel approval
- Last checked date
- Change alert source

## California pilot

The workflow should separately evaluate ordinary employment, owner/license-applicant status, employee badges, local permits, transport/security duties, and California fair-chance process. Do not infer an employee prohibition from an owner-license rule.

## Idaho mobility pilot

Treat the state as a mobility-pathway case until specific regulated roles are confirmed lawful. Prioritize lawful ancillary work, remote work, hemp-related roles where applicable, transferable training, candidate-controlled relocation, and individualized legal-relief review. Do not publish an absolute expungement claim without current legal review of the person’s disposition and available remedies.

## Governance

- Legal-rule changes require versioning and counsel approval.
- Automated matching may suggest a pathway but cannot make an adverse decision.
- Candidates and employers receive a plain-language explanation and the date/rule version.
- Local laws and license conditions must be checked before an introduction becomes a role offer.
