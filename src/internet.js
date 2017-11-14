'use strict'

class cs_Internet
{

	constructor(){}

	checkConnection(callback)
	{
		require('dns').lookup('google.com',function(err) {
        if (err /*&& err.code == "ENOTFOUND"*/) {
            callback(null, false);
        } else {
            callback(null, true);
        }
    })
	}


}

module.exports = new cs_Internet()