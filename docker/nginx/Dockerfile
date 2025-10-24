FROM nginx:1.29.2-alpine

# Copy built frontend files from the frontend build image (tagged 'fivvy-frontend-build').
# Some Angular build setups output the actual static files under a `browser/` subfolder
# (e.g. /app/dist/frontend/browser). To support both layouts we first copy the
# `browser/` contents into nginx's html root, then copy any top-level files from
# `/app/dist/frontend` (licenses, prerendered-routes, etc.). This ensures that
# index.html from the browser build ends up at /usr/share/nginx/html/index.html.
COPY --from=fivvy-frontend-build /app/dist/frontend/browser/ /usr/share/nginx/html/
COPY --from=fivvy-frontend-build /app/dist/frontend/ /usr/share/nginx/html/

# Copy nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
