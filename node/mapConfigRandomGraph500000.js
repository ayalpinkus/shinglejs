/*
 *	map config for use with mapServer.js
 *
 *	NOTE: use one config file for each map you want to use the mapServer for
 *
 *	Start mapserver using: node mapServer <mapConfigFile> (no need to supply .js extensions)
 */

var config = {
	// host and port to listen on, required
	host: 'localhost',
	port: '8088',
	// the base url to listen on, required
	baseUri: '/shinglejs/random-graph_500000/',
	// the base directory in which the map file reside (mapinfo, table*.json, quad*.json, ..), required
	baseDir: '/<path>/<to>/random-graph_500000',
	// setting this to false might be useful with small quad files
	mapsNodeRelations: false
};

module.exports = config;