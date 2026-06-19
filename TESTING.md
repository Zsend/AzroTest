# Testing

## Static release checks

```bash
python scripts/check_release.py
```

The check verifies required public files, relative links, unique IDs, image alt text, empty-by-default public state, configuration, JavaScript syntax when Node is available, and absence of common secret files.

## Backend tests

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
```

The workflow suite exercises candidate intake, Passport editing, employer verification, role publication, matching, registry evidence, independent reviews, publication, correction intake, analytics, and security headers.

## Manual acceptance path

1. Candidate submits fictional information and receives a private Passport link.
2. Candidate edits goals, ambitions, skills, visibility, and match preferences.
3. Operator moderates the public-safe snapshot.
4. Employer submits and is verified.
5. Employer submits a paid role and the operator publishes it.
6. Candidate sees a match explanation generated without conviction detail.
7. Operator creates a fictional registry draft.
8. Operator adds two documented sources and two reviews from distinct reviewer IDs.
9. Publication fails if a source, check, or reviewer is missing; succeeds after all gates pass.
10. Public charts update from actual test events while targets remain separate.
11. A correction can freeze or change a disputed record.
12. Local data can be exported, reviewed, and reset.
