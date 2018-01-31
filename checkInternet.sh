#!/bin/bash


checktime=2	 #time in minutes after which to check for connection
restarttime=10 #time after which to restart if no connection

#times in seconds
checktime=$((checktime * 60))
restarttime=$((restarttime * 60))
numechecktimes=$((restarttime / checktime))

function checkconnection(){
	local isconnected=1
	while ! ping -w 1 8.8.8.8 > /dev/null 2>&1; do #how to ping if no internet but connection is available
		isconnected=0
	    break
	done
	echo $isconnected
}

function setdate()
{
	date -s "$(wget -qSO- --max-redirect=0 google.com 2>&1 | grep Date: | cut -d' ' -f5-8)Z"
}

function reversetunnel(){
	{
		{
			chmod 400 resources/vipimo.pem > /dev/null 2>&1
		}||{
			echo "Error setting file permissions or connecting"
			return 1
		}
	}&&{
		{
			
			{
				ssh  -f -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes -i resources/vipimo.pem -R $1:localhost:22 -N vipimo@kcs.vipimo.co.ke

			}||{
				ssh-keygen -f "/root/.ssh/known_hosts" -R kcs.vipimo.co.ke
			}||{
				mv /root/.ssh/known_hosts /root/.ssh/known_hosts.bac
			}

		}||{
			echo "Error creating tunnel"
			return 2
		}
		
	}
}


numchecked=0
while :			#continuously check for internet
do
   {
   		connection=$(checkconnection)
   		if [ $connection = 0 ] ; then
   			numchecked=$((numchecked + 1))
   			echo CHECKED $numchecked of $numechecktimes

   			# if [ $numchecked > $numechecktimes ]; then
   			if [ "$numchecked" -ge "$numechecktimes" ]; then
   				echo "Restarting because of no internet"
   				reboot
   				# echo reboot	#reboot
   			fi
   		else
   			echo CHECKED $numchecked of $numechecktimes
   			numchecked=0
   			reversetunnel $1
   			setdate
   		fi
   		sleep $checktime
   }
done