FROM alpine:latest
RUN apk add --no-cache inotify-tools
COPY lcpencrypt /usr/local/bin/lcpencrypt
COPY asset-encrypter.sh /usr/local/bin/asset-encrypter.sh
RUN chmod +x /usr/local/bin/lcpencrypt /usr/local/bin/asset-encrypter.sh
ENTRYPOINT ["/usr/local/bin/asset-encrypter.sh"]