#!/bin/bash

giterror=0

fixgiterror()
{
	
	git stash
}

gitpull()
{
	#
	if [ $giterror = 1 ];then
		return 1
	fi
	failedtopull=0
	if [ $ENVIRONMENT = 'production' ]; then
		{ # try
	    	git pull origin master
		} || { # catch
			failedtopull=1
		}
	else
		{ # try
	    	git pull origin dev
		} || { # catch
			failedtopull=1
		}
	fi
	if [ $failedtopull = 1 ] && [ $giterror = 0 ];then
		giterror=1
		fixgiterror
		gitpull
	fi
}


setdate()
{
	date -s "$(wget -qSO- --max-redirect=0 google.com 2>&1 | grep Date: | cut -d' ' -f5-8)Z"
}

#we do not need to run this over and over in single device
#but we do need to run it in new devices...
updatemodules()
{
	yarn add  node-html-encoder
	yarn add string_decoder
}


main()
{
	#cd /root/kcs_forwarder/

	#ENVIRONMENT_VARIABLES
	##create env file is not exists
	if [ ! -f ./.env ]; then
		cp ./.env.example ./.env
		echo "Created Env file."
	fi
	set -a # export all variables created next
	source .env
	set +a # stop exporting

	#update first, just in case things are broken and it fails to start completely
	gitpull
	setdate
	updatemodules
	node app.js
}



#Entry point
main