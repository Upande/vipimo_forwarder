'use strict'
const lora_packet = require('lora-packet');
const config = require('../config/config');
const gatewayconfig = require('../config/gatewayconfig');
const request = require('request');
const parser = require('./parser.js');
const shell = require('shelljs');
const Async = require('async');


class kcs_forwarder extends parser
{
	static updates()
	{
		let self= this;
		self.checkforupdates(function(err, updated){
			if(err)return;
			if(updated === true)
			{
				console.log(updated)
				// self.updatemodules();
			}
		})
		
	}

	static checkforupdates(callback)
	{
		console.log("checking for updates...")
		let cmd = 'git pull';
		let child = shell.exec(cmd, {async:true, silent:true});
		child.stdout.on('data', function(data) {
			console.log(data)
			let noupdates = data.match(/up-to-date/);
			console.log(noupdates)
			if(noupdates)return callback(null, false);
			return callback(null, true);	//updates found and updated
		});
	}

	// static updatemodules()
	// {
	// 	console.log("will now try to update node modules...")
	// 	let cmd = 'npm install';
	// 	let child = shell.exec(cmd, {async:true, silent:true});
	// 	child.stdout.on('data', function(data) {
	// 		console.log(data)
	// 	});
	// 	//restart service after 3 minutes (assume npm is done)
	// 	setTimeout(function() { 
	// 		let cmdi = 'systemctl restart kcs_forwarder.service';
	// 	  	let childi = shell.exec(cmdi, {async:true, silent:true});
	// 		childi.stdout.on('data', function(data) {
	// 			console.log(data)
	// 		});
	// 	}, config.get('/intervals/restartservice'));

	// }

	static gatewayreports(callback)
	{

		let self = this;
		self.gatewayalive(function(err, result){})
		self.gatewayupdate(function(err, result){})
	}

	static gatewayalive(callback)
	{
		let gatewayaliveendpoints = config.get("/gatewayendpoints/alive");
		let gatewayIMEI = gatewayconfig.get("/IMEI");
		Async.each(gatewayaliveendpoints, function(url, callback) {

		    let sendto = url +gatewayIMEI+"|PVNZjzLw0vFM6g0000000Qc000000000000000000000";
		    console.log('Sending to  ' + sendto);

		    request(sendto, function (error, response, body) {
				// console.log('error:', error); // Print the error if one occurred 
				//console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
				console.log("Sent to KCS")
				console.log('from kcs:', body); // Print the HTML for the Google homepage. 
				console.log(body.match(/\+CLI(.)*/ig))
				let commands = body.match(/\+CLI(.)*/ig);
				Async.each(commands, function(command, callback_inner) {
					command = command.replace(/\+CLI([.]*)/ig, '$1');

					let cmd = command;
					let child = shell.exec(cmd, {async:true, silent:true});
					child.stdout.on('data', function(data) {
						console.log(data)
						callback_inner();
					});
					
					// callback_inner();
				});
				if(error)callback(error)
				else callback()

			});
		}, function(err) {
		    // if any of the file processing produced an error, err would equal that error
		    if( err ) {
		      console.log(' '+err);
		    } else {
		      // console.log('...');
		    }
		});
	}

	static gatewayupdate(callback)
	{
		console.log("willupdate gateway...")
		callback();
	}
}


module.exports = kcs_forwarder