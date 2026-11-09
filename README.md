# HustleHub+

## INSY7314 POE — DevSecOps, Monitoring and Finalisation

HustleHub+ is a freelance marketplace developed using MongoDB, Express, React and Node.js. It allows clients to book services, freelancers to manage gigs and monitor income, and administrators to inspect transaction records.

The final POE extends the application with financial insights, automated testing, static analysis, Docker containerisation, logging and additional security controls.

> This documentation describes the latest reviewed project snapshot. Outstanding integration fixes and missing evidence are identified explicitly. Passing automated checks does not establish that every deployment or security requirement has been completed.

## Table of Contents

1. Project Overview
2. Features and User Roles
3. Technology Stack
4. Architecture and Project Structure
5. Local Installation
6. Docker Installation
7. Application Workflow
8. Financial Insights and Tax Estimation
9. API Endpoints
10. Testing and Verification
11. GitHub Actions Pipeline
12. Static Code Analysis
13. Logging and Monitoring
14. Security Implementation
15. Final Security Review
16. Troubleshooting
17. Submission Evidence
18. Demonstration Video
19. Limitations and Outstanding Work
20. Contributions
21. References

## 1. Project Overview

HustleHub+ connects clients with freelancers offering services.

The application provides:

- Registration and authentication.
- Role-based navigation and API access.
- Freelancer gig management.
- Client bookings.
- Simulated payment confirmation and transaction recording.
- Freelancer financial summaries.
- Estimated tax calculations and monthly income visualisation.
- Administrator transaction oversight.
- Automated testing and quality checks.
- Containerised application execution.
- Security-related event logging.

Payments are simulated. Recording a booking and transaction does not charge a real payment method or prove external settlement.

## 2. Features and User Roles

### 2.1 Visitors

Visitors can:

- Register a Client or Freelancer account.
- Log in using their credentials.
- Receive validation feedback.

Public registration does not permit creation of Admin accounts.

### 2.2 Clients

Clients can:

- Browse available gigs.
- View service information and prices.
- Book services.
- View their own booking history.
- Access their own transaction records through the protected API.

The server determines the booking price and participants from the stored gig and verified user identity.

### 2.3 Freelancers

Freelancers can:

- Create gigs.
- View their own gigs.
- Edit and delete gigs they own.
- View bookings received.
- View income from completed transaction records.
- Inspect monthly income.
- View estimated tax and estimated net income.
- Expand the tax calculation breakdown.
- View recent transactions.

### 2.4 Administrators

Administrators can:

- Access the All Transactions screen.
- View platform transaction records through the protected API.

Admin accounts must be provisioned through a trusted process. The application does not provide a public administrator registration endpoint.

## 3. Technology Stack

| Technology | Purpose |
| --- | --- |
| React | Component-based frontend |
| Vite | Development server and production frontend build |
| Node.js | Backend JavaScript runtime |
| Express | REST API and middleware |
| MongoDB | Persistent application data |
| Mongoose | Schemas, models and database queries |
| bcrypt | Password hashing |
| jsonwebtoken | JWT creation and verification |
| Helmet | API security headers |
| cors | Browser origin configuration |
| express-rate-limit | Request and failed-login limits |
| Jest | Backend unit tests |
| Node test runner | Separate backend smoke tests |
| Vitest | Frontend automated tests |
| React Testing Library | Frontend rendering and interaction tests |
| ESLint | Static code analysis |
| GitHub Actions | Automated testing and packaging |
| Docker | Application containers |
| Docker Compose | Multi-container orchestration |
| nginx | HTTPS hosting of compiled frontend assets |

React organises the interface into components with their own presentation and behaviour (React, n.d.).

## 4. Architecture and Project Structure

### 4.1 Architecture

The application follows a browser–API–database structure:

1. The React frontend displays the application interface.
2. Frontend service modules send requests to Express.
3. Express applies authentication, authorisation and validation.
4. Controllers use Mongoose to access MongoDB.
5. The API returns JSON responses to the frontend.

The frontend currently calls:

```text
https://localhost:4000/api
```

The API address is hardcoded in frontend service files. Deployment to another host requires updating these URLs or implementing a configurable shared API base URL.

### 4.2 Project Structure

| Location | Description |
| --- | --- |
| `api/config/` | Database connection configuration |
| `api/controllers/` | Authentication, gigs, bookings and transactions |
| `api/middleware/` | Validation, sanitisation, ownership, authentication and errors |
| `api/models/` | User, Gig, Booking and Transaction schemas |
| `api/routes/` | Endpoint definitions and route protection |
| `api/services/taxEstimator.js` | Tax calculation and tax-year helpers |
| `api/utils/logger.js` | Structured JSON logging |
| `api/tests/` | Backend tests |
| `api/index.js` | API startup and server configuration |
| `api/Dockerfile` | API container definition |
| `client/src/pages/` | Application screens |
| `client/src/services/` | API requests and session handling |
| `client/src/tests/` | Frontend tests |
| `client/Dockerfile` | Frontend build and runtime image |
| `client/nginx.conf` | Container frontend HTTPS configuration |
| `docker-compose.yml` | MongoDB, API and frontend orchestration |
| `.github/workflows/ci.yml` | Automated quality pipeline |
| `.github/workflows/autograde.yaml` | Classroom autograding |
| `docs/` | Feature handoff and evidence guidance |
| `evidence/part3/docker/` | Supplied Docker screenshots |

## 5. Local Installation

### 5.1 Prerequisites

Install or configure:

- Node.js 24 and npm.
- Git.
- VS Code, Visual Studio Folder View, or another editor.
- An accessible MongoDB instance.
- OpenSSL for local API certificates.
- Docker Desktop and Docker Compose if using containers.

The commands below use PowerShell and `npm.cmd`.

On Linux or macOS, use `npm` instead of `npm.cmd`.

### 5.2 Open the Project

Open the repository root containing both the `api` and `client` folders.

All commands below assume the terminal starts in that root unless stated otherwise.

### 5.3 Install Dependencies

```powershell
npm.cmd ci --prefix api
npm.cmd ci --prefix client
```

Keep both package lockfiles committed so installations use the project's locked dependency versions.

### 5.4 Configure the Backend

If an API environment file does not already exist:

```powershell
Copy-Item api/.env.example api/.env
```

Edit `api/.env`:

```dotenv
PORT=4000
APP_NAME=HustleHub+
NODE_ENV=development

CLIENT_ORIGIN=https://localhost:5173

USE_HTTPS=true
SSL_KEY_PATH=
SSL_CERT_PATH=

MONGO_URI=mongodb://localhost:27017/hustlehub

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1h
```

The example URI requires a local MongoDB server.

When using Atlas, replace it with an authorised connection string and configure database credentials and appropriate network access.

Generate a JWT secret:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Paste the generated value into `JWT_SECRET`.

Do not commit:

- Real environment files.
- Database credentials.
- JWT secrets.
- Private certificate keys.
- Token-populated test exports.

### 5.5 Generate API Certificates

```powershell
New-Item -ItemType Directory -Force api/certs | Out-Null
openssl req -x509 -newkey rsa:2048 -nodes -keyout api/certs/localhost-key.pem -out api/certs/localhost-cert.pem -days 365 -subj "/CN=localhost"
```

With blank certificate path settings, the API uses:

```text
api/certs/localhost-key.pem
api/certs/localhost-cert.pem
```

The frontend enables development HTTPS through Vite's basic SSL plugin.

These are self-signed development certificates. Browsers may require a local trust exception. Public deployment requires trusted certificates.

### 5.6 Start the Backend

In the first terminal:

```powershell
npm.cmd run dev --prefix api
```

The API waits for MongoDB before listening.

### 5.7 Start the Frontend

In a second terminal:

```powershell
npm.cmd run dev --prefix client
```

### 5.8 Application Addresses

| Service | Address |
| --- | --- |
| Frontend | https://localhost:5173 |
| API health | https://localhost:4000/health |
| API base | https://localhost:4000/api |

Visit the API health endpoint to handle its development certificate before using the frontend.

Keep both terminals running. Stop a process using `Ctrl+C`.

## 6. Docker Installation

Docker Compose defines and runs multi-container applications using a shared configuration for services, networks and volumes (Docker, n.d.).

### 6.1 Required Correction in the Reviewed Snapshot

The API imports `utils/logger.js`, but the reviewed API Dockerfile does not copy the `utils` directory.

Add this alongside the existing directory copies in `api/Dockerfile`:

```dockerfile
COPY utils ./utils
```

Also add this entry to the `files` array in `api/package.json`:

```json
"utils/"
```

Preserve valid JSON commas when editing the array.

Add `utils` to the backend syntax-check directory list in `.github/workflows/ci.yml`.

This documentation does not itself apply those source changes.

### 6.2 Configure Compose

If the root environment file does not already exist:

```powershell
Copy-Item .env.example .env
```

Set:

```dotenv
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1h
```

The root `.env` configures Compose. It is separate from `api/.env`, which is used for direct development.

By default, the API uses the bundled MongoDB container:

```text
mongodb://mongo:27017/hustlehub
```

A root `MONGO_URI` value can override this connection. The MongoDB service remains defined in Compose even when the API connects to Atlas.

### 6.3 Build and Start

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs api
```

Open:

```text
https://localhost:5173
```

Check:

```text
https://localhost:4000/health
```

### 6.4 Container Responsibilities

| Service | Description |
| --- | --- |
| `mongo` | MongoDB 8 with health check and persistent named volume |
| `api` | Node.js API with production dependencies and non-root execution |
| `client` | Compiled React frontend served by nginx over HTTPS |

The API waits for MongoDB health.

The frontend depends on API startup but does not wait for API health. Confirm service health before demonstrating the application.

Container scripts generate self-signed certificates for the local demonstration.

### 6.5 Logs and Shutdown

```powershell
docker compose logs -f api
docker compose logs client
docker compose down
```

Normal shutdown retains the database volume.

The following command deletes the named volume and its database contents:

```powershell
docker compose down -v
```

Use it only when intentionally resetting the container database.

The bundled database configuration is intended for local demonstration and requires further hardening for production.

## 7. Application Workflow

### 7.1 Freelancer Workflow

1. Register as a Freelancer.
2. Log in.
3. Create a gig.
4. Open My Gigs.
5. Edit or delete an owned gig.
6. View received bookings.
7. Open Earnings.
8. Review monthly income, estimated tax and recent transactions.

### 7.2 Client Workflow

1. Register as a Client.
2. Log in.
3. Browse gigs.
4. Book a service.
5. View My Bookings.
6. Inspect the recorded price and references.

### 7.3 Booking and Transaction Recording

When a booking is created, the server:

1. Loads the selected gig.
2. Uses the stored gig title and price.
3. Uses the Client ID from the verified JWT.
4. Uses the Freelancer ID from the stored gig.
5. Rejects self-booking.
6. Creates the booking.
7. Creates the associated transaction.
8. Returns both records.

A transaction creation failure triggers an attempt to remove the booking.

This is compensating cleanup rather than an atomic MongoDB transaction.

## 8. Financial Insights and Tax Estimation

### 8.1 Financial Dashboard

The dashboard displays:

- Recorded income.
- Estimated tax.
- Estimated net income.
- Monthly income.
- Recent transactions.
- Tax calculation breakdown.

The API uses the authenticated Freelancer ID to scope financial data.

Completed transactions within the configured tax-year period contribute to the financial summary.

### 8.2 Implemented Tax Rules

The reviewed source contains a fixed 2026/27 illustration covering:

```text
1 March 2026 to 28 February 2027
```

Johannesburg date boundaries determine the tax-year period.

The table below documents the constants implemented in the source. It is not an independent certification that those constants match all current tax requirements.

| Income portion in the implementation | Marginal rate |
| --- | --- |
| First R245,100 | 18% |
| Above R245,100 to R383,100 | 26% |
| Above R383,100 to R530,200 | 31% |
| Above R530,200 to R695,800 | 36% |
| Above R695,800 to R887,000 | 39% |
| Above R887,000 to R1,878,600 | 41% |
| Above R1,878,600 | 45% |

The implementation uses a primary rebate of:

```text
R17,820
```

Official individual tax tables are published by the South African Revenue Service and should be checked when reviewing or updating the estimator (South African Revenue Service, n.d.).

### 8.3 Calculation Method

1. Validate the income amount.
2. Convert money to integer cents.
3. Divide income across the configured brackets.
4. Apply the relevant marginal rate to each portion.
5. Sum the bracket tax amounts.
6. Subtract the configured primary rebate.
7. Prevent negative tax.
8. Subtract estimated tax from income.

Using the implemented constants:

```text
Income:                 R120,000
Tax before rebate:       R21,600
Primary rebate:           R17,820
Estimated tax:             R3,780
Estimated net income:    R116,220
```

### 8.4 Assumptions

- The individual is younger than 65.
- Only the primary rebate is included.
- Platform income is treated as taxable income.
- Expenses and deductions are excluded.
- Other income is excluded.
- Medical credits, provisional payments and VAT are excluded.
- Recorded year-to-date income is not projected to a full year.
- Payments are simulated.

This component is an assessment illustration, not tax advice or a tax filing service.

## 9. API Endpoints

Protected requests require:

```http
Authorization: Bearer <token>
```

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/` | Public |
| GET | `/health` | Public |
| POST | `/api/auth/register` | Public Client/Freelancer registration |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/gigs` | Public |
| GET | `/api/gigs/mine` | Freelancer |
| GET | `/api/gigs/:id` | Public |
| POST | `/api/gigs` | Freelancer |
| PUT | `/api/gigs/:id` | Freelancer owner |
| DELETE | `/api/gigs/:id` | Freelancer owner |
| POST | `/api/bookings` | Client |
| GET | `/api/bookings/mine` | Client |
| GET | `/api/bookings/received` | Freelancer |
| GET | `/api/bookings/:id` | Participant or Admin |
| GET | `/api/transactions/mine` | Client or Freelancer |
| GET | `/api/transactions/income` | Freelancer |
| GET | `/api/transactions` | Admin |

Common response codes:

| Code | Meaning |
| --- | --- |
| 200 | Successful request |
| 201 | Resource created |
| 400 | Invalid input |
| 401 | Missing or invalid authentication |
| 403 | Access denied |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

## 10. Testing and Verification

### 10.1 Backend Jest Tests

From the repository root:

```powershell
npm.cmd test --prefix api -- --ci --runInBand
```

Coverage includes:

- Authentication validation.
- Gig validation.
- Request sanitisation.
- Financial authorisation.
- Income summary behaviour.
- Tax calculations.

Jest selects `.test.js` files through `api/jest.config.cjs`.

### 10.2 Separate Node Smoke Tests

```powershell
cd api
node --test tests/taxEstimator.node.test.cjs tests/incomeDashboard.node.test.cjs
cd ..
```

These use the Node test runner rather than Jest.

Mocks and dependency stand-ins do not demonstrate live database persistence.

### 10.3 Frontend Tests

```powershell
npm.cmd run test:run --prefix client
```

Tests cover:

- Create Gig rendering and validation.
- Successful gig submission.
- Transaction-service requests.
- Authentication headers.
- Error handling.
- Earnings dashboard behaviour.

### 10.4 Static Analysis and Build

```powershell
npm.cmd run lint --prefix client
npm.cmd run build --prefix client
```

The frontend production output is written to:

```text
client/dist/
```

### 10.5 Dependency Vulnerability Review

```powershell
npm.cmd audit --prefix api
npm.cmd audit --prefix client
npm.cmd audit --omit=dev --prefix api
npm.cmd audit --omit=dev --prefix client
```

The npm audit command reports known vulnerabilities in the dependency tree (npm, n.d.).

Review affected packages, exploit conditions and available fixes.

Do not automatically use `audit fix --force`; forced remediation may change dependency ranges and introduce breaking changes.

After updates:

1. Rerun tests.
2. Rerun lint.
3. Rebuild the frontend.
4. Rebuild containers when relevant.
5. Commit changed manifests and lockfiles.

### 10.6 Postman and Newman

The reviewed snapshot contains:

```text
HustleHub+ API - Part 1 Testing.postman_collection.json
```

Import the actual collection into Postman and inspect its variables before use.

The current `test:api` script references a collection and environment under `postman/` that are absent from the reviewed ZIP.

Restore those files or correct the script before claiming successful Newman execution.

Use a dedicated test database and redact credentials and tokens from shared exports.

### 10.7 Verification Status

Historical checks on an earlier uploaded version found:

- 47 passing backend Jest tests.
- 17 passing frontend tests.
- A successful frontend build.

A supplied GitHub screenshot also showed successful HustleHub CI runs.

These are historical results. Record fresh results for the final merged commit after integration fixes.

## 11. GitHub Actions Pipeline

GitHub Actions supports automated development workflows, including continuous integration and delivery processes (GitHub, n.d.).

### 11.1 Configuration

```text
.github/workflows/ci.yml
```

Workflow name:

```text
HustleHub CI
```

Triggers:

- Push.
- Pull request.
- Manual execution.

### 11.2 Jobs

| Job | Checks | Artifact |
| --- | --- | --- |
| Backend tests and package | Dependency installation, Jest, Node smoke tests, syntax validation and packaging | `backend-package` |
| Frontend tests and build | Dependency installation, Vitest and Vite build | `frontend-build` |
| ESLint static analysis | Dependency installation and ESLint | `eslint-static-analysis` |

The workflow uses:

- Ubuntu runners.
- Node.js 24.
- `npm ci`.
- npm dependency caching.
- Read-only repository content permissions.

Failed checks fail their jobs.

No `continue-on-error` bypass is configured.

### 11.3 Backend Build Approach

The backend uses plain JavaScript and does not require transpilation.

The workflow checks syntax and uses `npm pack` to create a backend package.

The package must include all imported application directories, including `utils/`.

### 11.4 Pipeline Scope

The workflow automates quality checks and produces artifacts.

It does not currently:

- Deploy the application to public hosting.
- Build Docker images.
- Enforce npm audit vulnerability thresholds.

The classroom autograding workflow remains separate.

## 12. Static Code Analysis

ESLint analyses frontend JavaScript and JSX using the project's configured JavaScript, React Hooks and React Refresh rules.

Its CLI supports JSON report output and warning thresholds (ESLint, n.d.).

Generate a report locally:

```powershell
cd client
npm.cmd run lint -- --max-warnings 0 --format json --output-file eslint-report.json
cd ..
```

The report contains:

- Analysed file paths.
- Rule identifiers.
- Finding locations.
- Error and warning counts.
- Diagnostic messages.

Download the final `eslint-static-analysis` artifact from GitHub Actions.

Explain the actual report results in the submission.

Zero findings means that no violations of the configured rules were detected. It does not prove that the application has no vulnerabilities.

The current ESLint configuration covers the frontend. Backend syntax checking is separate and provides more limited analysis.

## 13. Logging and Monitoring

OWASP recommends application logging that supports security investigation while avoiding unnecessary disclosure of sensitive information (OWASP Foundation, n.d.).

### 13.1 Logger

```text
api/utils/logger.js
```

The logger writes structured JSON to stdout/stderr.

Supported levels:

- INFO.
- WARN.
- ERROR.

### 13.2 Implemented Events

| Event | Purpose |
| --- | --- |
| `LOGIN_SUCCESS` | Record successful authentication |
| `LOGIN_FAILED` | Record credential rejection |
| `LOGIN_RATE_LIMITED` | Record blocked login attempts |
| `APPLICATION_ERROR` | Record failures reaching the central error handler |

Approved metadata fields include:

- Timestamp and event level.
- Event name.
- User ID.
- Role.
- HTTP method.
- Path.
- Status code.
- Request ID.
- Error type.
- Outcome.

Request ID is supported as metadata but is not automatically generated by the logger.

### 13.3 Sensitive Information

Do not log:

- Passwords.
- Raw JWTs.
- Database connection strings.
- Payment credentials.
- Complete request bodies.

Review user-controlled path information before retaining or sharing logs.

### 13.4 Outstanding Event Coverage

The reviewed booking controller does not yet emit booking-created or transaction-created events.

Add these events after successful operations and capture actual execution evidence.

Avoid logging a booking as successfully completed if transaction creation fails and the booking is removed.

The central error handler does not capture every rejected request because some middleware responds directly.

### 13.5 Viewing Logs

During local execution, logs appear in the API terminal.

For Docker:

```powershell
docker compose logs -f api
docker compose logs --since 10m api
```

No external monitoring dashboard, automated alerts or application-level retention policy is configured.

## 14. Security Implementation

### 14.1 Password Security

- Passwords are hashed with bcrypt.
- The configured bcrypt cost factor is 12.
- Passwords require uppercase, lowercase and a number.
- Minimum length is eight characters.
- The bcrypt 72-byte input limit is enforced.
- Password hashes are excluded from normal model queries.

### 14.2 Authentication

- Login issues a signed JWT.
- Protected routes verify JWT signature and expiry.
- The default token lifetime is one hour.
- Login failures use generic messages.
- Unknown accounts trigger a dummy bcrypt comparison to reduce timing differences.

Measured constant-time login behaviour is not claimed.

### 14.3 Session Handling

Session information is stored in `sessionStorage`.

The frontend checks expiry and returns expired sessions to login.

Logout clears local session data.

Server-side token revocation is not implemented.

### 14.4 Access Control

- API middleware enforces permitted roles.
- Gig modification requires ownership.
- Booking detail access requires participation or Admin status.
- Personal transaction and income queries use the verified identity.
- Frontend menus are a convenience, not the security boundary.

### 14.5 Validation and Sanitisation

Server-side validation checks:

- Required values.
- Types and lengths.
- Positive prices.
- Relevant identifiers.
- Registration and booking fields.

Sanitisation removes MongoDB operator keys, dotted keys and null bytes from bodies and parameters.

Query strings are not sanitised by this middleware and require explicit validation.

### 14.6 Headers and HTTPS

- Helmet configures API security headers.
- The API disables `X-Powered-By`.
- CORS specifies the frontend origin.
- nginx supplies frontend security headers.
- Local HTTPS uses self-signed certificates.

API response headers do not automatically protect the separately served frontend HTML.

CORS does not replace authentication.

### 14.7 Rate Limiting

| Scope | Limit per IP |
| --- | --- |
| Authentication routes | 20 requests per 15 minutes |
| Failed login limiter | Five counted 401 responses within the window |
| Booking routes | 100 requests per 15 minutes |
| Booking creation | 20 requests per 15 minutes |
| Transaction routes | 100 requests per 15 minutes |

The failed-login limiter excludes non-401 responses from its retained count.

Counters are held in memory and reset on restart. They are not shared between API instances.

### 14.8 Additional Security Features

The reviewed snapshot includes:

1. A dedicated failed-login limiter.
2. Non-root execution of the API container.

The team must confirm that the selected controls qualify as additions beyond the earlier assessment baseline and provide functional evidence.

Existing JWT authentication, hashing and ownership checks must not be presented as newly added controls if they were already part of the previous submission.

## 15. Final Security Review

| Threat | Implemented controls | Remaining considerations |
| --- | --- | --- |
| NoSQL injection | Validation, sanitisation and controlled query construction | Test malicious nested input and query parameters |
| Cross-site scripting | React text rendering and relevant headers | Review unsafe HTML rendering and browser token exposure |
| Authentication abuse | bcrypt, JWT expiry, generic errors and rate limits | Test invalid tokens and failed-login boundaries |
| Broken access control | Roles, ownership and participant checks | Test cross-account reads and writes |
| Price tampering | Stored gig price used by server | Verify forged request prices are ignored |
| Secret disclosure | Ignored environment files, controlled logs and errors | Inspect commits and evidence exports |
| Container privilege abuse | API runs as non-root | Harden production database and network configuration |
| Dependency vulnerabilities | Manual npm audit commands | Resolve or document actual findings; CI has no audit gate |

Security controls reduce risk but require functional verification.

## 16. Troubleshooting

| Problem | Action |
| --- | --- |
| PowerShell blocks npm.ps1 | Use `npm.cmd` |
| EJSONPARSE | Remove Markdown fences/comments and correct JSON syntax |
| Lockfile mismatch | Intentionally update dependencies, review and commit both files |
| MongoDB connection failure | Check URI, credentials, server availability and network access |
| Browser fetch failure | Check API health, HTTPS certificates and configured URL |
| CORS error | Match `CLIENT_ORIGIN` to the exact frontend origin |
| Missing logger in Docker | Copy `utils/` in the API Dockerfile and rebuild |
| Compose rejects JWT secret | Set `JWT_SECRET` in root `.env` |
| Rate limit reached | Wait for the window or use an isolated test environment |
| Income is zero | Check identity, completed records and configured tax-year dates |
| Newman file not found | Restore missing files or correct script paths |
| Only Autograde appears | Commit `ci.yml` under root `.github/workflows/` |

## 17. Submission Evidence

| Requirement | Evidence |
| --- | --- |
| Final GitHub repository | Final pushed repository URL and commit |
| Final README | Accurate root README |
| Pipeline configuration | `.github/workflows/ci.yml` |
| Successful pipeline | Final run overview and expanded job output |
| Static analysis | Downloaded ESLint JSON report and interpretation |
| Containerisation | Both Dockerfiles and Compose configuration |
| Running containers | Fresh build, service status and application screenshots |
| Logging | Actual login, booking, transaction and error output |
| Additional security | Functional demonstration of two qualifying additions |
| Financial feature | Earnings, monthly chart, calculation and ownership checks |
| Demonstration video | Accessible final recording or link |

The supplied snapshot contains Docker screenshots under:

```text
evidence/part3/docker/
```

Refresh evidence after final integration fixes.

Evidence instructions in `docs/` are guidance, not proof that the checks have been executed.

Review screenshots and exports for credentials and tokens before submission.

## 18. Demonstration Video

The final demonstration should show:

1. Project overview and roles.
2. Docker services running.
3. Registration and login.
4. Freelancer gig creation.
5. Client browsing and booking.
6. Transaction recording.
7. Freelancer bookings and Earnings.
8. Tax breakdown and monthly chart.
9. Admin transactions, where an authorised account is available.
10. Access-control rejection.
11. Two additional security features.
12. Required log events.
13. GitHub Actions results and static analysis report.

The snapshot contains an older Part 1 demonstration video. Confirm its coverage and record a final demonstration of the completed version.

**Final video link:** Add the actual accessible recording URL before submission.

## 19. Limitations and Outstanding Work

Before submission:

- Add the missing `utils/` copy to the API Dockerfile.
- Include `utils/` in the backend package and syntax checks.
- Complete booking and transaction event logging.
- Demonstrate two qualifying additional security features.
- Review dependency vulnerability reports.
- Correct missing Newman collection/environment paths.
- Rerun tests and the containerised browser flow.
- Save final static analysis results.
- Add final evidence and video links.
- Replace historical verification statements with final commit-specific results.

Current limitations:

- Payments are simulated.
- No real payment gateway or refund workflow exists.
- No booking cancellation workflow is exposed.
- Booking and transaction consistency relies on compensating cleanup.
- Repeated booking requests can create separate bookings.
- HTTP idempotency is not implemented.
- Logout does not revoke JWTs server-side.
- Role changes may not affect existing tokens before expiry.
- Rate counters are process-local.
- Monitoring and retention are basic.
- API URLs are hardcoded for localhost.
- Tax rules are fixed to the implemented illustration year.

## 20. Contributions

The following table describes workstreams rather than verified individual authorship.

Replace workstream labels with actual member names and confirm attribution against the final commits.

| Workstream | Responsibility |
| --- | --- |
| Financial insights | Tax estimator, Earnings dashboard, financial tests and evidence |
| DevSecOps | GitHub Actions, quality checks, static analysis and pipeline evidence |
| Containerisation | Dockerfiles, Compose, setup and integrated demonstration |
| Logging and security | Event logging, additional controls, threat review and security evidence |

Each member contributes documentation and evidence for their work and participates in final integration verification.

## 21. References

Docker (n.d.) *Docker Compose*. Available at: https://docs.docker.com/compose/ (Accessed: 9 November 2026).

ESLint (n.d.) *Command line interface reference*. Available at: https://eslint.org/docs/latest/use/command-line-interface (Accessed: 9 November 2026).

GitHub (n.d.) *GitHub Actions documentation*. Available at: https://docs.github.com/en/actions (Accessed: 9 November 2026).

npm (n.d.) *npm-audit*. Available at: https://docs.npmjs.com/cli/v11/commands/npm-audit/ (Accessed: 9 November 2026).

OWASP Foundation (n.d.) *Logging cheat sheet*. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html (Accessed: 9 November 2026).

React (n.d.) *Quick start*. Available at: https://react.dev/learn (Accessed: 9 November 2026).

South African Revenue Service (n.d.) *Rates of tax for individuals*. Available at: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ (Accessed: 9 November 2026).
