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

# Mbrola
mkdir tmp_mbrola
cd tmp_mbrola
#wget http://www.tcts.fpms.ac.be/synthesis/mbrola/bin/pclinux/mbr301h.zip
wget http://www.tcts.fpms.ac.be/synthesis/mbrola/bin/raspberri_pi/mbrola.tgz
tar -xvzf mbrola.tgz
#unzip mbr301h.zip
#sudo cp mbrola-linux-i386 /usr/bin/mbrola
sudo cp mbrola /usr/bin/mbrola
#wget http://www.tcts.fpms.ac.be/synthesis/mbrola/dba/fr1/fr1.zip
wget http://tcts.fpms.ac.be/synthesis/mbrola/dba/fr4/fr4-990521.zip
#unzip en1-980910.zip
unzip fr4-990521.zip
sudo mkdir /usr/share/mbrola
#sudo cp en1/en1 /usr/share/mbrola/en1
sudo cp fr4-990521/fr4 /usr/share/mbrola/fr4
sudo cp fr4-990521/fr4 /usr/share/espeak-data/voices/fr4
cd ..
sudo rm -Rf ./tmp_mbrola/
#http://espeak.sourceforge.net/mbrola.html
# http://tcts.fpms.ac.be/synthesis/mbrola/dba/fr4/fr4-990521.zip

# Install project
cd ~ && \
#git clone https://github.com/NicolasBrondin/pepe && \
#cp -R ./pepe ~/pepe && \
cd ./pepe && \
npm install && \
npm install pm2 -g && \
sh /etc/init.d/startup.sh