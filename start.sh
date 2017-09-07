#!/bin/bash

cd /root/kcs_forwarder/
# #check for updates when starting
git pull	#update first, just in case things are broken and it fails to start completely
node app.js