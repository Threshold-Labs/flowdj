FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
COPY landing.html /usr/share/nginx/html/landing.html

# Redirect root to landing page
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  location = / { return 301 /landing.html; } \
  location / { try_files $uri $uri/ =404; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
