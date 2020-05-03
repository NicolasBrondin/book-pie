#!/bin/bash

# Need to find full cli alternative
# sudo raspi-config -> Boot options
# https://raspberrypi.stackexchange.com/questions/11958/running-npm-install-throws-permission-error
# https://www.raspberrypi.org/forums/viewtopic.php?t=25777

# Prepare startup script
cp ./startup.sh /etc/init.d/startup.sh && \
chmod 755 /etc/init.d/startup.sh && \
update-rc.d startup.sh defaults && \

# Install dependencies
apt-get update -y && \
apt-get install -y nodejs npm git mpg123 espeak espeak-data python && \
ln -s /usr/lib/arm-linux-gnueabihf/espeak-data/ /usr/share/espeak-data

wget https://nodejs.org/dist/v12.16.3/node-v12.16.3-linux-armv7l.tar.xz

# Install project
cd ~ && \
#git clone https://github.com/NicolasBrondin/pepe && \
#cp -R ./pepe ~/pepe && \
cd ./pepe && \
npm install && \
npm install pm2 -g && \
sh /etc/init.d/startup.sh

sudo apt-get purge nodejs
sudo apt-get purge npm
sudo apt autoremove

wget https://nodejs.org/dist/latest-v10.x/node-v10.20.1-linux-armv6l.tar.gz && \
tar -xzf node-v10.20.1-linux-armv6l.tar.gz && \
node-v10.20.1-linux-armv6l/bin/node -v && \
cd node-v10.20.1-linux-armv6l/ && \
sudo cp -R * /usr/local/
export PATH=$PATH:/usr/local/bin
cd ..
rm -rf node-v10.20.1-linux-armv6l/
rm -rf node-v10.20.1-linux-armv6l.tar.gz
