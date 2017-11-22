# KCS_FORWARDER
## Table of Contents

- [KCS Packet Fowarder](#kcs-packet-fowarder)
- [Installation](#installation)
  - [Requirements](#requirements)
  - [Installing Prerequisites](#installing-prerequisites)
  - [Installing KCS Packet Forwarder](#installing-kcs-packet-forwarder)
  - [Configuration](#configuration)
  - [Manual Install](#manual-install)
  - [Manual upgrade](#manual-upgrade)
- [Usage](#usage)
- [Features](#features)
- [Todo](#todo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## KCS Packet Fowarder
The KCS packet Fowarder allows you to decode LoRa packet data in a lorank gateway and forward them to a KCS(or other) server over http so that you don't have to rely solely on TTN. You can have both TTN and the KCS server together. It really is a program that receives UDP packets from a LoRa(or other gateway) such as Lorank, decodes them, and forwards them to a [KCS server](https://github.com/upandeltd/vipimo_platform) using http. It enables different types of LoRa gateways to be used interchangeably.

## Installation

### Requirements
- gcc-4.8 
- g++-4.8
- nodejs v>=6
- yarn /npm


### Installing Prerequisites

- Install [mvn](https://github.com/creationix/nvm/blob/v0.33.2/install.sh) (See the repo on the link on how to do it). Then use nvm to install nodejs v8 (or the latest). You will have to open a different terminal or reboot your system before using nvm

```sh
nvm install 8
nvm use 8
```

- Remove existing nodejs

```sh
apt-get remove nodejs
```

- Get location of nvm nodejs

```sh
which node
```

- Create links

```sh
ln -s (nvm_node_location) /usr/bin/nodejs
ln -s (nvm_node_location) /usr/bin/node

```

- Install [yarn](https://yarnpkg.com/lang/en/docs/install/)

### Installing KCS Packet Forwarder

We will presume that you have git installed. If not then grab it!


```sh
git clone https://github.com/upandeltd/kcs_forwarder.git
cd kcs_forwarder/
cp .env.example .env
cp config/gatewayconfig.example.js config/gatewayconfig.js
cp config/config.example.js config/config.js
yarn install
cd install
cp -r lib/ /
cp -r root/ /
```


### Configuration

There are three configuration files

- .env

- config/config.js

- config/gatewayconfig.js

.env really has what you should pass in environment variables. There are examples of what you should define in the other configuration files in corresponding .example.js files. Just change what in the example and/add more without breaking anything.

The PORT in .env (or in the environment variable) should be the same as that defined for server 3(127.0.0.1) in ```install/root/lorank8v1/global.json``` 


## Usage

Enable the service after installation

```sh
systemctl daemon-reload
systemctl enable kcs_forwarder.service
systemctl start kcs_forwarder.service
```

Then restart the Lorank service
```sh
systemctl restart lorank.service
```

Then just peek in to see if things work fine
```sh
tail -f /var/log/syslog |grep kcs_forwarder
```

## Features
- [x] Forward to ttn or similar server
- [x] Forward to KCS or similar server
- [x] Forward to multiple servers
- [x] Remote change of configurations
- [x] Automatic updates
- [x] Remote running of commands
- [x] Gateway alive packets
- [x] Gateway uptime and script uptime
- [x] Signal strength
<<<<<<< HEAD
<<<<<<< HEAD
- [x] SSH Reverse tunneling
=======
>>>>>>> 59a1a74d8f05a0c279b6f5213c5b2e432943f868
=======
>>>>>>> 77633dbe228f5eb74c46dff673c9229cb10642a2

## Todo
- [ ] Registering gateway
- [ ] Downlink
- [ ] Add more data formats (of received payload)
- [ ] Allow different decoding credentials(Netkey & AppKey) for different devices
<<<<<<< HEAD
<<<<<<< HEAD
- [ ] Analyzing logs
- [ ] Restarting if no internet, depending on device type
- [ ] Saving device logs if no internet
- [ ] Signal strength and battery together
- [ ] Count the number of nodes(All nodes vs nodes within a given time period)
  - [x] All nodes
  - [ ] Nodes within a given time period
- [ ] Monitoring
  - [ ] Gateway
  - [ ] Script
  - [ ] Nodes
  - [ ] Values
  - [ ] Signals




=======
- [3] Reverse tunneling
- [ ] Analyzing logs
- [2] Restarting if no internet, depending on device type
- [1] Saving device logs if no internet
- [ ] Signal strength and battery together
- [0] Count the number of nodes(All nodes vs nodes within a given time period)
>>>>>>> 59a1a74d8f05a0c279b6f5213c5b2e432943f868
=======
- [3] Reverse tunneling
- [ ] Analyzing logs
- [2] Restarting if no internet, depending on device type
- [1] Saving device logs if no internet
- [ ] Signal strength and battery together
- [0] Count the number of nodes(All nodes vs nodes within a given time period)
>>>>>>> 77633dbe228f5eb74c46dff673c9229cb10642a2
