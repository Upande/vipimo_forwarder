'use strict'

const to = require('await-to-js').to,
axios = require('axios'),
config = require('../config/config');

class NodeMonitor
{
	constructor()
	{
		this.nodes = {}
	}

	addNode(nodeAddr)
	{
		this.nodes[nodeAddr] = {}
	}

	getNodes()
	{

	}


	async getNodeCredentials(nodeAddr) {
		let self = this;
    	if (this.nodes[nodeAddr])
    		return this.nodes[nodeAddr]
    	
    	let vipimoServers = config.get("/vipimoserver");
    	// console.log(vipimoServers)

    	async function fetchNodeCredentials(server) {
    		return new Promise(function(resolve, reject){
    			if(self.nodes[nodeAddr])
    				return resolve(self.nodes[nodeAddr]);

    			let url = `${server}/${nodeAddr}`
    			console.log(url)
    			axios.get(url)
				.then(function (response) {
					if(response.data) {
						self.nodes[nodeAddr] = response.data
					}
					return resolve(response);
				})
				.catch(function (error) {
					return reject(error);
				});
    		})
    	}

    	let promises = vipimoServers.map(fetchNodeCredentials);
		let [err, care] = await to(Promise.all(promises));
		// console.log(self.nodes[nodeAddr])
		if(err) throw err
		return self.nodes[nodeAddr];
    }


	countNodes()
	{
		let i = 0;
		let j = 0;
		for(j in this.nodes)
			i++;
		return i;
	}
}

module.exports =  new NodeMonitor()