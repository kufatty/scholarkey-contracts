ARG QUORUM_VERSION=latest

FROM quorumengineering/quorum:${QUORUM_VERSION}

RUN apk add --no-cache curl bash

COPY docker-entrypoint.sh /usr/local/bin/
COPY data data

# Ensure entrypoint has Unix line endings and is executable
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

RUN mkdir -p /data /permissions /var/log/quorum \
    && addgroup -g 1000 quorum \
    && adduser -u 1000 -G quorum -s /bin/sh -D quorum \
    && chown -R quorum:quorum /data /permissions /var/log/quorum 
USER quorum

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]