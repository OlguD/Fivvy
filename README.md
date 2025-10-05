# Fivvy API

## Overview
Fivvy API is an ASP.NET Core 9.0 backend that powers an invoicing and client/project management platform. It exposes REST endpoints for authentication, profile management, client onboarding, and project tracking. Entity Framework Core with SQLite persists the domain, while JWT-based authentication secures all business operations.

## Tech Stack & Dependencies
- **Runtime:** .NET 9 (ASP.NET Core Minimal Hosting model).
- **Persistence:** Entity Framework Core 9 with SQLite provider.
- **Security:** `Microsoft.AspNetCore.Authentication.JwtBearer`, `System.IdentityModel.Tokens.Jwt`, BCrypt password hashing.
- **API Tooling:** Swashbuckle/OpenAPI for interactive docs (enabled in Development).
- **Utilities:** Custom JWT helper and HTTP authorization header extractor for token parsing.

## Architecture Snapshot
- **Program startup** wires up Swagger, SQLite `AppDbContext`, JWT authentication, and controller-based routing.
- **Controllers** (`AuthController`, `ProfileController`, `ClientController`, `ProjectController`) orchestrate request handling and enforce authorization.
- **Repositories** encapsulate data access and business rules (user, client, and project aggregates), relying on `AppDbContext` and user context extracted from JWTs.
- **Models** represent persisted entities (`UserModel`, `ClientModel`, `ProjectModel`, `InvoiceModel`) alongside request DTOs for all incoming payloads.
- **Utilities & Helpers** provide JWT generation/validation, Authorization header parsing, and simple password confirmation logic.

## Authentication & Authorization
- Users register and log in via `/api/auth/register` and `/api/auth/login`. Credentials are validated using BCrypt hashes stored in the database.
- `JwtHelper` issues signed Bearer tokens containing the user ID and email. The secret, issuer, audience, and expiry are configured under `JwtSettings` (mirrored in `.env`).
- All protected controllers require the bearer token. `AuthHeaderHelper` centralizes token extraction, and repositories call `IUserRepository.ExtractUserIdFromToken` to scope data to the authenticated owner.

## Domain Models & Business Rules
- **Users** own collections of clients and inherit default roles and creation timestamps. Auth flow zeros out password fields before returning responses.
- **Clients** capture company/contact information, belong to a single user, and record creation times. CRUD operations enforce ownership via JWT-derived user IDs.
- **Projects** reference clients and validate that the requesting user owns the related client. Business rules include mandatory name/description and chronological date validation (`StartDate <= EndDate`).
- **Invoices** exist in the schema with amount precision configuration; repository endpoints are forthcoming.

Entity Framework precision configuration ensures currency stability on `InvoiceModel.Amount` and `UserModel.TotalIncome`.

## REST Endpoints (current state)
| Area | Method | Route | Auth | Notes |
| --- | --- | --- | --- | --- |
| Auth | POST | `/api/auth/login` | No | Form-data login; returns JWT and minimal user payload.
| Auth | POST | `/api/auth/register` | No | Form-data registration with password confirmation.
| Profile | GET | `/api/profile/me` | Yes | Returns user profile with nested clients/projects/invoices.
| Profile | PUT | `/api/profile/me/update-profile` | Yes | Updates profile & password after validation.
| Clients | GET | `/api/client/clients` | Yes | Lists all clients owned by the token holder.
| Clients | POST | `/api/client/add-client` | Yes | Adds a client; empty optional fields default to placeholder strings.
| Clients | PUT | `/api/client/update-client` | Yes | Updates client details by ID.
| Clients | DELETE | `/api/client/remove-client` | Yes | Deletes a client owned by the user.
| Projects | GET | `/api/project/all-projects` | Yes | Lists projects filtered by ownership of their clients.
| Projects | POST | `/api/project/add-project` | Yes | Adds project after date/name validation and ownership check.
| Projects | PUT | `/api/project/update-project` | Yes | Updates project fields; protects against cross-user edits.
| Projects | DELETE | `/api/project/remove-project` | Yes | Deletes a project if owned via its client relationship.

Swagger UI is served at the root (`/`) in development (`ASPNETCORE_ENVIRONMENT=Development`), offering live documentation and testing.

## Database & Migrations
- Local persistence uses the bundled `fivvy.db` SQLite database.
- Recent migrations capture key milestones:
  - `20251001204758_InitialCreate` – Base schema for users, clients, invoices, and projects.
  - `20251002234307_AddUserIdToClient` – Enforces ownership link between clients and users.
  - `20251004175550_AddCreatedAtToClients` – Adds creation timestamp and non-null company name.
  - `20251004180109_AddCreatedAtToClientsNew` – Adjusts default values for the new column.
  - `20251005145758_UpdateProjectClientRelation` – Tightens project-to-client ownership by enforcing non-null `ClientId`.

To recreate the database locally:
```bash
cd backend/Fivvy.Api
dotnet restore
dotnet ef database update
```

Run the API:
```bash
dotnet run
```

## Configuration
- `appsettings.json` stores the SQLite connection string and JWT parameters.
- `.env` currently mirrors the JWT secret, enabling alternative configuration mechanisms if needed.
- Adjust `JwtSettings:Issuer/Audience/Secret` for different environments and regenerate tokens accordingly.

## Open Items & Future Enhancements
- `PDFRepository` and `IPDFRepository` are placeholders for invoice export; implementation is pending.
- `ProjectController` contains a TODO to refine request model integration and richer validation responses.
- No dedicated invoice endpoints yet; the schema is ready for expansion.
- Consider strengthening password policies and adding fluent validation for request DTOs.

## Testing & Tooling Notes
- Swagger-driven manual testing is available out of the box.
- Add automated tests (e.g., xUnit + integration tests) as the next iteration to guard repository logic and auth flows.

Happy shipping!
