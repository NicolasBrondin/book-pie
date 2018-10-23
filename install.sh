#!/bin/bash

# Prepare startup script
cp ./startup.sh /etc/init.d/startup.sh && \
chmod 755 /etc/init.d/startup.sh && \
update-rc.d /etc/init.d/startup.sh defaults && \

# Install dependencies
apt-get update -y && \
apt-get install -y nodejs npm git mpg123 espeak espeak-data && \
ln -s /usr/lib/arm-linux-gnueabihf/espeak-data/ /usr/share/espeak-data

# Install project
cd ~ && \
#git clone https://github.com/NicolasBrondin/pepe && \
#cp -R ./pepe ~/pepe && \
cd ./pepe && \
npm install && \
sh /etc/init.d/startup.sh