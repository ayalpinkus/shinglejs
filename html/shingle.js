var shingle = shingle || (function () {

	var instances = 0,
		graph = function (settings, instance) {

		// Begin editable parameters
		var options = settings || {},
			defaults = {
				// these are equal to the possible settings
				// commented lines represent other option values
				useBitmap: false,
				NULLnodeName: 'unknown',
				hideNULLnameNodes: false,
				enableNULLnameNodes: false,
				translateOffsetX: 0,
				translateOffsetY: 0,
				width: '100%',
				height: '2in',
				nodeField: "nodeid",
				nodeId: "",
				renderWhenNodeNotFound: true,
				graphPath: null,
				initialZoom: 20,
				selectNodes: true,
				panning: true,
				staticMap: false,
				zoomSlider: true,
				zoomStep: 5,
				dragTimeThreshold: 100,
				scrollZoomInitDelay: 400,
				scrollZoom: true,
				showRelatedNodeNames: false,
				//showRelatedNodeNames: true,
				//showRelatedNodeNames: 'hover',
				containerClass: 'shingle-container',
				containerWithFocusClass: 'shingle-with-focussed-node',
				scaleElClass: 'shingle-scaling',
				translationElClass: 'shingle-translation',
				boundingRectElClass: 'shingle-bounding-rect',
				bitmapcontainerClass: 'shingle-bitmap-container',
				linescontainerClass: 'shingle-lines-container',
				highlightedlinescontainerClass: 'shingle-highlighted-lines-container',
				nodescontainerClass: 'shingle-nodes-container',
				highlightednodescontainerClass: 'shingle-highlighted-nodes-container',
				highlightednamescontainerClass: 'shingle-highlighted-names-container',
				nodeClass: 'shingle-node',
				nodeTextClass: 'shingle-node-text',
				highlightedNodeTextClass: 'shingle-node-h-text',
				mapClass: 'shingle-map',
				quadClass: 'shingle-quad',
				debugQuadClass: 'shingle-debug-quad',
				debugNodeClass: 'shingle-debug-node',
				nodeColors: [[240, 188, 0], [178, 57, 147], [39, 204, 122], [21, 163, 206], [235, 84, 54], [138, 103, 52], [255, 116, 116], [120, 80, 171], [48, 179, 179], [211, 47, 91]],
				defaultNodeColor: [214, 29, 79],
				edgeColor: [213, 213, 213],
				edgeHighlightColor: [0, 0, 0],
				fontColor: [5, 87, 119, 0.6],
				quadDebugColors: [[240, 188, 0], [178, 57, 147], [39, 204, 122], [21, 163, 206], [235, 84, 54], [138, 103, 52], [255, 116, 116], [120, 80, 171], [48, 179, 179], [211, 47, 91]],
				nodeRadiusScaleFactor: 1/50.0 ,
				nodeRadiusScalePower: 1.25 ,
				nodesGrow: false,
				fontFamily: "sans",
				fontSize: 18,
				relatedNodesFontSize: 18,
				textGrow: false,
				textShrink: false,
				infoSyncDelay: 100,
				//lineType: "Straight",
				lineType: "EllipticalArc",
				hoverDelay: 100,
				debug: false,
				debugQuads: false,
				calcBoundingRectDimsMethodExperimental: false,
				useMultipleQuadsLoader: true,
				quadDisplayThreshold: 0.25
			};

		// global private vars
		var nodeInfo, makeLineElement,
			xmlns = "http://www.w3.org/2000/svg",
			mapinfo = null,
			graphs = {},
			nodeRadiusScale = 1.0 / 100.0,
			nodeEdgeRadiusScale = 1 / 500.0,
			baseScale = null,
			fontScale = null,
			minScale = 0.01,
			maxScale = 0.5,
			edgeWidthScale = 1 / 60.0,
			quadsDrawn = {},
			quadLevels = false,
			shouldQuadBeVisible = quadIntersects,
			boundingrect, mfrmap, debugEl, zoom,
			highlightedlinescontainer, highlightednodescontainer, highlightednamescontainer,
			linescontainer, nodescontainer, bitmapcontainer, 
			scalingEl, translationEl,
			startTranslateX = 0, startTranslateY = 0,
			dragging = false,
			dragCoordinates = { x: 0, y: 0 },
			lastX = 0, lastY = 0,
			svgCreated = false,
			sfactor = 48,
			KSymTableSize = 211,
			scheduler, highlightScheduler,
			nodemodeflagHighlighted = 1, nodemodeflagCentered = 2, nodemodeGraph = 0,
			nodemodeHighlighted = nodemodeflagHighlighted,
			nodemodeCentered = nodemodeflagHighlighted + nodemodeflagCentered,
			currentScale = 0.1, startScale, startNodeScale, currentTranslateX = 0, currentTranslateY = 0,
			currentnodeid = null, currentHighlightedNode,
			last_async_showmfrinfo = null,
			infoDisplayAction = false,
			drawQ = {},
			firstQuadDrawn = false,
			zoomLevel = false,
			quadsWithHighlightedNodes = {},
			svg = document.createElementNS(xmlns, "svg"),
			mapRect = false, boundingrectDims = false,
			useGraphCSS = !(navigator.userAgent.toLowerCase().indexOf('firefox') > -1),
			zoomStep = 0, zoomSteps = [], zoomStepsNodeScales = [], stepScale, currentScaleStep = false, startScaleStep = false, sliderZoomStep,
			textRects = [], svgDims = false,
			currentRect = false,
			execScale = false;



		// defaults
		function initDefaults() {
			for (var defaultEntry in defaults) {
				if (defaults.hasOwnProperty(defaultEntry)) {
					// set passed option or default
					options[defaultEntry] = (typeof options[defaultEntry] === "undefined") ? defaults[defaultEntry] : options[defaultEntry];
					// set if specified in container data atrribute
					// note this will not be in camelcase
					var attrName = 'data-' + defaultEntry.replace(/([A-Z])/g, '-$1').trim().toLowerCase(),
						attrVal = options.el.getAttribute(attrName);
					if(attrVal && attrVal.length) {
						// convert none char options
						if(defaults[defaultEntry]) {

							if(typeof(defaults[defaultEntry]) === "boolean") {
								// boolean
								if(attrVal.toLowerCase) {
									attrVal = (attrVal.toLowerCase() == "true");
								}
							} else if(!isNaN(defaults[defaultEntry])) {
								// numeric
								attrVal = parseInt(attrVal);
							}
						}
						// set the value we will use
						options[defaultEntry] = attrVal;
					}
				}
			}

			// dynamic function based on line type
			makeLineElement = (options.lineType == 'EllipticalArc') ? makeLineElementEllipticalArc : makeLineElementStraight;

			if(options.staticMap) {
				options.selectNodes = false;
				options.panning = false;
				options.zoomSlider = false;
			}
		}

		// shingle dynamic styles module
	    var graphCSS = (function() {

			var docStyles, styles = {}, styleIdx = 0, sheet, insertRule, deleteRule;

	    	function parseRules(rulesObj) {
	    		var rules = '';
				for (var ruleKey in rulesObj) {
				    if (rulesObj.hasOwnProperty(ruleKey)) {
						rules += ruleKey + ': ' + rulesObj[ruleKey] + ';';
				    }
				}
				return rules;
	    	}
	    	function fInsRule(selector, rules, idx) {
				sheet.insertRule(selector + "{" + parseRules(rules) + "}", idx);
	    	}
	    	function fAddRule(selector, rules, idx) {
				sheet.addRule(selector, parseRules(rules), idx);
	    	}
	    	function fDelRule(idx) {
				sheet.deleteRule(idx);
	    	}
	    	function fRemRule(idx) {
				sheet.removeRule(idx);
	    	}

		    function setRule(selector, rules) {
		    	var idx;

		    	if(styles[selector]) {
		    		idx = styles[selector];
		    		deleteRule(idx);
		    	} else {
			    	idx = styleIdx++;
			    	styles[selector] = idx;
		    	}

		    	insertRule(selector, rules, idx);
		    }

		    function clearRule(selector) {
		    	if(styles[selector]) {
		    		idx = styles[selector].idx;
		    		deleteRule(idx);
		    		styles[selector].delete;
		    	}
		    }

		    function existsRule(selector) {
		    	return (typeof styles[selector] != "undefined");
		    }

	    	// init
			docStyles = document.createElement('style');
		    docStyles.type = 'text/css';
		    docStyles.appendChild(document.createTextNode(""));
		    document.head.appendChild(docStyles);
		    sheet = docStyles.styleSheet || docStyles.sheet;
		    if(sheet) {
		    	insertRule = sheet.insertRule ? fInsRule : fAddRule;
		    	deleteRule = sheet.deleteRule ? fDelRule : fRemRule;
		    }

			return {
				set: setRule,
				clear: clearRule,
				exists: existsRule,
				getSheet: function() {
					return sheet;
				}
			}
	    })();

		// timer class
		var Timer = function() {

			var millis = performance.now ? function() { return performance.now(); } : function() {
				return new Date().getTime();
			}, timeStats = {
				tStart: 0,
				tEnd: 0
			};

			function reset() {
				timeStats.tStart = 0;
				timeStats.tEnd = 0;
			};

			function start() {
				reset();
				timeStats.tStart = millis();
			};

			function end() {
				timeStats.tEnd = millis();
			};

			function elapsed() {
				return timeStats.tEnd - timeStats.tStart;
			};

			return {
				start: start,
				end: end,
				elapsed: elapsed
			}
		}, dragTimer = new Timer();

		function ajaxGet(url, callback) {
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.overrideMimeType("application/json");

			xmlhttp.onreadystatechange = function () {
				if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
					callback && callback(xmlhttp.responseText);
				}
			};

			xmlhttp.open("GET", url, true);
			xmlhttp.send();
		}

		// module for loading quads
		var quadsLoader = function() {

			var gReqQ = [], timer = false;

			function load(reqQ) {
				var quadPars = '';

				if(reqQ.length > 1) {

					var callbacks = {};
					for (var i = 0; i < reqQ.length; i++) {

						var req = reqQ[i], fileName = req.quadid + ".json";

						if(i > 0) quadPars += ',';
						quadPars += fileName;
						callbacks[fileName] = req.callback;
					};

					var json_url = options.graphPath + quadPars;
					ajaxGet(json_url, function(responses) {

						var quadsArr = JSON.parse(responses);
						for (var i = 0; i < quadsArr.length; i++) {
							var response = quadsArr[i];
							if(response.fileName && callbacks[response.fileName]) {
								callbacks[response.fileName](response.data);
							}
						};
					});

				} else if(reqQ.length) {

					var json_url = options.graphPath + reqQ[0].quadid + ".json",
						callback = reqQ[0].callback;

					ajaxGet(json_url, function(response) {
						callback(JSON.parse(response));
					});
				}
			}

			function exec(i) {
				clearTimeout(timer);
				if(gReqQ.length > 5 || i > 5) {
					load(gReqQ.slice());
					gReqQ = [];
				} else {
					timer = setTimeout(function() {
						var n = (i || 0) + 1;
						exec(n);
					}, 50);
				}
			}

			function request(quadid, callback) {
				gReqQ.push({
					quadid: quadid,
					callback: callback
				});
				exec();
			}

			return {
				request: request
			}
		}();

		function rgbA(colorTuple) {
			var r = colorTuple[0];
			var g = colorTuple[1];
			var b = colorTuple[2];
			var a = colorTuple[3] || 1;
			return "rgba(" + r + "," + g + "," + b + "," + a + ")";
		}

		function calcBoundingRectDims() {

			// get scale 1
			var rect = {
				top: svgDims.scaleOneRect.top,
				right: svgDims.scaleOneRect.right,
				bottom: svgDims.scaleOneRect.bottom,
				left: svgDims.scaleOneRect.left
			};

			rect.width = svgDims.width;
			rect.height = svgDims.height;

			// apply current scale
			if(currentScale > 1) {
				rect.width = svgDims.width * currentScale;
				rect.height = svgDims.height * currentScale;

				var dWidth = rect.width - svgDims.width,
					dHeight = rect.height - svgDims.height;

				rect.top -= (dHeight / 2);
				rect.right += (dWidth / 2);
				rect.bottom += (dHeight / 2);
				rect.left -= (dWidth / 2);
			}

			// apply translates
			if(currentTranslateX) {
				var tWidth = currentTranslateX * svgDims.factor * currentScale;
				rect.left += tWidth;
				rect.right += tWidth;
			}
			if(currentTranslateY) {
				var tHeight = currentTranslateY * svgDims.factor * currentScale;
				rect.top += tHeight;
				rect.bottom += tHeight;
			}

			return rect;
		}

		function setBoundingrectDimsDefault() {
			getSvgDims();
			boundingrectDims = boundingrect.getBoundingClientRect();
		}

		function setBoundingrectDimsExperimental() {
			getSvgDims();
			boundingrectDims = calcBoundingRectDims();
		}

		function setBoundingrectDims() {};

		function getBoundingrectDims() {
			!boundingrectDims && setBoundingrectDims();
			return boundingrectDims;
		}

		function setMapRect() {

			mapRect = mfrmap.getBoundingClientRect();
		}

		function getMapRect() {
			!mapRect && setMapRect() && setBoundingrectDims();
			return mapRect;
		}

		function getNodeId(quadid, nodeid, highlighted) {
			var	id = 'i' + instance + '-' + quadid + "-node-" + nodeid;
			if (highlighted) {
				id += "highlighted";
			}
			return id;
		}

		// node color based on community id
		function nodeColor(node, opacity) {
			return rgbA(nodeColorTuple(node));
		}

		function nodeColorTuple(node) {
			var communityid = node.community,
				colorCount = options.nodeColors.length;

			if (!colorCount)
				return options.defaultNodeColor;

			return options.nodeColors[communityid % colorCount];
		}

		function edgeColor(nodeA, nodeB) {
			if (nodeA != null) {
				return nodeColor(nodeA, 1);
			} else if (nodeB != null) {
				return nodeColor(nodeB, 1);
			}
			return rgbA(options.edgeColor);
		}

		function edgeHighlightColor(nodeA, nodeB) {
			if (nodeA != null) {
				return nodeColor(nodeA, 1);
			} else if (nodeB != null) {
				return nodeColor(nodeB, 1);
			}
			return rgbA(options.edgeHighlightColor);
		}

		// node size and edge width
		function calcNodeRadius(range) {
			//  return (0.2+0.8*range)*15;
			return (0.2 + 0.8 * range) * 18;
		}

		// node stroke witdh
		function nodeEdgeWidth(range) {
			// return 1.5+5*range; //1.5;
			return 0.5 + 1 * range;
		}

		function nodeEdgeColor(node) {
			return rgbA(nodeColorTuple(node));
		}

		/* 
		 * scheduler class
		 */
		function Scheduler(stepaftertimeout) {
			this.tasks = [];
			this.timer = null;
			this.stepaftertimeout = stepaftertimeout;

			this.addTask = function (task) {
				this.tasks.push(task);
				if (this.tasks.length == 1) {
					this.reSchedule();
				}
			};

			this.abandonAll = function () {
				if (this.timer != null) {
					clearTimeout(this.timer);
					this.timer = null;
					this.tasks = [];
				}
			}

			this.reSchedule = function () {
				if (this.tasks.length > 0) {
					this.timer = setTimeout(this.stepaftertimeout, 33);
				} else {
					this.timer = null;
				}
			};

			this.step = function () {
				if (this.tasks.length > 0) {
					var finished = this.tasks[0].call();
					if (finished) {
						this.tasks.splice(0, 1);
					}
				}

				this.reSchedule();
			};

			return this;
		}

		function schedulerStep() {
			scheduler.step();
		}

		function highlightschedulerStep() {
			highlightScheduler.step();
		}

		function HashByte(h, c) {
			h = (h * 16) + c;
			h = h & 0xffffff;
			return h;
		}

		function HASHBIN(h) {
			return (h % KSymTableSize);
		}

		function getHash(s) {
			var i;
			var h = 0;

			for (i = 0; i < s.length; i++) {
				h = HashByte(h, s.charCodeAt(i));
			}
			return HASHBIN(h);
		}

		function drawnQuad(quadid) {
			return quadsDrawn[quadid] || false;
		}

		function containerWorldRect() {

			var datarectPixels = getBoundingrectDims(),
				containerRectPixels = getMapRect();

			var scaleX = ((1.0 * mapinfo["quadtree"]["xmax"]) - mapinfo["quadtree"]["xmin"]) / (datarectPixels.right - datarectPixels.left),
				scaleY = ((1.0 * mapinfo["quadtree"]["ymax"]) - mapinfo["quadtree"]["ymin"]) / (datarectPixels.bottom - datarectPixels.top);

			var containerWidth = (containerRectPixels.right - containerRectPixels.left) * scaleX,
				containerHeight = (containerRectPixels.bottom - containerRectPixels.top) * scaleY;

			var movedWorldDeltaX = (datarectPixels.left) * scaleX - mapinfo["quadtree"]["xmin"],
				movedWorldDeltaY = (datarectPixels.top) * scaleX - mapinfo["quadtree"]["ymin"];

			var containerX = (containerRectPixels.left) * scaleX - movedWorldDeltaX,
				containerY = (containerRectPixels.top) * scaleY - movedWorldDeltaY;

			return [containerX, containerY, containerX + containerWidth, containerY + containerHeight];
		}

		function quadIntersects(screenrect, root) {

			if (root["xmin"] < screenrect[2] && root["xmax"] > screenrect[0] &&
				root["ymin"] < screenrect[3] && root["ymax"] > screenrect[1]) {
				return true;
			}
			return false;
		}
		
		function quadIntersectsAndQuadBigEnough(screenrect, root) {
			// Not on screen? Don't draw.
			if (!quadIntersects(screenrect, root)) {
				return false;
			}

			// Too small? don't draw.
			if ((root["xmax"]-root["xmin"]) < options.quadDisplayThreshold * (screenrect[2]-screenrect[0])) {
				return false;
			}

			if ((root["ymax"]-root["ymin"]) < options.quadDisplayThreshold * (screenrect[3]-screenrect[1])) {
				return false;
			}

			// Else, draw.
			return true;
		}

		function findQuadsNodeJs(screenrect) {

			var url = options.graphPath + 'findQuads' +
					'?xmin=' + screenrect[0] +
					'&ymin=' + screenrect[1] +
					'&xmax=' + screenrect[2] +
					'&ymax=' + screenrect[3] +
					'&quadDisplayThreshold=' + options.quadDisplayThreshold,
					thisRect = JSON.stringify(screenrect);

			currentRect = thisRect;

			ajaxGet(url, function(response) {
				if(response) {
					var quads = JSON.parse(response);

					if(quads.length && thisRect == currentRect) {

						for (var i = 0; i < quads.length; i++) {
							if (!drawnQuad(quads[i])) {
								loadQuad(quads[i]);
							}
						};
					}
				}
			});
		}

		function findQuadsToDraw() {

			var screenrect = containerWorldRect(),
				root = mapinfo["quadtree"],
				quadid = "quad_";

			if(mapinfo.loadFromBackend) {
				findQuadsNodeJs(screenrect);
			} else {
				findQuadsToDrawRecursive(screenrect, root, quadid);
			}
		}

		function findQuadsWithLevelsToDrawRecursive(screenrect, root, quadid) {

			if (shouldQuadBeVisible(screenrect, root)) {
				if (!drawnQuad(quadid)) {
					loadQuad(quadid);
				}
				if (root["left"] != null) {
					findQuadsToDrawRecursive(screenrect, root["left"], (quadid + "l"));
				}
				if (root["right"] != null) {
					findQuadsToDrawRecursive(screenrect, root["right"], (quadid + "r"));
				}
			}
		}

		function findQuadsNoLevelsToDrawRecursive(screenrect, root, quadid) {

			if (shouldQuadBeVisible(screenrect, root)) {
				if (root["type"] == "Leaf") {
					if (drawnQuad(quadid)) {
						return;
					}
					loadQuad(quadid);
				} else {
					findQuadsToDrawRecursive(screenrect, root["left"], (quadid + "l"));
					findQuadsToDrawRecursive(screenrect, root["right"], (quadid + "r"));
				}
			}
		}

		// quad drawing is based on quadLevels, function is set on map load
		var findQuadsToDrawRecursive = findQuadsNoLevelsToDrawRecursive;

		function findQuadsToRemove() {

			var i;
			var screenrect = containerWorldRect(),
				elements = svg.getElementsByClassName(options.quadClass);

			for (var i = 0; i < elements.length; i++) {
				var el = elements[i],
					elid = el.id,
					header = graphs[elid].header;

				if (quadsWithHighlightedNodes.hasOwnProperty(elid)) {
					continue;
				}
				if (header != null) {
					if (!shouldQuadBeVisible(screenrect, header)) {
						el.parentNode.removeChild(el);
						if(quadsDrawn[elid]) delete quadsDrawn[elid];
						i--;
					}
				}
			}

			for (i = 1; i < scheduler.tasks.length; i++) {
				if (scheduler.tasks[i].quadid != null) {
					var graph = graphs[scheduler.tasks[i].quadid];
					if (graph != null) {
						var header = graph.header;
						if (header != null) {
							if (quadsWithHighlightedNodes.hasOwnProperty(scheduler.tasks[i].quadid)) {
								continue;
							}

							if (!shouldQuadBeVisible(screenrect, header)) {
								scheduler.tasks.splice(i, 1);
								i--;
							}
						}
					}
				}
			}

			for (var quadid in graphs) {
				if (graphs.hasOwnProperty(quadid)) {
					var visible = false;
					var graph = graphs[quadid];

					if (graph == null) {
						continue;
					}

					var header = graph.header;

					if (quadsWithHighlightedNodes.hasOwnProperty(quadid)) {
						visible = true;
					}
					else if (shouldQuadBeVisible(screenrect, header)) {
						visible = true;
					} else {
						/*
						var referenced = graph["referenced"];
						var j;

						for (j = 0; j < referenced.length; j++) {
							var othergraph = graphs[referenced[j]];
							if (othergraph == null) {
								continue;
							}
							header = othergraph.header;

							if (shouldQuadBeVisible(screenrect, header)) {
								visible = true;
								break;
							}
						}
						*/
					}
					if (visible == false) {
						//
						// HERE bug #1
						// quads get removed which are visible ..
						graphs[quadid] = null;
					}
				}
			}
		}

		function findPosition(nodeid) {

			var has = getHash(nodeid),
				url = options.graphPath + "table" + has + ".json";

			var highlightedQuad = null;

			if(mapinfo.loadFromBackend) {
				url += '?nodeid=' + nodeid;
			}

			ajaxGet(url, function(response) {
				var table = JSON.parse(response)
					entry = table[nodeid],
					doRender = true;

				if (entry) {
					currentTranslateX = -entry[0];
					currentTranslateY = -entry[1];
					currentnodeid = nodeid;
					options.onNodeFound && options.onNodeFound();

					if (quadLevels) {
						highlightedQuad = entry[2];
					}
				} else {
					doRender = options.renderWhenNodeNotFound;
					options.onNodeNotFound && options.onNodeNotFound();
				}
				if(doRender) {
					renderMap();

					if (highlightedQuad != null) {
						//console.log("going to load higlighted quad "+highlightedQuad);

						loadNonCompactQuad(highlightedQuad,true);
					}
				}
			});
		}

		function renderMap() {

			minScale = mapinfo["averageQuadWidth"] / mapinfo["totalMapWidth"];
			maxScale = (5 * mapinfo["averageQuadWidth"]) / mapinfo["totalMapWidth"];

			if (quadLevels) {
				maxScale = 1;
			}

			nodeRadiusScale = mapinfo["averageQuadWidth"] *options.nodeRadiusScaleFactor;

			if (nodeRadiusScale > 1)
				nodeRadiusScale = 1;

			// calculate edge radius depending on average quad width
			nodeEdgeRadiusScale = (2 / 3 * mapinfo["averageQuadWidth"]) / 200.0;
			edgeWidthScale = (2 / 3 * mapinfo["averageQuadWidth"]) * minScale / 10.0;

			startScale = 1 / (minScale + (maxScale - minScale) * (options.initialZoom / 100.0));
			startNodeScale = calcNodeScale(startScale);

			// use generated scaling steps, scaling using dynamic generated css
			if(useGraphCSS) {
				graphCSS.set('.' + options.nodeClass, {
					'transform-origin': 'initial'
				});
			}
			stepScale = minScale;

			var incScale = options.nodesGrow ? 0.0015 : 0;

			while (stepScale <= maxScale && stepScale >= minScale) {

				if(startScaleStep === false && startScale >= (1 / stepScale)) {
					startScale = (1 / stepScale);
					startScaleStep = zoomStep;
					incScale = false;
				}
				zoomSteps[zoomStep] = (1 / stepScale);
				if(useGraphCSS) {
					var	scaleFactor = startScale * stepScale * (1 - (Math.log(zoomStep + 1) / 15));

					if(incScale && options.nodesGrow) {
						incScale += 0.0015;
					}
					scaleFactor += incScale;

					graphCSS.set('.' + options.mapClass + '.i' + instance + '-zoom-level-' + zoomStep + ' .' + options.nodeClass, {
						transform: 'scale(' + scaleFactor + ',' + scaleFactor + ')'
					});
					zoomStepsNodeScales[zoomStep] = scaleFactor;
				}
				stepScale *= 1.1;
				zoomStep++;
			}
			// debug quad hover visual indicators
			if(useGraphCSS && options.debugQuads) {
				graphCSS.set('.' + options.debugQuadClass + '-text', {
					'fill-opacity': '0.78'
				});
				graphCSS.set('.' + options.debugQuadClass + ' .' + options.debugQuadClass + '-text', {
					'fill-opacity': '1'
				});
				graphCSS.set('.' + options.debugQuadClass + ' circle', {
					'stroke-width': '3px',
					fill: '#fff',
					stroke: 'rgb(96,111,102)'
				});
				graphCSS.set('.' + options.debugQuadClass + ' path', {
					'stroke-width': '2px',
					'stroke-opacity': '1',
					stroke: 'rgb(96,111,102)!important'
				});
			}

			// init current values
			currentScale = startScale;
			currentScaleStep = startScaleStep;

			// we can set the zoomlider val and max now
			zoom.setAttribute("max", zoomSteps.length - 1);
			zoom.setAttribute("value", "" + currentScaleStep);

			// the zoomStep option is on a 1..100 scale and needs to be corrected according to the zoomsteps possible
			sliderZoomStep = Math.floor((zoomSteps.length / 100) * options.zoomStep);

			// initial css scale class
			mfrmap.className = options.mapClass + ' shingle-unselectable' + ' i' + instance + '-zoom-level-' + startScaleStep;

			createBaseSvgDOM();
			findQuadsToDraw();
		}

		function loadMapInfo(nodeid) {

			ajaxGet(options.graphPath + "mapinfo.json", function(response) {

				mapinfo = JSON.parse(response);

				if (mapinfo["symTableSize"] != null) {
					KSymTableSize = mapinfo["symTableSize"];
				}
				
				if (mapinfo["data-format-version"] == null) {
					mapinfo["data-format-version"] = 0;
				}
				if (mapinfo["data-format-version"] > 0) {
					quadLevels = true;
					findQuadsToDrawRecursive = findQuadsWithLevelsToDrawRecursive;
					shouldQuadBeVisible = quadIntersectsAndQuadBigEnough;
				}
				if(mapinfo.supportsMultipleQuadsLoader && options.useMultipleQuadsLoader) {
					getQuad = getQuadWithLoader;
				}
				
				if(nodeid) {
					findPosition(nodeid)
				} else {
					renderMap();
				}
			});
		}

		function getQuadWithLoader(quadid, callback) {
			quadsLoader.request(quadid, callback);
		}

		function getQuadSingle(quadid, callback) {

			var json_url = options.graphPath + quadid + ".json";

			ajaxGet(json_url, function(response) {
				callback(JSON.parse(response));
			});
		}

		var getQuad = getQuadSingle;

		function loadQuad(quadid) {
			if (graphs[quadid] != null) {
				if (!drawnQuad(quadid)) {
					scheduler.addTask(new ScheduledAppendQuad(quadid));
				}
				return;
			}

			getQuad((quadsWithHighlightedNodes.hasOwnProperty(quadid) ? 'e' : '') + quadid, function(graph) {
				if (graphs[quadid] == null) {
					graph.shingleIndex = Object.keys(graphs).length - 1;
					graphs[quadid] = graph;
					scheduler.addTask(new ScheduledAppendQuad(quadid));
				}
			});
		}

		function loadNonCompactQuad(quadid,loadReferenced) {
			if (!quadLevels) {
				return;
			}
			var doload = true;
			// Check to see if we already have a non-compact quad loaded
			if (graphs[quadid]) {
				if (graphs[quadid]["header"]["compact"] != true) {
					doload=false;
				}
			}

			if (doload) {

				getQuad("e" + quadid, function(graph) {

					if (loadReferenced) {
						keepHighlightedNodesLoaded(graph);
					}

					if (graphs[quadid] != null) {

						if (graphs[quadid]["header"]["compact"] == true) {
							var i;
							var elements = svg.getElementsByClassName(options.quadClass);
							for (var i = 0; i < elements.length; i++) {
								var el = elements[i];
								var elid = el.id;
								if (elid == quadid) {

									el.parentNode.removeChild(el);
									if(quadsDrawn[elid]) {
										delete quadsDrawn[elid];
									}
									break;
								}
							}
							
						
							for (i = 1; i < scheduler.tasks.length; i++) {
								if (scheduler.tasks[i].quadid == quadid) {
									scheduler.tasks.splice(i, 1);
									i--;
								}
							}
						}
						else {
							return;
						}
					}

					graph.shingleIndex = Object.keys(graphs).length - 1;
					graphs[quadid] = graph;

					scheduler.addTask(new ScheduledAppendQuad(quadid));
					if (loadReferenced) {
						loadReferencedQuads(graph);
					}
				});
			}
			else if (loadReferenced) {
				loadReferencedQuads(graphs[quadid]);
			}
		}


		function loadReferencedQuads(graph) {

			if(!graph["relations"]) return;

			var extendedQuadsToLoad = {},
				nredges = graph["relations"].length, k;

			for (k = 0; k < nredges; k++) {
				var nodeidA = graph["relations"][k].nodeidA;
				var quadA = graph["relations"][k].quadA;

				var nodeidB = graph["relations"][k].nodeidB;
				var quadB = graph["relations"][k].quadB;

				if (nodeidA == currentnodeid || nodeidB == currentnodeid) {
					if (!graphs[quadA]) {
						extendedQuadsToLoad[quadA] = 1;
					} else if (graphs[quadA]["header"]["compact"] == true) {
						extendedQuadsToLoad[quadA] = 1;
					}


					if (!graphs[quadB]) {
						extendedQuadsToLoad[quadB] = 1;
					} else if (graphs[quadB]["header"]["compact"] == true) {
						extendedQuadsToLoad[quadB] = 1;
					}
				}
			}

			for (var key in extendedQuadsToLoad) {
				if (extendedQuadsToLoad.hasOwnProperty(key)) {
					loadNonCompactQuad(key,false);
				}
			}
		}

		function keepHighlightedNodesLoaded(graph) {
			if(graph["relations"]) {
				quadsWithHighlightedNodes = {};
				var nredges = graph["relations"].length;
				var k;
				for (k = 0; k < nredges; k++) {
					var nodeidA = graph["relations"][k].nodeidA;
					var quadA = graph["relations"][k].quadA;
					var nodeidB = graph["relations"][k].nodeidB;
					var quadB = graph["relations"][k].quadB;

					if (nodeidA == currentnodeid || nodeidB == currentnodeid) 
					{
						quadsWithHighlightedNodes[quadA] = 1;
						quadsWithHighlightedNodes[quadB] = 1;
					}
				}
			}
		}

		function forgetHighlightedNodesLoaded() {
			quadsWithHighlightedNodes = {};
		}

		function debugLog(str) {
			if (options.debug) {
				debugEl.innerHTML = str;
			}
		}

		function handleMouseDown(evt) {

			dragTimer.start();

			dragCoordinates.x = evt.pageX;
			dragCoordinates.y = evt.pageY;

			startTranslateX = currentTranslateX;
			startTranslateY = currentTranslateY;

			var rect = getBoundingrectDims();
			sfactor = (rect.right - rect.left) / ((1.0 * mapinfo["quadtree"]["xmax"]) - mapinfo["quadtree"]["xmin"]);

			dragging = true;
		}

		function handleMouseMove(evt) {
			if (dragging) {
				var deltaX = evt.pageX - dragCoordinates.x,
					deltaY = evt.pageY - dragCoordinates.y;

				currentTranslateX = startTranslateX + deltaX / sfactor;
				currentTranslateY = startTranslateY + deltaY / sfactor;

				//@@@ removing the following line causes the map to not render well when zoomed in on Firefox, no idea why...
				debugLog("<p style=\"color:#ffffff\">" + 0 + "</p>");

				/* 
				 * Seems to be a bug in Firefox: when selecting node for first time, than drag map,
				 * screen becomes white. Solution for now is to remove names just before it starts to drag the map.
				 */
				if (highlightednamescontainer != null) {
					highlightednamescontainer.style.display = "none";
				}
				setSvgTranslations();
			}
		}

		function handleMouseUp(evt) {

			dragTimer.end();

			var deltaX = evt.pageX - dragCoordinates.x,
				deltaY = evt.pageY - dragCoordinates.y;

			dragging = false;

			// an actual pan
			if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
				setBoundingrectDims();

				findQuadsToDraw();
				findQuadsToRemove();

				if (highlightednamescontainer != null) {
					highlightednamescontainer.style.display = "inherit";
				}
			}

			// NOTE this might need some refactoring, as this is also intended
			// to prevent a clicked on node (different event) from getting unhighlighted
			if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
				// no panning, a click outside a node
				// use a threshold in milliseconds to make sure this is
				// is an intended click
				if(dragTimer.elapsed() > options.dragTimeThreshold) {
					removeInfoAbout();
					if(options.containerWithFocusClass) {
						options.el.classList.remove(options.containerWithFocusClass);
					}
					options.onBlur && options.onBlur();
					syncInfoDisplay(false);
				}
			}
		}

		function attachMouseEvents() {

			if (mfrmap) {

				if (options.panning) {

					mfrmap.addEventListener('mousedown', function (evt) {
						handleMouseDown(evt);
					}, false);

					mfrmap.addEventListener('mousemove', function (evt) {
						handleMouseMove(evt);
					}, false);

					mfrmap.addEventListener('mouseup', function (evt) {
						handleMouseUp(evt);
					}, false);

					mfrmap.addEventListener('touchstart', function (evt) {
						var touchobj = evt.changedTouches[0];
						handleMouseDown(touchobj);
						evt.preventDefault();
						evt.cancelBubble = true;
					}, false);

					mfrmap.addEventListener('touchmove', function (evt) {
						var touchobj = evt.changedTouches[0];
						handleMouseMove(touchobj);
						evt.preventDefault();
						evt.cancelBubble = true;
					}, false);

					mfrmap.addEventListener('touchend', function (evt) {
						var touchobj = evt.changedTouches[0];
						handleMouseUp(touchobj);
						evt.preventDefault();
						evt.cancelBubble = true;
					}, false);

					var handleScroll = function (evt) {

						var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;

						if (delta) {
							doZoom((delta > 0) ? -1 : 1);
						}

						return evt.preventDefault() && false;
					};
				}

				if (options.scrollZoom) {
					var wheelEvent = "onwheel" in mfrmap ? "wheel" : document.onmousewheel !== undefined ? "mousewheel" : "DOMMouseScroll";
					mfrmap.addEventListener(wheelEvent, handleScroll, false);
				}
			}
		}

		function updateBitmapOpacity() {
			if (bitmapcontainer != null) {

				var delta = currentScaleStep/zoomSteps.length;

				if (delta>=0.75) {
					bitmapcontainer.style.opacity = 1;
				} else if (delta>=0.5) {
				bitmapcontainer.style.opacity = 4*(delta-0.5);
				} else {
					bitmapcontainer.style.opacity = 0;
				}
			}
		}

		function createBaseSvgDOM() {
			svgCreated = true;

			var i,
				xmin = mapinfo["quadtree"]["xmin"],
				xmax = mapinfo["quadtree"]["xmax"],
				ymin = mapinfo["quadtree"]["ymin"],
				ymax = mapinfo["quadtree"]["ymax"];

			svg.setAttributeNS(null, "viewBox", "" + xmin + " " + ymin + " " + (xmax - xmin) + " " + (ymax - ymin) + "");

			options.el.style.width = options.width;
			options.el.classList.add(options.containerClass);
			mfrmap.style.width = options.width;
			mfrmap.style.height = options.height;

			svg.setAttributeNS(null, "width", "100%");
			svg.setAttributeNS(null, "height", "100%");

			svg.setAttributeNS(null, "position", "absolute");
			svg.setAttributeNS(null, "x", "0");
			svg.setAttributeNS(null, "y", "0");

			svg.style.overflow = "visible";

			scalingEl = document.createElementNS(xmlns, "g");
			svg.appendChild(scalingEl);
			scalingEl.setAttributeNS(null, 'transform', "scale(" + currentScale + ")");
			scalingEl.setAttributeNS(null, "class", options.scaleElClass);

			translationEl = document.createElementNS(xmlns, "g");
			scalingEl.appendChild(translationEl);

			if(options.translateOffsetX) currentTranslateX += options.translateOffsetX / currentScale;
			if(options.translateOffsetY) currentTranslateY += options.translateOffsetY / currentScale;

			translationEl.setAttributeNS(null, 'transform', "translate(" + currentTranslateX + " " + currentTranslateY + ")");
			translationEl.setAttributeNS(null, "class", options.translationElClass);

			boundingrect = document.createElementNS(xmlns, "rect");

			boundingrect.setAttributeNS(null, "x", "" + xmin);
			boundingrect.setAttributeNS(null, "y", "" + ymin);

			boundingrect.setAttributeNS(null, "width", "" + (xmax - xmin));
			boundingrect.setAttributeNS(null, "height", "" + (ymax - ymin));
			boundingrect.setAttributeNS(null, "class", options.boundingRectElClass);
			boundingrect.style.fill = "none";
			/*
			rect.style.stroke = "black";
			rect.style.strokeWidth = 0.2 * edgeWidthScale;
			rect.style.fillOpacity = "0";
			rect.style.strokeOpacity = "0.5";
			*/
			translationEl.appendChild(boundingrect);

/* Rendering bitmap still messes with the mouse events ? */

            // Bitmap for all of map
            if(options.useBitmap) {
				bitmapcontainer = document.createElementNS(xmlns, "image");
				bitmapcontainer.setAttributeNS(null, "class", options.bitmapcontainerClass+" shingle-unselectable");
				bitmapcontainer.setAttributeNS(null, "x", ""+xmin);
				bitmapcontainer.setAttributeNS(null, "y", ""+ymin);
				bitmapcontainer.setAttributeNS(null, "width",  ""+(xmax-xmin));
				bitmapcontainer.setAttributeNS(null, "height", ""+(ymax-ymin));

				bitmapcontainer.setAttributeNS('http://www.w3.org/1999/xlink', "xlink:href", options.graphPath + "image_2400.jpg");

				bitmapcontainer.ondragstart = function() { return false; };
				updateBitmapOpacity();

				translationEl.appendChild(bitmapcontainer);
            }

			// all lines
			linescontainer = document.createElementNS(xmlns, "g");
			linescontainer.setAttributeNS(null, "class", options.linescontainerClass);
			translationEl.appendChild(linescontainer);

			// lines of the highlighted node to the related nodes
			highlightedlinescontainer = document.createElementNS(xmlns, "g");
			highlightedlinescontainer.setAttributeNS(null, "class", options.highlightedlinescontainerClass);
			translationEl.appendChild(highlightedlinescontainer);

			// all nodes
			nodescontainer = document.createElementNS(xmlns, "g");
			nodescontainer.setAttributeNS(null, "class", options.nodescontainerClass);
			translationEl.appendChild(nodescontainer);

			// highlighted nodes and related nodes
			highlightednodescontainer = document.createElementNS(xmlns, "g");
			highlightednodescontainer.setAttributeNS(null, "class", options.highlightednodescontainerClass);		
			translationEl.appendChild(highlightednodescontainer);
			if(options.selectNodes) {
				addNodeEvents(highlightednodescontainer);
			}

			// names of the highlighted nodes
			highlightednamescontainer = document.createElementNS(xmlns, "g");
			highlightednamescontainer.setAttributeNS(null, "class", options.highlightednamescontainerClass);
			translationEl.appendChild(highlightednamescontainer);

			mfrmap.appendChild(svg);
		}

		function clearNodeNames(){
			if (highlightednamescontainer == null) {
				return;
			}

			while (highlightednamescontainer.firstChild) {
				highlightednamescontainer.removeChild(highlightednamescontainer.firstChild);
			}
		}

		function setSvgDims() {

			svgDims = {};

			var	mRect = svg.getBoundingClientRect(), rect = {};

			var	ymin = mapinfo["quadtree"]["ymin"],
				ymax = mapinfo["quadtree"]["ymax"],
				graphHeight = ymax - ymin,
				svgHeight = mRect.bottom - mRect.top,
				svgHeightFactor = svgHeight / graphHeight;

			var	xmin = mapinfo["quadtree"]["xmin"],
				xmax = mapinfo["quadtree"]["xmax"],
				graphWidth = xmax - xmin,
				svgWidth = mRect.right - mRect.left,
				svgWidthFactor = svgWidth / graphWidth;

			// svg fits to box in as well width as height
			svgDims.factor = Math.min(svgHeightFactor, svgWidthFactor);
			svgDims.heightFactor = svgHeightFactor;
			svgDims.widthFactor = svgWidthFactor;
			if(svgHeightFactor < svgWidthFactor) {
				svgDims.base = 'height';
				svgDims.height = svgHeight;
				svgDims.width = graphWidth * svgDims.factor;
			} else {
				svgDims.base = 'width';
				svgDims.width = svgWidth;
				svgDims.height = graphHeight * svgDims.factor;
			}

			svgDims.wDelta = svgWidth - svgDims.width;
			svgDims.hDelta = svgHeight - svgDims.height;

			// calculate scale 1
			if(svgHeightFactor < svgWidthFactor) {
				rect.top = mRect.top;
				rect.right = mRect.left + (svgDims.wDelta / 2) + svgDims.width;
				rect.bottom = mRect.top + svgDims.height;
				rect.left = mRect.left + (svgDims.wDelta / 2);
			} else {
				rect.top = mRect.top + (svgDims.hDelta / 2);
				rect.right = mRect.left + svgDims.width;
				rect.bottom = mRect.top + (svgDims.hDelta / 2) + svgDims.height;
				rect.left = mRect.left;
			}
			svgDims.scaleOneRect = rect;
		}

		function getSvgFactor() {
			!svgDims && setSvgDims();
			return svgDims.factor;
		}

		function getSvgDims() {
			!svgDims && setSvgDims();
			return svgDims;
		}

		function calcBaseScale() {
			if(!baseScale) {
				baseScale = (1 / ( startScale * getSvgFactor() ));
			}
		}

		function calcCurrentFontScale() {

			//
			// calculate fontsize of text element to display as specified fontSize in px on screen
			calcBaseScale();
			if(!fontScale) {
				fontScale = options.fontSize * baseScale;
			}
			if(options.textGrow) {
				if(options.textShrink) {
					// grow and shrink
					size = fontScale;
				} else {
					// keep thesame size but do not shrink
					size = fontScale  * ( Math.max(startScale, currentScale) / currentScale );
				}
			} else {
				// keep thesame size
				size = fontScale  * ( startScale / currentScale );
			}

			return size;
		}

		function calcNodeScale(scale) {
			if (quadLevels) {
				/*
				var	ymin = mapinfo["quadtree"]["ymin"],
					ymax = mapinfo["quadtree"]["ymax"],
					rect = getMapRect(),
					graphHeight = ymax - ymin,
					svgHeight = rect.bottom - rect.top,
					svgHeightFactor = svgHeight / graphHeight;

				return (1.0 / ( startScale * svgHeightFactor ));
				*/
				return ( 18.0 / scale );
			}
			return 1;
		}

		function calcCurrentNodeScaleGraphCSS() {
			return startNodeScale;
		}

		function calcCurrentNodeScaleJS() {
			return calcNodeScale(currentScale);
		}

		var calcCurrentNodeScale = useGraphCSS ? calcCurrentNodeScaleGraphCSS : calcCurrentNodeScaleJS;

		function textBoxCollides(tRect) {

			if(!tRect.displayed) return false;

			var collisionRect = false,
				fSVG = getSvgFactor(),
				textRect = {
					top: tRect.top * currentScale * fSVG,
					right: tRect.right * currentScale * fSVG,
					bottom: (tRect.top * currentScale * fSVG) + options.relatedNodesFontSize,
					left: tRect.left * currentScale * fSVG
				};

			for (var i = 0; i < textRects.length; i++) {
				var oRect = textRects[i];

				if(oRect.displayed && tRect.node.name != oRect.node.name) {

					var otherRect = {
							top: oRect.top * currentScale * fSVG,
							right: oRect.right * currentScale * fSVG,
							bottom: (oRect.top * currentScale * fSVG) + options.relatedNodesFontSize,
							left: oRect.left * currentScale * fSVG
						};

					if (!(	textRect.right < otherRect.left || 
						    textRect.left > otherRect.right || 
						    textRect.bottom < otherRect.top || 
						    textRect.top > otherRect.bottom)) {
							collisionRect = oRect;

							break;
					}
				}
			};

			return collisionRect;
		}

		function getTextRect(textfield, node, onHoverOnly, fontAttrs, nodeOffSets, mainNode) {

			offSets = nodeOffSets || {
				x: 1,
				y: -1
			};
			offSets.xc = 0;
			offSets.yc = 0;

			var	range = nodeRange(node),
				nodeScaleFactor = useGraphCSS ? zoomStepsNodeScales[currentScaleStep] : 1,
				nodeRadius = calcNodeRadius(range) * nodeRadiusScale * calcCurrentNodeScale() * nodeScaleFactor;

			// recreate text
			while (textfield.firstChild) {
				textfield.removeChild(textfield.firstChild);
			}
			// to get text dimensions
			var tN = document.createTextNode(node.name);
			textfield.appendChild(tN);

			var ttDims, fontSize;

			if(typeof fontAttrs == 'object') {
				// calculate new size from old and new
				fontSize = fontAttrs.newSize;
				ttDims = {
					width: (fontAttrs.oldWidth / fontAttrs.oldSize) * fontAttrs.newSize,
					height: (fontAttrs.oldHeight / fontAttrs.oldSize) * fontAttrs.newSize
				}
			} else {
				// first time, get the bounding box
				fontSize = fontAttrs;
				ttDims = textfield.getBBox();
			}

			if(offSets.x < 0) {
				offSets.xc = -1 * ttDims.width;
			}
			if(offSets.y > 0) {
				offSets.yc = .5 * ttDims.height;
			}

			var safetyX = 1.75, safetyY = 0.88,
				textRect = {
					node: node,
					nodeRadius: nodeRadius,
					fontSize: fontSize,
					offSets: offSets,
					top: (node.y + offSets.yc + offSets.y * safetyY * nodeRadius),
					right: (node.x + offSets.xc + offSets.x * safetyX * nodeRadius) + ttDims.width,
					bottom: (node.y + offSets.yc + offSets.y * safetyY * nodeRadius) + ttDims.height,
					left: (node.x + offSets.xc + offSets.x * safetyX * nodeRadius),
					field: textfield,
					mainNode: mainNode || (typeof nodeOffSets == "undefined"),
					onHoverOnly: onHoverOnly || false,
					displayed: true
				};
			return textRect;
		}

		function positionTextRect(tRect, strict) {

			var textRect = tRect;

			textRect.displayed = true;

			if(!textRect.mainNode && !textRect.onHoverOnly) {

				// check if distance to main node is mimimum of 1.8 lineheight on display
				if(textRect.offSets.d && (textRect.offSets.d * currentScale * getSvgFactor() < options.relatedNodesFontSize * 1.8)) {
					textRect.displayed = false;
				} else {
					// check overlap
					var overlapRect = textBoxCollides(textRect);

					if(overlapRect) {

						if(typeof strict != "undefined") {

							// do not try different positions again
							textRect.displayed = false;

						} else if(textRect.node.size <= overlapRect.node.size || overlapRect.mainNode) {

							// check if it still collides when swapping placement position
							var offSets = {
								x: textRect.offSets.x * -1,
								y: textRect.offSets.y * -1
							};

							var textRectRev = getTextRect(textRect.field, textRect.node, textRect.onHoverOnly, textRect.fontSize, offSets),
								overlapRectRev = textBoxCollides(textRectRev);

							if(overlapRectRev) {

								// note we could check what would happen if we swap back textRect and swap overlapRectRev's position
								// but that would impact all other labels that can potentially collide with overlapRecRev

								// check node importance, conditionally swap visibility of text
								if(overlapRectRev.node.size <= textRect.node.size && !overlapRectRev.mainNode) {
									overlapRectRev.displayed = false;
									overlapRectRev.field.style.display = 'none';
									textRect = textRectRev;
								} else {
									textRect.displayed = false;
								}
							} else {
								// no overlap when flipped to other side of node, change text attr
								textRect = textRectRev;
							}
						} else {
							overlapRect.displayed = false;
							overlapRect.field.style.display = 'none';
						}
					}
				}
			}

			if(textRect.displayed) {

				textRect.field.style.display = textRect.onHoverOnly ? 'none' : 'initial';
				textRect.field.setAttributeNS(null, "x", textRect.left);
				textRect.field.setAttributeNS(null, "y", textRect.top);
			} else {
				textRect.field.style.display = 'none';
			}

			return textRect;
		}

		function scaleTextRects() {

			var size = calcCurrentFontScale(),
				relatedFactor = options.relatedNodesFontSize / options.fontSize;

			// scale texts, and reposition considering the nodes are scaled in reverse
			for (var i = 0; i < textRects.length; i++) {
				var textRect = textRects[i];

				// change font to visually stay thesame size
				var fontSize = {
					newSize: size * (textRect.mainNode ? 1 : relatedFactor),
					oldSize: textRect.fontSize,
					oldWidth: textRect.right - textRect.left,
					oldHeight: textRect.bottom - textRect.top 
				};

				textRect.field.setAttributeNS(null, "font-size", fontSize.newSize);

				// reposition, node has become smaller or larger (reversed scaling to scaling layer)
				textRect = getTextRect(textRect.field, textRect.node, textRect.onHoverOnly, fontSize, textRect.offSets, textRect.mainNode);
				if(!isNaN(textRect.left) && !isNaN(textRect.top)) {
					textRect.field.setAttributeNS(null, "x", textRect.left);
					textRect.field.setAttributeNS(null, "y", textRect.top);

					textRects[i] = textRect;
				}
			};

			// check collisions again, so if hidden ones can be displayed and vice versa
			for (var i = 0; i < textRects.length; i++) {
				var textRect = textRects[i];

				positionTextRect(textRect, true);
			}
		}

		function showNodeName(quadid, node, elemClass, onHoverOnly, nodeOffSets) {

			// ensure unique elemid quick 'fix'
			var elemid = instance + '-' + elemClass + node.nodeid;

			if(node.name && node.name != settings.NULLnodeName) {

				var textfield = document.getElementById(elemid);

				if (textfield == null) {
					// text size
					var size = calcCurrentFontScale(),
						relatedFactor = options.relatedNodesFontSize / options.fontSize;

					if(typeof onHoverOnly != "undefined") size *= relatedFactor; // not a main node

					if (highlightednamescontainer == null) {
						return;
					}

					textfield = document.createElementNS(xmlns, "text");
					textfield.setAttributeNS(null, "class", options.nodeTextClass + " shingle-unselectable");
					textfield.setAttributeNS(null, "id", elemid);
					textfield.setAttributeNS(null, "fill", rgbA(options.fontColor));
					textfield.setAttributeNS(null, "font-family", options.fontFamily);
					textfield.setAttributeNS(null, "font-size", size);
					textfield.setAttributeNS(null, "data-nodeid", "");

					highlightednamescontainer.appendChild(textfield);
				}

				var x = node.x,
					y = node.y,
					textRect = getTextRect(textfield, node, onHoverOnly, size, nodeOffSets);

				textfield.setAttributeNS(null, "data-nodeid", node.nodeid);
				textfield.setAttributeNS(null, "x", textRect.left);
				textfield.setAttributeNS(null, "y", textRect.top);
				textfield.textContent = node.name;

				// anti collision for display / hide text
				textRect = positionTextRect(textRect);

				// remember the textRect's belonging to the node text labels
				textRects.push(textRect);
			}

			return elemid;
		}

		function checkQuadToDraw(quadid) {
			if(graphs[quadid] && graphs[quadid].header) {
				var screenrect = containerWorldRect();

				return shouldQuadBeVisible(screenrect, graphs[quadid].header);
			}
			return false;
		}

		function ScheduledAppendQuad(quadid) {
			this.quadid = quadid;
			drawQ[quadid] = true;

			this.call = function () {

				if(graphs[quadid]) {

 					appendSvgDOM(quadid);

					setTimeout(function() {
						delete drawQ[quadid];
						if(Object.keys(drawQ).length == 0) {
							if(options.onQuadsDrawn) {
								options.onQuadsDrawn();
							}
							if(!firstQuadDrawn) {
								if(options.onFirstQuadDrawn) {
									options.onFirstQuadDrawn();
								}
								firstQuadDrawn = true;
							}
						}
					}, 400);
				}

				return true;
			}
			return this;
		}

		function makeLineElementEllipticalArc(x1, y1, x2, y2) {
			
			var line = document.createElementNS(xmlns, "path"),
				dx = x2 - x1, dy = y2 - y1,
				len = Math.sqrt(dx * dx + dy * dy),
				r = 2 * len,
				sweep = (dy < 0) ? "0" : "1",
				d = "M" + x1 + "," + y1 + " A" + r + "," + r + " 0 0 " + sweep + " " + x2 + "," + y2;

			line.setAttributeNS(null, "d", "" + d);
			line.setAttributeNS(null, "fill", "none");

			return line;
		}

		function makeLineElementStraight(x1, y1, x2, y2) {

			var line = document.createElementNS (xmlns, "line");
			 
			line.setAttributeNS (null, "x1", ""+x1);
			line.setAttributeNS (null, "y1", ""+y1);
			line.setAttributeNS (null, "x2", ""+x2);
			line.setAttributeNS (null, "y2", ""+y2);

			return line;
		}

		function nodeRange(node) {

			var minsize = mapinfo["minsize"];
			var maxsize = mapinfo["maxsize"];

			// HERE bug #1
			// Uncaught TypeError: Cannot read property 'size' of null(…) at 1156
			var nodesize = node.size;

			var range = 0.5;
			if (Math.abs(maxsize - minsize) > 0.00001) {
				range = (nodesize - minsize) / (maxsize - minsize);
			}
			range = Math.pow(range, options.nodeRadiusScalePower);

			return range;
		}

		function AsyncEdges(quadid, glin) {
			this.quadid = quadid;
			this.i = 0;
			this.call = function ()
			{

				var graph = graphs[this.quadid];
				if (graph == null) {
					return true;
				}

				var nredges = graph["relations"].length;

				//if (nredges > 100) nredges = 100;

				var j;
				for (j = 0; j < nredges; j++) {
					if (this.i >= nredges) {

						linescontainer.appendChild(glin);
						return true;
					}

					var graphA = graphs[graph["relations"][this.i].quadA],
						graphB = graphs[graph["relations"][this.i].quadB];
					
					if (graphA == null || graphB == null) {

						this.i = this.i + 1;
						continue;
					}

					var drawEdge = true;

					var pos = graphA["idmap"][graph["relations"][this.i].nodeidA],
						node1 = graphA["nodes"][pos],
						x1 = graphA["nodes"][pos].x,
						y1 = graphA["nodes"][pos].y;

					if((!node1.name || node1.name == settings.NULLnodeName) && settings.hideNULLnameNodes) drawEdge = false;

					if(drawEdge) {
						pos = graphB["idmap"][graph["relations"][this.i].nodeidB];

						var node2 = graphB["nodes"][pos],
							x2 = graphB["nodes"][pos].x,
							y2 = graphB["nodes"][pos].y,
							edgeOpacity = 0.5,
							line = makeLineElement(x1, y1, x2, y2);

						if((!node2.name || node2.name == settings.NULLnodeName) && settings.hideNULLnameNodes) drawEdge = false;

						if(drawEdge) {
							line.id = this.quadid + "-edge-" + this.i;
							line.style.stroke = "" + edgeColor(node1, node2);
							line.setAttributeNS(null, "stroke-opacity", "" + edgeOpacity);

							//		var msie = (window.navigator.userAgent.indexOf("MSIE ") > 0);
							//      if (msie)
							//      {
							//			var edgeWidth = 1;
							//        line.setAttributeNS (null, "stroke-width",""+(edgeWidth*edgeWidthScale)); 
							//      }
							//      else
							//{
							line.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
							line.setAttributeNS(null, "stroke-width", "1px");
							//}

							line.setAttributeNS(null, "stroke-linecap", "round");
							glin.appendChild(line);
						}
					}

					this.i = this.i + 1;
				}

				if(this.i >= nredges)  linescontainer.appendChild(glin);
				// why is there also a return in the loop with thesame check ?

				return (this.i >= nredges);
			};

			return this;
		}

		function MakeNodeElement(quadid, node, mode, showNameOnHover) {

			var highlighted = ((mode & nodemodeflagHighlighted) != 0);
			var centered = ((mode & nodemodeflagCentered) != 0);

			var x = node.x;
			var y = node.y;

			var range = nodeRange(node);

			var nodeRadius = calcNodeRadius(range) * nodeRadiusScale * calcCurrentNodeScale();
			var nEdgeWid = 0;
			var opacity;

			var id = getNodeId(quadid, node.nodeid, highlighted),
				textId = showNameOnHover ? options.highlightedNodeTextClass + node.nodeid : false;

			if (highlighted) {
				nodeRadius *= 1.5;
				opacity = 1;
			} else {
				opacity = 0.6;
			}

			var color;
			if (centered) {
				color = rgbA([255, 255, 255]); // pure white
				nEdgeWid = 5 * nodeEdgeWidth(range) * nodeEdgeRadiusScale;
			} else {
				color = nodeColor(node, opacity);
			}

			var circleHtml = '';

			if(node.name && (node.name != settings.NULLnodeName || !settings.hideNULLnameNodes)) {

				circleHtml = '<circle class="' + options.nodeClass + '"' +
							'id="' + id + '"' +
							'data-quadid="' + quadid + '"' +
							'data-name="' + node.name + '"' +
							'data-nodeid="' + node.nodeid + '"' +
							'cx="' + x + '"' +
							'cy="' + y + '"' +
							'r="' + nodeRadius + '"' +
							'stroke="' + nodeEdgeColor(node) + '"' +
							'stroke-width="' + nEdgeWid + '"' +
							'show-name-on-hover="' + textId + '"' +
							'fill="' + color + '">' +
							'</circle>';
			}

			return circleHtml;
		}

		function addNodeEvents(container) {
			container.addEventListener('mousedown', function (e) {
				e.cancelBubble = true;
				var node = e.target;

				if(node) {
					var name = node.getAttribute('data-name');

					if(name && (name != settings.NULLnodeName || settings.enableNULLnameNodes)) {
						currentnodeid = node.getAttribute('data-nodeid');
						showInfoAbout(node.getAttribute('data-quadid'), node.getAttribute('data-nodeid'));
					}
				}
			});

			var hoverAction = false;

			container.addEventListener('mouseover', function (e) {
				e.cancelBubble = true;
				var node = e.target;
				if(node && node.tagName == 'circle') {
					var quadId = node.getAttribute('data-quadid'),
						nodeId = node.getAttribute('data-nodeid');

					hoverAction && clearTimeout(hoverAction);
					hoverAction = setTimeout(function() {
						hoverIn(quadId, nodeId);
						hoverAction = false;
					}, options.hoverDelay);
				}
			});
			container.addEventListener('mouseleave', function (e) {
				var node = e.target;
				if(node) {
					if(!hoverAction) {
						hoverOut();
					} else {
						clearTimeout(hoverAction);
						hoverAction = false;
					}
				}
			});

			if('ontouchstart' in document.documentElement) {
				container.addEventListener('touchstart', function (evt) {
					var e = evt.changedTouches[0],
						node = e.target;
					if(node) {
						showInfoAbout(node.getAttribute('data-quadid'), node.getAttribute('data-nodeid'));
						evt.preventDefault();
						evt.cancelBubble = true;
					}
				});

				container.addEventListener('touchmove', function (evt) {
					var e = evt.changedTouches[0],
						node = e.target;
					if(node) {
						evt.preventDefault();
						evt.cancelBubble = true;
					}
				});

				container.addEventListener('touchend', function (evt) {
					var e = evt.changedTouches[0],
						node = e.target;
					if(node) {
						evt.preventDefault();
						evt.cancelBubble = true;
					}
				});
			}
		}

		function appendSvgDOM(quadid) {

			if(!graphs[quadid] || !graphs[quadid]["nodes"]) return;
			if(drawnQuad(quadid)) return;

			var graph = graphs[quadid];

			if (graph == null) {
				return;
			}

			var i;

			var xmin = mapinfo["quadtree"]["xmin"],
				xmax = mapinfo["quadtree"]["xmax"],
				ymin = mapinfo["quadtree"]["ymin"],
				ymax = mapinfo["quadtree"]["ymax"],
				glin = document.createElementNS(xmlns, "g"),
				gnod = document.createElementNS(xmlns, "g");

			// EDGES
			glin.setAttributeNS(null, "class", options.quadClass);
			glin.setAttributeNS(null, "id", quadid);

			if (options.debugQuads && graph["header"]) {

				var	quadStroke = 'black',
					quadDesc = quadid,
					quadLevel = quadid.length - 4,
					textYindent = quadLevel,
					rect = document.createElementNS(xmlns, "rect"),
					pixelWidth = (1 / currentScale),
					xOffset = 2 * quadLevel * pixelWidth,
					yOffset = 2 * quadLevel * pixelWidth,
					x = (graph["header"]["xmin"] + xOffset),
					y = (graph["header"]["ymin"] + xOffset),
					width = Math.max((graph["header"]["xmax"] - graph["header"]["xmin"] - xOffset * 2), pixelWidth),
					height = Math.max((graph["header"]["ymax"] - graph["header"]["ymin"] - yOffset * 2), pixelWidth),
					textFontScale = calcCurrentFontScale();

				/* check the Y indent, which is based on distance of parents top edge */

				var parentQuadid = false

				if(!(quadid.endsWith('_')) && quadLevel < 5) {
					parentQuadid = quadid.slice(0, -1);

					var parentGraph = graphs[parentQuadid];
					if(parentGraph && parentGraph["header"]) {
						if(parentGraph["header"]["ymin"] < graph["header"]["ymin"]) {
							textYindent = 1 + quadLevel * pixelWidth / 3;
						}
					} else {
						textYindent = 1;
					}
				}

				// alternating colors for quads
				if(graph.shingleIndex > -1) {
					//quadStroke = rgbA(options.quadDebugColors[graph.shingleIndex % options.quadDebugColors.length]);
					quadStroke = rgbA(options.quadDebugColors[Math.max(quadLevel - 1, 0) % options.quadDebugColors.length]);
				}

				rect.setAttributeNS(null, "x", "" + x);
				rect.setAttributeNS(null, "y", "" + y);
				rect.setAttributeNS(null, "width", "" + width);
				rect.setAttributeNS(null, "height", "" + height);
				rect.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
				rect.setAttributeNS(null, "stroke-width", 1);

				rect.style.fill = "none";
				rect.style.stroke = quadStroke;
				rect.style.fillOpacity = "0";
				rect.style.strokeOpacity = "1";

				var textfield = document.createElementNS(xmlns, 'text');
				rect.setAttributeNS(null, "class", options.debugQuadClass + '-rect');
				textfield.setAttributeNS(null, "class", options.debugQuadClass + '-text');
				textfield.setAttributeNS(null, "fill", quadStroke);
				textfield.setAttributeNS(null, "font-family", options.fontFamily);
				textfield.setAttributeNS(null, "font-size", textFontScale * 4 / Math.min(quadLevel, 5));
				textfield.setAttributeNS(null, "x", x + textFontScale + quadLevel * pixelWidth * 2);
				textfield.setAttributeNS(null, "y", Math.min(y + textFontScale * textYindent * pixelWidth));
				textfield.addEventListener('mouseenter', function() {
					rect.setAttributeNS(null, "stroke-width", 3);
					gnod.setAttributeNS(null, "class", options.debugQuadClass);
					glin.setAttributeNS(null, "class", options.debugQuadClass);
				});
				textfield.addEventListener('mouseleave', function() {
					rect.setAttributeNS(null, "stroke-width", 1);
					gnod.setAttributeNS(null, "class", "");
					glin.setAttributeNS(null, "class", "");
				});

				var textNode = document.createTextNode(quadDesc);
				textfield.appendChild(textNode);

				glin.appendChild(textfield);
				glin.appendChild(rect);
			}

			scheduler.addTask(new AsyncEdges(quadid, glin));

			// NODES
			quadsDrawn[quadid] = true;

			gnod.setAttributeNS(null, "class", options.quadClass);
			gnod.setAttributeNS(null, "id", quadid);

			var circleHTML;
			for (i = 0; i < graph["nodes"].length; i++) {
				circleHTML += MakeNodeElement(quadid, graph["nodes"][i], nodemodeGraph);
			}
			gnod.innerHTML = circleHTML;

			if(options.selectNodes) {
				addNodeEvents(gnod);
			}

			if (highlightednodescontainer != null) {

				if (highlightednodescontainer.firstChild == null) {

					var lookup = graph["idmap"][currentnodeid];
					if (lookup) {
						showInfoAbout(quadid, currentnodeid);
					}
				}
			}

			nodescontainer.appendChild(gnod);
		}

		function execSvgScales(finished) {

			// scale scaling layer
			scalingEl.setAttribute('transform', 'scale(' + currentScale + ')');			

			// scale texts
			scaleTextRects();

			// scale nodes JS when applicable
			if (!useGraphCSS && quadLevels) {

				var nsize = calcCurrentNodeScale(),
					nodeEls = svg.getElementsByClassName(options.nodeClass);

				len = nodeEls.length;
				for (i = 0; i < len; i++) {
					var element = nodeEls[i];
					var node = getNodesData(element.getAttribute('data-quadid'), element.getAttribute('data-nodeid'));

					// HERE bug #1, node sometimes not found not in quads and is undefined
					// for now just ignore ..
					if(node) {
						var range = nodeRange(node);
						var nodeRadius = calcNodeRadius(range) * nodeRadiusScale * nsize;
						element.setAttributeNS(null, "r", nodeRadius);
					}
					// END BUG #1 workaround
				}
			}
		}

		function setSvgScales(finished) {
			// try to minimize forced reflow here, we should determine completion
			// of the translation, for now use a little timeout ..
			execSvgScales(finished);
			setTimeout(function() {
				setBoundingrectDims();
				finished && finished();
			}, 10);
		}

		function setSvgTranslations() {
			translationEl.setAttribute('transform', 'translate(' + currentTranslateX + ' ' + currentTranslateY + ')');
		}

		function doscale(e, done) {
			var value = parseInt(e.target.value);
			scaleTo(value, done || false);
		}

		function doscaleFinish(e) {
			doscale(e, function() {
				findQuadsToDraw();
				findQuadsToRemove();
			});
		}

		function scaleTo(level, done) {

			clearTimeout(execScale);
			execScale = setTimeout(function() {

				// uniform scale function for use with wheel, slider, api's
				currentScaleStep = level;
				currentScale = zoomSteps[level];

				// scaling step by class dyn css
				mfrmap.className = options.mapClass + ' shingle-unselectable' + ' i' + instance + '-zoom-level-' + level;

				zoom.value = level;
				updateBitmapOpacity();
				setSvgScales(done);

			}, 20);
		}

		function doZoom(step) {

			// notice the zoom function works in reverse in shingle ..
			var shouldScale = true;
			currentScaleStep += step;
			if(currentScaleStep < 0) {
				currentScaleStep = 0;
				shouldScale = false;
			}
			if(currentScaleStep > zoomSteps.length - 1) {
				currentScaleStep = zoomSteps.length - 1;
				shouldScale = false;
			}
			shouldScale && scaleTo(currentScaleStep, function() {
				findQuadsToDraw();
				findQuadsToRemove();
			});
		}

		function zoomIn() {
			doZoom(-1 * sliderZoomStep);
		}

		function zoomOut() {
			doZoom(sliderZoomStep);
		}

		function zoomReset() {
			currentScaleStep = startScaleStep;
			scaleTo(currentScaleStep, function() {
				findQuadsToDraw();
				findQuadsToRemove();
			});
		}

		function HighlightedNode() {
			this.currentHighlightedId = null;
			this.currentHighlightedIdHighlighted = null;
			this.currentHighlightedQuadId = 0;
			this.currentHighlightedIndex = 0;

			this.unhighlight = function () {
				if (this.currentHighlightedId != null) {
					var graph = graphs[this.currentHighlightedQuadId];
					if (graph == null) {
						return;
					}

					var node = graph["nodes"][this.currentHighlightedIndex];
					if (node == null) {
						return;
					}

					var range = nodeRange(node),
						nEdgeWid = nodeEdgeWidth(range) * nodeEdgeRadiusScale,
						nodeRadius = calcNodeRadius(range) * nodeRadiusScale * calcCurrentNodeScale(),
						circle = document.getElementById(this.currentHighlightedId);

					if (circle) {
						circle.setAttributeNS(null, "r", nodeRadius);
						circle.setAttributeNS(null, "stroke-width", "0");
					}

					circle = document.getElementById(this.currentHighlightedIdHighlighted);
					
					if (circle) {
						var textid = circle.getAttributeNS(null, 'show-name-on-hover');
						if(textid && textid != "false") {
							document.getElementById(textid).style.display = "none";
						}
						circle.setAttributeNS(null, "r", nodeRadius * 1.5);
						circle.setAttributeNS(null, "stroke-width", "" + nEdgeWid);
					}
				}
			};

			this.sethighlighted = function (quadid, nodeid) {
				var graph = graphs[quadid];
				if (graph == null) {
					return;
				}
				this.currentHighlightedQuadId = quadid;
				this.currentnodeid = nodeid;

				this.currentHighlightedIndex = graph["idmap"][nodeid];
				if (this.currentHighlightedIndex == null) {
					return;
				}

				this.currentHighlightedId = getNodeId(this.currentHighlightedQuadId, graph["nodes"][this.currentHighlightedIndex].nodeid, false);
				this.currentHighlightedIdHighlighted = this.currentHighlightedId + "highlighted";
			};

			this.highlight = function () {

				calcBaseScale();

				if (this.currentHighlightedId != null) {
					var graph = graphs[this.currentHighlightedQuadId];
					if (graph == null) {
						return;
					}

					var node = graph["nodes"][this.currentHighlightedIndex];
					if (node == null) {
						return;
					}

					var range = nodeRange(node),
						nEdgeWid = nodeEdgeWidth(range) * nodeEdgeRadiusScale,
						nodeRadius = calcNodeRadius(range) * nodeRadiusScale * calcCurrentNodeScale() * 1.5,
						circle = document.getElementById(this.currentHighlightedId);

					if (circle) {
						circle.setAttribute("r", nodeRadius);
						circle.setAttributeNS(null, "stroke-width", "" + 5 * nEdgeWid);
					}

					circle = document.getElementById(this.currentHighlightedIdHighlighted);
					if (circle) {
						var textid = circle.getAttributeNS(null, 'show-name-on-hover');
						if(textid && textid != "false") {
							document.getElementById(textid).style.display = "initial";
						}
						circle.setAttribute("r", nodeRadius * 1.5);
						circle.setAttributeNS(null, "stroke-width", "" + 5 * nEdgeWid);
					}
				}
			};
			return this;
		}

		function getNodesData(quadid, nodeid) {
			var graph = graphs[quadid],
				data = null;

			if (graph) {
				var index = graph["idmap"][nodeid];
				if(typeof index != "undefined") data = graph["nodes"][index];
			}
			return data;
		}

		function triggerClear() {
			options.onClear && options.onClear();
			clearNodeNames();
		}

		function changehighlightTo(quadid, nodeid) {

			showInfoAbout(quadid, nodeid);
			var graph = graphs[quadid];

			if (graph) {
				var index = graph["idmap"][nodeid];
				var node = graph["nodes"][index];

				if(node) {
					// bounding rect only change on pan, zoom and external move (focusIn)
					setBoundingrectDims();

					var rect = containerWorldRect();
					if (node.x < rect[0] ||
						node.y < rect[1] ||
						node.x > rect[2] ||
						node.y > rect[3])
					{
						currentTranslateX = -node.x;
						currentTranslateY = -node.y;
						setSvgTranslations();
						findQuadsToDraw();
						findQuadsToRemove();
					}
				}
			}
		}

		function async_showmfrinfo(quadid, nodeid) {

			var self = this;

			this.quadid = quadid;
			this.nodeid = nodeid;
			this.nodeFrom = false;
			this.loadingQuad = false;
			this.relatedDrawn = {},
			this.j = 0;

			this.findNodeFrom = function() {

				if(this.nodeFrom) return;

				if (highlightedlinescontainer == null) {
					return ;
				}

				if (highlightednodescontainer == null) {
					return ;
				}

				var graph = graphs[this.quadid];

				if (graph == null) {
					if(!this.loadingQuad) {
						this.loadingQuad = true;
						loadQuad(quadid);
					}
					return ;
				}

				this.nodeFrom = {
					graph: null,
					node: null
				};

				var node1 = null;
				var nodeIndex;

				nodeIndex = graph["idmap"][this.nodeid];

				node1 = graph["nodes"][nodeIndex];

				if(node1) {
					this.nodeFrom.graph = graph;
					this.nodeFrom.node = node1;

					// draw the selected node ?
					if (highlightednodescontainer != null && node1 != null) {

						var circleHTML = MakeNodeElement(this.quadid, node1, nodemodeCentered);
						highlightednodescontainer.innerHTML += circleHTML;

						// clear and show main node name, only at first cycle !
						if(this.j < 100) {

							var circleHTML = MakeNodeElement(this.quadid, node1, nodemodeCentered);
							highlightednodescontainer.innerHTML += circleHTML;

							clearNodeNames();
							showNodeName(this.quadid, node1, options.highlightedNodeTextClass);

							//BUG #2 also here the node is sometimes not present in getNodesData, failing the onFocus
							var nodeData = getNodesData(quadid, nodeid);
							options.onFocus && options.onFocus(quadid, nodeid, nodeData);
						}
					}
				}
			};

			this.createEdge = function(quadid, node1, node2) {

				var x1 = node1.x, y1 = node1.y,
					x2 = node2.x, y2 = node2.y,
					edgeOpacity = 0.5,
					line = makeLineElement(x1, y1, x2, y2);

				line.style.stroke = "" + edgeHighlightColor(node1, node2);
				line.setAttributeNS(null, "stroke-opacity", "1");

				line.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
				line.setAttributeNS(null, "stroke-width", "2px");
				line.setAttributeNS(null, "stroke-linecap", "round");
				highlightedlinescontainer.appendChild(line);

				if (highlightednodescontainer != null && node2 != null) {

					// related nodes
					var showNameOnHover = (options.showRelatedNodeNames == 'hover'),
						circleHTML = MakeNodeElement(quadid, node2, nodemodeHighlighted, showNameOnHover);

					highlightednodescontainer.innerHTML += circleHTML;

					//
					// show the related node names ?
					// use unique name
					if(options.showRelatedNodeNames !== false) {
						var offSets = {
							x: (x2 < x1) ? -1 : 1,
							y: (y2 < y1) ? -1 : 1,
							d: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
						}
						showNodeName(quadid, node2, options.highlightedNodeTextClass, showNameOnHover, offSets);
					}
				}
			};

			this.drawRelatedEdge = function(fromNode, toNode) {

				var node2 = null,
					graphB = graphs[toNode.quad],
					tries = 0,
					drawEdge = function() {
						node2 = graphB["nodes"][graphB["idmap"][toNode.node]];

						if (fromNode != null && node2 != null) {

							// visualize edge between 2 highlighted nodes
							if(!self.relatedDrawn[node2.nodeid]) {
								self.relatedDrawn[node2.nodeid] = true;
								self.createEdge(toNode.quad, fromNode, node2);
								if(node2.name && node2.name != settings.NULLnodeName) {
									// callbacks for related nodes only when on map
									options.onFocusRelatedNode && options.onFocusRelatedNode(toNode.quad, node2.nodeid, getNodesData(toNode.quad, node2.nodeid));
								}
							}
						}
					};

				if(!graphB) {

					loadQuad(toNode.quad);

					var quadWatcher = setInterval(function() {

						graphB = graphs[toNode.quad];
						if (graphB) {
							clearInterval(quadWatcher);
							drawEdge();
						} else {
							if(++tries > 99) clearInterval(quadWatcher);
						}
					}, 200);
				} else {
					drawEdge();
				}
			};

			this.findRelationsUsingMap = function () {

				if(++this.j > 100) return true;

				this.findNodeFrom();

				if(this.nodeFrom) {

					if(!this.nodeFrom.graph || !this.nodeFrom.node || !this.nodeFrom.node.nodeid) {
 						return true;
					}

					function drawRelatedEdges(quadid) {

						var url = options.graphPath + 'findRelations' +
								'?quadid=' + quadid +
								'&nodeid=' + self.nodeFrom.node.nodeid;

						ajaxGet(url, function(response) {
							if(response) {
								var relations = JSON.parse(response);

								if(relations && relations.toNodes && relations.toNodes.length) {
									for (var i = 0; i < relations.toNodes.length; i++) {
										self.drawRelatedEdge(self.nodeFrom.node, relations.toNodes[i]);
									};
								}
							}
						});
					};

					// draw main layer edges
					drawRelatedEdges(quadid);
					// draw sublayer edges
					drawRelatedEdges('e' + quadid);

					// end cycles
					return true;
				}
			};

			this.findRelations = function () {

				this.findNodeFrom();

				if(this.nodeFrom) {

					if(!this.nodeFrom.graph) {
						return true;
					}

					var	graph = this.nodeFrom.graph,
						node1 = this.nodeFrom.node;

					// highlight the related nodes / lines
					// max 100 at one scheduler cycle
					for (var i = 0; i < 100; i++) {

						var node2 = null;
						if (this.j >= graph["relations"].length) {
							return true;
						}

						var quadid2 = quadid;

						if (graph["relations"][this.j].nodeidA == nodeid) {

							self.drawRelatedEdge(node1, {
								node: graph["relations"][this.j].nodeidB,
								quad: graph["relations"][this.j].quadB
							});
						} else if (graph["relations"][this.j].nodeidB == nodeid) {

							self.drawRelatedEdge(node1, {
								node: graph["relations"][this.j].nodeidA,
								quad: graph["relations"][this.j].quadA
							});
						}

						this.j = this.j + 1;
					}
				}
			};

			// use a different algortihm supported by the node backend if supported
			this.call = mapinfo.loadFromBackend && mapinfo.backendMapsNodeRelations ? this.findRelationsUsingMap : this.findRelations;

			return this;
		}

		function syncInfoDisplay(yesNo) {
			if (options.infoContentEl) {
				infoDisplayAction && clearTimeout(infoDisplayAction);
				infoDisplayAction = setTimeout(function() {
					if(!(nodeInfo.parentNode === options.el)) {
						options.el.appendChild(nodeInfo);
					}
				}, options.infoSyncDelay);
			}
		}

		function showmfrinfo(quadid, nodeid) {

			if (last_async_showmfrinfo != null) {
				last_async_showmfrinfo.j = 1000000;
			}
			triggerClear();

			if(options.containerWithFocusClass) {
				options.el.classList.add(options.containerWithFocusClass);
			}

			syncInfoDisplay(true);

			if (quadLevels) {
				loadNonCompactQuad(quadid, true);
			}

			last_async_showmfrinfo = new async_showmfrinfo(quadid, nodeid);
			highlightScheduler.addTask(last_async_showmfrinfo);
		}

		function removeInfoAbout() {

			textRects = [];
			linescontainer.setAttributeNS(null, "opacity", "1");
			nodescontainer.setAttributeNS(null, "opacity", "1");

			currentHighlightedNode.unhighlight();
			forgetHighlightedNodesLoaded();

			if(highlightedlinescontainer.firstChild) highlightedlinescontainer.innerHTML = "";
			if(highlightednodescontainer.firstChild) highlightednodescontainer.innerHTML = "";

			triggerClear();
		}

		function showInfoAbout(quadid, nodeid) {
			removeInfoAbout();
			linescontainer.setAttributeNS(null, "opacity", "0.5");
			nodescontainer.setAttributeNS(null, "opacity", "0.5");

			currentHighlightedNode.highlight();
			showmfrinfo(quadid, nodeid);
		}

		function hoverIn(quadid, nodeid) {

			options.onHoverIn && options.onHoverIn(quadid, nodeid);

			currentHighlightedNode.unhighlight();
			currentHighlightedNode.sethighlighted(quadid, nodeid);
			currentHighlightedNode.highlight();
		}

		function hoverOut() {

			options.onHoverOut && options.onHoverOut();

			currentHighlightedNode.unhighlight();
		}

		function init() {

			var shinglecontainer = options.el;
			if (!shinglecontainer) return ;

			initDefaults();

			if (!options.graphPath) return ;

			setBoundingrectDims = options.calcBoundingRectDimsMethodExperimental ? setBoundingrectDimsExperimental : setBoundingrectDimsDefault;

			scheduler = new Scheduler(schedulerStep);
			highlightScheduler = new Scheduler(highlightschedulerStep)
			currentHighlightedNode = new HighlightedNode();

			mfrmap = document.createElement("div");
			shinglecontainer.appendChild(mfrmap);

			zoom = document.createElement("input");

			if(!options.zoomSlider) zoom.style.display= "none";

			zoom.setAttribute("type", "range");
			zoom.setAttribute("name", "zoom");
			zoom.setAttribute("min", "0");
			zoom.className = "shingle-zoom";
			zoom.addEventListener("change", doscaleFinish)
			zoom.addEventListener("input", doscale);
			shinglecontainer.appendChild(zoom);

			if (options.infoContentEl) {
				nodeInfo = document.createElement("div");
				nodeInfo.appendChild(options.infoContentEl);
			}

			if (options.debug) {
				debugEl = document.createElement("div");
				debugEl.className = "shingle-debug";
				shinglecontainer.appendChild(debugEl);
			}

			attachMouseEvents();

			var nodeid = null;

			// some defaults / parameters may come from the url
			if (document.location.search) {
				var i;
				var request = new Array();
				var vals = document.location.search.substr(1).split("&");
				for (i in vals) {
					vals[i] = vals[i].replace(/\+/g, " ").split("=");
					request[unescape(vals[i][0]).toLowerCase()] = unescape(vals[i][1]);
				}

				if (request[options.nodeField]) {
					nodeid = request[options.nodeField];
					var hashed = getHash(nodeid);
				}
				if (request["debug"]) {
					options.debug = true;
				}
				if (request["debugquads"]) {
					options.debugQuads = true;
				}
			}

			if(!nodeid && options.nodeId) nodeid = options.nodeId;

			loadMapInfo(nodeid);

			// the map rect only needs to be determined initial and on resize
			mfrmap.addEventListener("resize", setMapRect);

			document.addEventListener('keyup', function KeyCheck(e) {
				var KeyID = (window.event) ? event.keyCode : e.keyCode;
				var actualkey = String.fromCharCode(KeyID);
				if (actualkey == "a" || actualkey == "A") {
					findQuadsToDraw();
				} else if (actualkey == "r" || actualkey == "R") {
					findQuadsToRemove();
				}
			});
		}

		if (options.el) {
			init();
		}

		return {
			hoverIn: hoverIn,
			changehighlightTo: changehighlightTo,
			zoomIn: zoomIn,
			zoomOut: zoomOut,
			zoomReset: zoomReset
		};

	}, newGraph = function (settings) {
		return new graph(settings, instances++);
	}

	return {
		new : newGraph
	}
})();

/*
 * example to embed shingle
 * 
 
 // create an info component, the default
 // can be used by downloading shingleInfoPanel.js
 var theInfoData = new shingleInfoPanel();
 
 // create the graph
 var myGraph = shingle.new({
	el: document.getElementById("shinglecontainer"),
	initialZoom: 20,
	scrollZoomInitDelay: 777,
	wheelZoom: true,
	infoContentEl: theInfoData.el,
	onClear: function() {
		theInfoData.clear();
	}, onFocus: function(quadid, nodeid, data) {
		theInfoData.setMainNode(quadid, nodeid, data);
	}, onFocusRelatedNode: function(quadid, nodeid, data) {
		theInfoData.appendRelatedNode(quadid, nodeid, data);
	}, onHoverIn: function(quadid, nodeid) {
		theInfoData.highLightNode(quadid,nodeid);
	}, onHoverOut: function() {
		theInfoData.unHighLightNode();
	}
 });                                        
 
 // set the info hover behaviour
 theInfoData.onHover(function(quadId, nodeId) {
	myGraph.hoverIn(quadId, nodeId);
 });
 
 theInfoData.onClick(function(quadid, nodeid) {
	 myGraph.changehighlightTo(quadid, nodeid);
 });
 
 */