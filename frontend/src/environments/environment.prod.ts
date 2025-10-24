// Production environment used for `ng build --configuration production`.
// By default we use a relative API path so the SPA calls `/api/...` and
// nginx (the docker service) proxies those requests to the backend.
// If you want the SPA to call an external API directly, replace the
// empty string with the absolute URL (e.g. 'https://api.fivvy.com').
export const environment = {
  production: true,
  backendBaseUrl: ''
};
