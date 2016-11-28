/*
 *	SERVE map info and quads for use with Shingle.js
 *
 *	A config file is needed for each map you want to use mapServer for
 *
 *	Start mapserver using: node mapServer <mapConfigFile> (no need to supply .js extensions)
 */

// check startup parameters first
var arguments = process.argv.slice(2);

if(arguments.length < 1) {
	console.log('No map config file supplied');
	console.log('Usage: node mapServer <mapConfigFile>');
	process.exit(1);
}

// load supplied map config file
var configFile = arguments[0], config;
try {
	config = require("./" + configFile);
} catch(e) {
	console.log('Invalid map config file supplied');
	console.log(e);
	process.exit(1);
}

// check config file
if(!config.host || !config.port || !config.baseUri || !config.baseDir) {
	console.log('Map config file is missing required settings, see example config file for details');
	process.exit(1);
}

// set base
if(config.baseUri.substr(-1) != '/') config.baseUri += '/';
if(config.baseDir.substr(-1) != '/') config.baseDir += '/';

// load required modules
var fs = require("fs"),
	extend = require('util')._extend,
	express = require('express');

// load global mapinfo file
var data = loadFileSync('mapinfo.json');
if(!data) {
	console.log('Map config file does not use a valid baseDir, the directory does not exists, is not accessible or does not contain mapinfo.json');
	process.exit(1);
}

// mapinfo OK
var mapInfoStr = data.toString(),
	mapInfo = JSON.parse(mapInfoStr);

// check / create cache directory if needed
var cacheDir;
if(config.mapsNodeRelations) {
	// use specified dir or current directory named like config file
	cacheDir = config.cacheDir || 'cache-' + configFile.replace(/\.[^/.]+$/, "") + '/';

	if (!fs.existsSync(cacheDir)){
	    fs.mkdirSync(cacheDir);
	}
}

// prepare data objects
var root = extend({}, mapInfo.quadtree);
mapInfo.quadtree = {
	xmin: root.xmin,
	xmax: root.xmax,
	ymin: root.ymin,
	ymax: root.ymax
};

// global variables
var maxQuadRelations = config.maxQuadRelations || 100,
	memoryCleanupCycleTime = config.memoryCleanupCycleTime || 30,
	memoryMaxQuadsToCache = config.memoryMaxQuadsToCache || 25,
	memoryUsageWarningThreshold = config.memoryUsageWarningThreshold || 256,
	quadData = {};

// set a flag for the frontend
mapInfo.loadFromBackend = true;
mapInfo.backendMapsNodeRelations = config.mapsNodeRelations;

// global functions
function getPathLast(path) {
	var pathArr = path.split('/'),
		pathLast = pathArr.length ? pathArr[pathArr.length - 1] : false;

	// note it can contain a query string, strip this
	return pathLast.split('?')[0];
};
function loadFileSync(fileName) {
	try {
		var stats = fs.statSync(config.baseDir + fileName);
		return fs.readFileSync(config.baseDir + fileName);
	} catch(e) {
		return false;
	}
};
function loadFile(fileName, success, error) {
	fs.stat(config.baseDir + fileName, function(err, stat) {
		if(err == null) {
			fs.readFile(config.baseDir + fileName, function (err, data) {
				if (!err) {
					success(data.toString());
				} else {
					error(err);
				}
			});
		} else {
		    error(err.code);
		}
	});
};
function loadFromCache(fileName, onHit, onMiss, error) {
	var path = cacheDir + fileName;
	try {
		fs.stat(path, function(err, stat) {
			if(err == null) {
				fs.readFile(path, function (err, data) {
					if (!err) {
						onHit(data.toString());
					} else {
						error(err);
					}
				});
			} else {
			    onMiss();
			}
		});
	} catch (e) {
	    error(e);
	}
};
function writeCache(fileName, data, success, error) {
	fs.writeFile(cacheDir + fileName, data, function(err) {
		if(err && error) {
			error(err)
		} else {
			success && success();
		}
	}); 
};
function quadIntersects(screenrect, root) {
	if (root.xmin < screenrect.xmax && root.xmax > screenrect.xmin &&
		root.ymin < screenrect.ymax && root.ymax > screenrect.ymin) {
		return true;
	}
	return false;
};
function findQuadsToDraw(screenrect) {
	var quadid = "quad_",
		quads = [];

	findQuadsToDrawRecursive(screenrect, root, quadid, quads);
	return quads;
};
function findQuadsToDrawRecursive(screenrect, root, quadid, quads) {

	if (quadIntersects(screenrect, root)) {
		if (root["type"] == "Leaf") {
			quads.push(quadid);
		} else {
			findQuadsToDrawRecursive(screenrect, root.left, (quadid + "l"), quads);
			findQuadsToDrawRecursive(screenrect, root.right, (quadid + "r"), quads);
		}
	}
};

// process quads
// - relations
// - max #relations to return
function initQuad(quadid) {
	if(!quadData[quadid]) {
		quadData[quadid] = {
			processing: false,
			requests: 0,
			lastTimeStamp: 0,
			fromCache: 0,
			fromMemory: 0,
			processed: 0,
			flushed: 0,
			err1NotFound: 0,
			err2NotFound: 0,
			errCacheMiss: 0,
			nodeRelations: {}
		};
	}
}
function processQuad(quadid, data, callback) {

	quadData[quadid].processing = true;

	try {
		var quad = JSON.parse(data),
			relations = [],
			nodeRelations = {},
			nodeMap = {};

		if(quad.relations && quad.relations.length) {

			var relationsToProcess = quad.relations;
			delete quad.relations;

			// first assemble the relations to return (to draw always)
			// max # relations to return, this should be a parameter / setting in shingle
			for (var i = 0; i < Math.min(relationsToProcess.length, maxQuadRelations); i++) {
				relations.push(relationsToProcess[i]);
			};
			quad.relations = relations;

			// callback can be done now, findRelation waits for below to finish async
			callback(quad);

			// create the node relations mapping
			for (var i = 0; i < relationsToProcess.length; i++) {

				var entry = relationsToProcess[i];

				if(entry.nodeidA && entry.nodeidB) {
					if(!nodeRelations[entry.nodeidA]) nodeRelations[entry.nodeidA] = {
						quad: entry.quadA,
						toNodes: []
					};
					if(!nodeRelations[entry.nodeidB]) nodeRelations[entry.nodeidB] = {
						quad: entry.quadB,
						toNodes: []
					};
					nodeRelations[entry.nodeidA].toNodes.push({
						node: entry.nodeidB,
						quad: entry.quadB,
					});
					nodeRelations[entry.nodeidB].toNodes.push({
						node: entry.nodeidA,
						quad: entry.quadA,
					});
				}
			};

			// cache the node relations
			writeCache(quadid + '-node-relations.json', JSON.stringify(nodeRelations), function() {
				quadData[quadid].processing = false;
			}, function(e) {
				quadData[quadid].processing = false;
				console.log(e);
			});
			quadData[quadid].processed = 1;
			quadData[quadid].nodeRelations = nodeRelations;

		} else {
			callback(quad);
		}
	} catch(e) {
		console.log(e);
		callback(false);
		quadData[quadid].processing = false;
	}
};

// get quad, static version
function getQuadStatic(quadName, res) {
	loadFile(quadName, function(data) {

		res.setHeader('Content-Type', 'application/json');
		res.send( data );

	}, function(err) {
		res.sendStatus(404);
	});
};

// get quad from cache using maxQuadRelations and relation mapping
function getQuad(quadName, res) {

	var quadid = quadName.split('.json')[0],
		quadFileName = quadName + '-' + maxQuadRelations +'.json';

	initQuad(quadid);

	loadFromCache(quadFileName, function(data) {
		// cache hit
		res.setHeader('Content-Type', 'application/json');
		res.send( data );
	}, function() {
		// cache miss, create
		loadFile(quadName, function(data) {

			processQuad(quadid, data, function(quad) {

				if(quad && quad.relations) {
					res.setHeader('Content-Type', 'application/json');
					res.send( JSON.stringify(quad) );
					writeCache(quadFileName, JSON.stringify(quad));
				} else {
					res.sendStatus(500);
				}
			});
		});
	}, function(err) {
		res.sendStatus(404);
	});
};

// function for sorting quad data descending on use
function sortQuadData() {
	var quadArr = [];
	for (var quad in quadData) {
		if (quadData.hasOwnProperty(quad)) {
            quadArr.push({
                quad: quad,
                props: quadData[quad]
            });
        }
    }
    quadArr.sort(function(a, b) {
        return b.props.lastTimeStamp - a.props.lastTimeStamp;
    });
    return quadArr;
};

//
// upon start set the getQuad function once to the version to use
var getQuad = mapInfo.backendMapsNodeRelations ? getQuad : getQuadStatic;

// create / start the mapinfo server
var app = express();

// cors, allow from all for now ..
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// when no php proxy: app.use(express.compress());
// cors, allow from all for now ..
/*
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}, express.compress());
*/

// main mapinfo
app.get(config.baseUri + 'mapinfo.json', function (req, res, next) {
	res.setHeader('Content-Type', 'application/json');
	res.end( JSON.stringify(mapInfo) );
});


/*
 * findRelations
 * url parameters:
 * - nodeid
 */
app.get(config.baseUri + 'findRelations', function (req, res, next) {

	// get and return the relations
	function returnRelations() {
		quadData[req.query.quadid].requests++;
		quadData[req.query.quadid].lastTimeStamp = new Date().getTime();
	 	if(quadData[req.query.quadid].nodeRelations[req.query.nodeid]) {
			quadData[req.query.quadid].fromMemory++;
			res.setHeader('Content-Type', 'application/json');
			res.end( JSON.stringify(quadData[req.query.quadid].nodeRelations[req.query.nodeid]) );
		} else {
			loadFromCache(req.query.quadid + '-node-relations.json', function(data) {
				// cache hit
				quadData[req.query.quadid].nodeRelations = JSON.parse( data );

				// should be there now
			 	if(quadData[req.query.quadid].nodeRelations[req.query.nodeid]) {
					quadData[req.query.quadid].fromCache++;
					res.setHeader('Content-Type', 'application/json');
					res.end( JSON.stringify(quadData[req.query.quadid].nodeRelations[req.query.nodeid]) );
				} else {
					quadData[req.query.quadid].err1NotFound++;
					res.sendStatus(404);
				}
			}, function() {
				// cache miss, this should never happen
				quadData[req.query.quadid].errCacheMiss++;
				res.sendStatus(500);
			}, function(err) {
				quadData[req.query.quadid].err2NotFound++;
				res.sendStatus(500);
			});
		}
	};

	// the quad in which relations are has been fetched but it may be still processing
	if(req.query.quadid && req.query.nodeid) {

		initQuad(req.query.quadid);
		if(quadData[req.query.quadid].processing) {

			// wait quad being processed
			var tries = 0,
				watcher = setInterval(function() {

					tries++;
					if(!quadData[req.query.quadid].processing) {
						clearInterval(watcher);
						returnRelations();
					} else {
						if(tries > 99) {
							clearInterval(watcher);
							returnRelations();
						}
					}

				}, 50);
	
		} else {
			returnRelations();	
		}
	}
});

// stats backend pages
app.get(config.baseUri + 'memoryMonitor', function (req, res, next) {
	var memoryUsage = process.memoryUsage(),
		threshold = memoryUsageWarningThreshold * 1024 * 1024;

	if(memoryUsage && memoryUsage.rss > threshold) {
		res.setHeader('Content-Type', 'text/html');
		res.end( 'WARNING' );
	} else {
		res.sendStatus(404);
	}
});
app.get(config.baseUri + 'stats', function (req, res, next) {
	var viewComplete = req.query.view && req.query.view.toLowerCase() == 'complete',
		quadArr = sortQuadData(),
		stats = {
			memoryUsage: process.memoryUsage(),
			quadCount: quadArr.length,
			quadsWithRelationsCount: 0,
			totalRelationsCount: 0
		};

	if(viewComplete) stats.allQuads = [];

	for (var i = 0; i < quadArr.length; i++) {

		var qStats = quadArr[i].props,
			relationCount = Object.keys(qStats.nodeRelations).length;

		if(relationCount) {
			stats.quadsWithRelationsCount++;
			stats.totalRelationsCount += relationCount;
		}

		if(viewComplete) {
			stats.allQuads.push({
				quad: quadArr[i].quad,
				processing: qStats.processing,
				requests: qStats.requests,
				lastDt: (qStats.lastTimeStamp > 0) ? new Date(qStats.lastTimeStamp).toUTCString() : '',
				fromCache: qStats.fromCache,
				fromMemory: qStats.fromMemory,
				processed: qStats.processed,
				flushed: qStats.flushed,
				currentInMemory: Object.keys(qStats.nodeRelations).length,
				cacheMisses: qStats.errCacheMiss,
				cacheError1: qStats.err1NotFound,
				cacheError2: qStats.err2NotFound
			});
		}
	};

	res.setHeader('Content-Type', 'application/json');
	res.end( JSON.stringify(stats) );
});

/*
 * findQuads
 * url parameters (screenrect):
 * - xmin
 * - ymin
 * - xmax
 * - ymax
 */
app.get(config.baseUri + 'findQuads', function (req, res, next) {

	//find in root based on screenrect and quad coordinated
	if(req.query.xmin && req.query.ymin && req.query.xmax && req.query.ymax) {
		var quads = findQuadsToDraw({
			xmin: req.query.xmin,
			ymin: req.query.ymin,
			xmax: req.query.xmax,
			ymax: req.query.ymax
		});
		res.setHeader('Content-Type', 'application/json');
		res.end( JSON.stringify(quads) );
	}
});

// tables
app.get(config.baseUri + 'table*.json', function (req, res, next) {

	var tableName = getPathLast(req.originalUrl);

	if(tableName) {
		loadFile(tableName, function(data) {
			res.setHeader('Content-Type', 'application/json');
			if(req.query.nodeid) {
				var tabObj = JSON.parse(data),
					resObj = {};

				if(tabObj[req.query.nodeid]) {
					resObj[req.query.nodeid] = tabObj[req.query.nodeid];
				}
				res.send( JSON.stringify(resObj) );
			} else {
				res.send( data );
			}
		}, function(err) {
			res.sendStatus(404);
		});
	} else {
		res.sendStatus(404);
	}
});

// quads
app.get(config.baseUri + 'quad*.json', function (req, res, next) {

	var quadName = getPathLast(req.originalUrl);

	if(quadName) {
		getQuad(quadName, res);

	} else {
		res.sendStatus(404);
	}
});

//
// start the server
var server = app.listen(config.port, config.host, function () {
	var host = server.address().address
	var port = server.address().port

	console.log('Running SingleJS map server at http://%s:%s%s', host, port, config.baseUri);
	console.log('Using baseDir: ', config.baseDir);
	console.log('Using mapinfo: ', mapInfo);
});

//
// start background cleanup
setInterval(function() {
	var	quadArr = sortQuadData();

	// remove nodeRelations of quads not in top memoryMaxQuadsToCache last requested
	if(quadArr.length > memoryMaxQuadsToCache) {
		for (var i = memoryMaxQuadsToCache; i < quadArr.length; i++) {
			var quad = quadArr[i].quad,
				relationCount = Object.keys(quadData[quad].nodeRelations).length;

			if(relationCount) {
				quadData[quad].flushed++;
				quadData[quad].nodeRelations = {};
				quadData[quad].flushed++;
			}
		};
	}
}, memoryMaxQuadsToCache * 1000);