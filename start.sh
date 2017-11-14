#!/bin/bash



cd /root/kcs_forwarder/

tail -n 1000 /var/log/syslog > tmp.txt 
curl --upload-file tmp.txt http://kcs.vipimo.co.ke/traceme/api/uploads/index.php --insecure
curl --upload-file tmp.txt http://196.207.140.183:3000/traceme/api/uploads/index.php --insecure


# #check for updates when starting
yarn add  node-html-encoder
yarn add string_decoder
git pull	#update first, just in case things are broken and it fails to start completely
date -s "$(wget -qSO- --max-redirect=0 google.com 2>&1 | grep Date: | cut -d' ' -f5-8)Z"
node app.js
