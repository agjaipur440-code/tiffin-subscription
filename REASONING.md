# REASONING.md

## Thought Process

### Initial Approach
The first version of this project was a simple console-based Java application (`TiffinSubscription.java`) that handled customer management, plan subscription, and billing entirely through a terminal menu. This was built first to validate the core business logic: customers, plans (Basic/Standard/Premium), subscriptions, and bill calculation (`mealsPerDay × pricePerMeal × durationDays`).

### Scope Correction
On reviewing the actual assignment requirements more carefully, it became clear the submission needed to be a **full-stack product**, not a console app. The requirements specified:
- A real database with a sensible schema
- REST APIs for core operations, documented in the README
- A usable UI over those APIs
- User registration and login
- Search
- A landing page (what the product is, features, audience, next steps)
- Pagination and sorting

This meant the console application had to be discarded and rebuilt as a proper client-server web application.

### Technology Choices
- **Node.js + Express** was chosen for the backend because it's lightweight, quick to set up without heavy configuration, and works reliably inside GitHub Codespaces without extra tooling.
- **SQLite** (via the `sqlite3` npm package) was chosen for the database because it requires no separate server process, persists to a single file (`tiffin.db`), and is sufficient for the scale of this assignment while still being a "real" relational database with a proper schema (`users`, `plans`, `customers`, `subscriptions` tables with foreign keys).
- **JWT (jsonwebtoken) + bcryptjs** was used for authentication: passwords are hashed before storage, and a signed token is issued on login/register and required (via middleware) on all customer/subscription routes.
- **Plain HTML/CSS/JS** (no frontend framework) was used for the UI to keep the project simple, dependency-light, and easy to run without a build step — the browser loads static files served directly by Express.

### Database Schema Design
- `users` — one row per registered account (name, email, password hash).
- `plans` — seeded once with Basic/Standard/Premium, each with meals-per-day and price-per-meal.
- `customers` — belongs to a `user_id`, so each logged-in user only sees their own customers (data isolation via `WHERE user_id = ?` on every query).
- `subscriptions` — links a `customer_id` to a `plan_id`, stores duration and the computed `total_bill`, and can be cancelled (status flag) rather than deleted, to preserve history.

### API Design
Routes were split by resource (`/api/auth`, `/api/customers`, `/api/plans`, `/api/subscriptions`) so each route file has a single responsibility. Search, pagination, and sorting were implemented as query parameters on `GET /api/customers` (`search`, `page`, `limit`, `sortBy`, `order`) rather than separate endpoints, which is the conventional REST approach and keeps the API surface small.

## Testing & Debugging Approach

1. **Static analysis first**: before ever running the app, every JavaScript file was checked with `node --check` to catch syntax errors early, since the network-restricted development sandbox couldn't install npm packages to fully execute the server.
2. **Manual end-to-end testing in GitHub Codespaces**: once the code was moved into the actual Codespace (which has network access), `npm install` and `npm start` were run, and the app was opened in a browser to manually test:
   - Registering a new account
   - Logging in and confirming the dashboard loads (auth-gated)
   - Adding a customer and confirming it appears in the table
   - Searching by name and confirming the filtered result
   - Sorting/pagination controls
   - Subscribing a customer to a plan and confirming the calculated bill
3. **Issue encountered**: on first "Add Customer" attempt, the table initially appeared empty and the input fields still showed the typed values, which looked like a failure. On checking again after the page fully rendered, the customer had in fact been added successfully and appeared correctly in the table — this was a rendering/timing false alarm rather than an actual bug, confirmed by testing again and observing the table update as expected.
4. **Deployment/versioning issue**: the repository initially contained the old console-based `TiffinSubscription.java` file from an earlier commit. This was explicitly deleted from the `main` branch before the new full-stack code was added, to avoid confusion about which solution is the actual submission.
5. **Verification of source control**: after building all files inside the Codespace terminal, changes were verified with `git status`-style review before running `git add .`, `git commit`, and `git push`, and the GitHub repository was reloaded in the browser afterward to confirm all files (server.js, db.js, package.json, routes/, middleware/, public/) were present on `main`.

## Known Limitations / Next Steps
- No automated test suite (unit/integration tests) was added due to time constraints; testing was manual/exploratory.
- `node_modules` may have been committed as part of `git add .` since no `.gitignore` was set up before the first commit; this doesn't affect functionality since `npm install` reproduces the same dependencies.
- Planned next features (also listed on the landing page): online payment integration, delivery tracking, and custom meal-plan combos.
