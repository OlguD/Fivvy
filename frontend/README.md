# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.17.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Theming

The application ships with a light/dark theme system driven by design tokens in `src/styles.css`. Theme state is handled through the `ThemeService`, which synchronizes the active theme with `localStorage` and applies it to the document root. To let users switch themes, drop the standalone `<fvy-theme-toggle />` component anywhere in a template; it uses the service under the hood.

Key points:

- Update or extend color variables inside the `:root` and `[data-theme='dark']` blocks in `styles.css`.
- Inject `ThemeService` when you need to set a specific theme programmatically: `const theme = inject(ThemeService); theme.setTheme('dark');`.
- All global and shared styles consume the same CSS variables to keep both themes consistent.

## Shared UI elements

Common form controls live under `src/app/shared`. They are standalone, so import them directly where needed:

- `FvyButtonDirective` – apply to `<button fvyButton>` or `<a fvyButton>` for consistent button styling. Optional inputs: `variant="primary | secondary | ghost"`, `size="sm | md | lg"`, and `[fullWidth]`.
- `FvyInputDirective` – apply to form inputs with `fvyInput` to get themed focus, error, and disabled states.
- `FormFieldComponent` – wrap inputs with `<fvy-form-field>` to display labels, hints, and validation messages without duplicating markup.
- `ThemeToggleComponent` – renders the theme switcher button mentioned above.

Using these primitives keeps login, register, and future pages visually aligned while reducing repetitive HTML/CSS.

## Dashboard experience

The dashboard (`src/app/pages/dashboard`) ships as a standalone component that consumes the shared button directive and `AuthService`. It presents:

- A hero card greeting the authenticated user with quick actions.
- Metric cards for revenue, invoices, projects, and new clients.
- A custom SVG line chart visualising the last 7 months of revenue (no external charting dependency).
- A conic-gradient donut illustrating invoice payment health, with legend details.
- Recent activity feed, team presence list, and actionable quick links.

All layouts are responsive and respect the global theme tokens. Add real data by swapping out the mock arrays in `dashboard.component.ts` with API calls once endpoints are ready.

## Backend integration

Authentication pages are wired to the ASP.NET API running at `http://localhost:5183` (configured in `app.config.ts`). To point at a different server, change the value provided for the `API_BASE_URL` injection token.

Endpoints the frontend calls:

- `POST /api/auth/login` with `{ username, password }` – expects credentials like `admin/admin` in development and returns `{ token, user }`.
- `POST /api/auth/register` with `{ username, name, surname, email, password, validatePassword }` – creates a new user and returns 200 OK on success.

The `AuthService` persists returned JWTs and user info in `localStorage`, exposes a `logout()` helper, and unifies error messages surfaced to the UI.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
