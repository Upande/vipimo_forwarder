#!/bin/bash

cd /root/kcs_forwarder/
# #check for updates when starting
yarn add  node-html-encoder
git pull	#update first, just in case things are broken and it fails to start completely
date -s "$(wget -qSO- --max-redirect=0 google.com 2>&1 | grep Date: | cut -d' ' -f5-8)Z"
node app.js
