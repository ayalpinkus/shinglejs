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
	mapsNodeRelations: true,
	//
	// memory settings
	// memory usage stats can be queried at http://host:port/baseUri/stats
	// with quads details: http://host:port/baseUri/stats?view=complete
	//
	// cache no more quads (relation mappings) than this value, only has impact when mapsNodeRelations = true
	memoryMaxQuadsToCache: 25,
	// the memory cleanup (discarding the excess quads above memoryMaxQuadsToCache) cycle time
	memoryCleanupCycleTime: 30,
	// warning when memory usage (resident set) exceeds this size in Mbytes
	// default is 256M, which in most cases is safe with a memoryMaxQuadsToCache value of 25
	// this can be used for (automated) monitoring, using host:port/baseUri/memoryMonitor
	// request to this page will only respond with a 200 response containting the text WARNING when the warning
	// level is exceeded, otherwise it will respond with a 404
	memoryUsageWarningThreshold: 256
};

module.exports = config;