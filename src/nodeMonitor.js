'use strict'

class NodeMonitor
{
	constructor()
	{
		this.nodes = {}
	}

	addNode(nodeAddr)
	{
		this.nodes[nodeAddr] = true
	}

	getNodes()
	{

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