#!/bin/bash


checktime=2	 #time in minutes after which to check for connection
restarttime=10 #time after which to restart if no connection

#times in seconds
checktime=$((checktime * 60))
restarttime=$((restarttime * 60))
numechecktimes=$((restarttime / checktime))

function checkconnection(){
	local isconnected=1
	while ! ping -w 1 google.com >> /dev/null; do
		isconnected=0
	    break
	done
	echo $isconnected
}


numchecked=0
while :			#continuously check for internet
do
   # echo "Pres CTRL+C to stop..."
   {
   		connection=$(checkconnection)
   		if [ $connection = 0 ] ; then
   			echo no connection
   			numchecked=$((numchecked + 1))
   			echo CHECKED
   			echo $numchecked

   			if [ $numchecked = $numechecktimes ]; then
   				reboot	#reboot
   			fi
   		else
   			numchecked=0
   		fi
   		sleep $checktime
   }
 #   if (disaster-condition)
 #   then
	# break       	   #abandon the loop.
 #   fi
done