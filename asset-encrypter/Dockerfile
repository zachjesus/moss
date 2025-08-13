FROM alpine:latest
RUN apk add --no-cache inotify-tools curl bash gcompat
COPY lcpencrypt /usr/local/bin/lcpencrypt
COPY asset-encrypter.sh /usr/local/bin/asset-encrypter.sh
RUN chmod +x /usr/local/bin/lcpencrypt /usr/local/bin/asset-encrypter.sh

RUN mkdir -p /assets /assets-encrypted && \
    chmod 755 /assets /assets-encrypted

ENTRYPOINT ["/usr/local/bin/asset-encrypter.sh"]