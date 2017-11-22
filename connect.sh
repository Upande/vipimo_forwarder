#!/bin/bash

echo "Waiting for network to create tunnel"
while ! ping -w 1 google.com; do
    #echo "Waiting ...network interface might be down..."
    sleep 1
done
echo "Going to create tunnel"

chmod 400 resources/vipimo.pem
while true; do
	ssh  -o StrictHostKeyChecking=no -i resources/vipimo.pem -R $1:localhost:22 -N vipimo@vipimo.co.ke
done &


