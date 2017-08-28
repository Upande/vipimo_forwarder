'use strict'
const lora_packet = require('lora-packet');
const config = require('../config/config');
const request = require('request');
const parser = require('./parser.js');
const shell = require('shelljs');

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
				self.updatemodules();
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

	static updatemodules()
	{
		console.log("will now try to update node modules...")
		let cmd = 'npm install';
		let child = shell.exec(cmd, {async:true, silent:true});
		child.stdout.on('data', function(data) {
			console.log(data)
		});

	}
}


module.exports = kcs_forwarder