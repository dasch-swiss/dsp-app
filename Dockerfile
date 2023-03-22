FROM nginx:1

LABEL maintainer="support@dasch.swiss"

# set default internal port for the server
# can be overriden at runsite
ENV NGINX_PORT 4200
EXPOSE ${NGINX_PORT}

# Copy nginx configuration
COPY ./nginx/default.conf.template /etc/nginx/templates/
COPY ./nginx/nginx.conf /etc/nginx/
COPY ./nginx/nginx-security-headers.conf /etc/nginx/security-headers.conf

# Copy DSP-APP distribution to the public folder for serving
COPY ./dist/apps/dsp-app /public

# start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
