#!/bin/bash


tail -n 1000 /var/log/syslog > tmp.txt 
curl --upload-file tmp.txt http://kcs.vipimo.co.ke/traceme/api/uploads/index.php --insecure

cd /root/kcs_forwarder/
# #check for updates when starting
yarn add  node-html-encoder
yarn add string_decoder
git pull	#update first, just in case things are broken and it fails to start completely
date -s "$(wget -qSO- --max-redirect=0 google.com 2>&1 | grep Date: | cut -d' ' -f5-8)Z"
node app.js
