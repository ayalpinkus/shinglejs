"use strict";

var shingle = shingle || (function () {

	var instances = 0,
		graph = function (settings, instance) {

		// Begin editable parameters
		var options = settings || {},
			defaults = {
				// these are equal to the possible settings
				// commented lines represent other option values
				useBitmap: false,
				useMarkers: false,
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
				markercontainerClass: 'shingle-marker-container',
				markerClass: 'shingle-marker',
				linescontainerClass: 'shingle-lines-container',
				highlightedlinescontainerClass: 'shingle-highlighted-lines-container',
				nodescontainerClass: 'shingle-nodes-container',
				highlightednodescontainerClass: 'shingle-highlighted-nodes-container',
				highlightednamescontainerClass: 'shingle-highlighted-names-container',
				nodeClass: 'shingle-node',
				nodeTextClass: 'shingle-node-text',
				highlightedNodeClass: 'shingle-node-highlighted',
				highlightedNodeTextClass: 'shingle-node-h-text',
				mapClass: 'shingle-map',
				quadClass: 'shingle-quad',
				debugQuadClass: 'shingle-debug-quad',
				debugNodeClass: 'shingle-debug-node',
				nodeColors: [[240, 188, 0], [178, 57, 147], [39, 204, 122], [21, 163, 206], [235, 84, 54], [138, 103, 52], [255, 116, 116], [120, 80, 171], [48, 179, 179], [211, 47, 91]],
				defaultNodeColor: [214, 29, 79],
				edgeClass: 'shingle-edge',
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
				hoverDelay: 66,
				debug: false,
				debugQuads: false,
				calcBoundingRectDimsMethodExperimental: false,
				useMultipleQuadsLoader: true,
				quadDisplayThreshold: 0.25
			};

		function isFirefox() {
			return (navigator.userAgent.toLowerCase().indexOf('firefox') > -1);
		};

		function isIE() {
			return (navigator.userAgent.toLowerCase().indexOf('msie') > -1) || (navigator.userAgent.toLowerCase().indexOf('trident') > -1);
		};

		// IE polyfills needed by shingle
		if (!String.prototype.startsWith) {
			Object.defineProperty(String.prototype, 'startsWith', {
				enumerable: false,
				configurable: false,
				writable: false,
				value: function(searchString, position) {
				    position = position || 0;
					return this.substr(position, searchString.length) === searchString;
				}
			});
		}
		if (!('classList' in Element.prototype)) {
			var ClassList = function(element) {
				this.element = element;
			}
			ClassList.prototype = {
				get: function() {
					return this.element.getAttributeNS(null, "class");
				}, set: function(name) {
					this.element.setAttributeNS(null, "class", name);
				}, add: function(addName) {
					var classStr = this.get();
					if(!classStr) classStr = addName;
					else {
						var clsArr = classStr.split(' ');
						if(clsArr.length && clsArr.indexOf(addName) == -1) {
							clsArr.push(addName);
						}
						classStr = clsArr.join(' ');
					}
					this.set(classStr);
				}, remove: function(remName) {
					var classStr = this.get();
					if(classStr) {
						var clsArr = classStr.split(' ');
						if(clsArr.length) {
							while(true) {
								var i = clsArr.indexOf(remName);
								if(i == -1) break;
								clsArr.splice(i, 1);
							}
						}
						classStr = clsArr.join(' ');
					}
					this.set(classStr);
				}
			};
			Object.defineProperty(Element.prototype, 'classList', {
				get: function() {
				    return new ClassList(this);
				}
			});
		}

		// global private vars
		var nodeInfo, makeLineElement,
			xmlns = "http://www.w3.org/2000/svg",
			SVGversion = "1.2",
			baseProfile = "tiny",
			svg12T = !isIE(),
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
			linescontainer, nodescontainer, bitmapcontainer, markercontainer,  
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
			zoomStep = 0, zoomSteps = [], zoomStepsNodeScales = [], stepScale, currentScaleStep = false, startScaleStep = false, sliderZoomStep,
			textRects = [], svgDims = false,
			currentRect = false,
			execScale = false,
			nodeScaleTimer = false,
			quadsCache = {},
			dragCoordinates = { x: false, y: false },
			origin = location.origin || (location.protocol + "//" + location.hostname + (location.port ? ':' + location.port: ''));

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

		function ajaxRequest() {

			var self = this;

			this.xhr = null;
			this.options = null;
			this.IElt10 = false;
			this.isCORS = false;

			this.xhr = new XMLHttpRequest();
			// XHR for Chrome/Firefox/Opera/Safari has withCredentials
			if (!("withCredentials" in this.xhr)) {
				if (typeof XDomainRequest != "undefined") {
					// XDomainRequest for IE < 10.
					this.IElt10 = true;
				} else {
					// CORS not supported.
					this.xhr = null;
				}
			};

			this.init = function(options) {
				this.options = options;
				if(this.options.failure) {
					// retoute timeouts and cors errors to failure if not explicitly set and failure
					// is defined
					if(!this.options.ontimeout) {
						this.options.ontimeout = function() {
							self.options.failure('timeout');
						}
					}
					if(!this.options.corsnotsupported) {
						this.options.ontimeout = function() {
							self.options.failure('CORS error');
						}
					}
				}
				this.options.method = options.method || 'GET';
				if(this.options.url.startsWith('http://')) {
					// cors check
					if(!this.options.url.startsWith(origin)) {
						this.isCORS = true;
					}
				}
				// CORS in old IE
				if(this.isCORS && this.IElt10) this.xhr = new XDomainRequest();
			};

			this.open = function() {
				var url = this.options.url;

				this.options.data = this.options.data || {};
				this.options.data.httpAccept = this.options.httpAccept || 'application/json';

				var params = [];
				for (var par in this.options.data) {
					params.push(encodeURIComponent(par) + '=' + encodeURIComponent(this.options.data[par]));
				}

				url += (params.length && url.indexOf('?') == -1) ? '?' + params.join('&') : '';

				if(this.IElt10) {
					this.xhr.open(this.options.method, url);
				} else {
					this.xhr.open(this.options.method, url, true);
				}
			};

			this.send = function(options) {

				this.init(options);

				if(this.xhr) {
					if(this.options.url && this.options.success) {
						this.open();
						// Response handlers.
						this.xhr.onload = function() {
							if(self.IElt10) {
								self.options.success(self.xhr.responseText);
							} else {
								if(self.xhr.readyState) {
									if(self.options.statusChange) {
										var statusText = self.xhr.readyState;
										if(self.xhr.status) {
											statusText += ' (' + self.xhr.status + ')';
										} 
										self.options.statusChange(statusText);
									}
									if(self.xhr.readyState == 4) {
										if(self.xhr.status < 400) {
											self.options.success(self.xhr.responseText);
										} else {
											var errorText = 'error HTTP response ' + self.xhr.status;
											if(self.options.failure) {
												self.options.failure(errorText);
											}
										}
									}
								} else {
									if(self.xhr.status < 400) {
										self.options.success(self.xhr.responseText);
									} else {
										var errorText = 'error HTTP response ' + self.xhr.status;
										if(self.options.failure) {
											self.options.failure(errorText);
										}
									}
								}
							}
						};
						if(this.options.failure) {
							this.xhr.onerror = function(error) {
								self.options.failure(error);
							};
						}
						// ie9 not working without this..
						if(this.xhr.onprogress !== undefined) {
							this.xhr.onprogress = function() {
								self.options.progress && self.options.progress(self.IElt10 ? self.xhr.responseText : arguments);
							};
						}
						// ie11 in ie9 mode not working without this..
						if(this.xhr.ontimeout !== undefined) {
							this.xhr.ontimeout = this.options.timeout || function() { };
						}
						//
						// 500 errors and some cors errors occur during send
						this.xhr.send();
					}
				} else {
					if(this.options.corsnotsupported) {
						this.options.corsnotsupported();
					}
				}
			};

			return this;
		};

		function ajaxGet(url, callback) {

			var req = new ajaxRequest(url, "GET", callback);

			req.send({
				url: url,
				success: callback,
				failure: function(e) { console.log(e); }
			});
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
			var screenrect = containerWorldRect();

			for (var quadId in quadsDrawn) {

				if(!quadsDrawn.hasOwnProperty(quadId)) continue;
				if(quadsWithHighlightedNodes.hasOwnProperty(quadId)) continue;

				var quadDrawn = quadsDrawn[quadId],
					header = graphs[quadId].header;

				if (header != null) {
					if (!shouldQuadBeVisible(screenrect, header)) {

						if(quadDrawn.lines && quadDrawn.lines.parentNode) quadDrawn.lines.parentNode.removeChild(quadDrawn.lines);
						if(quadDrawn.nodes && quadDrawn.nodes.parentNode) quadDrawn.nodes.parentNode.removeChild(quadDrawn.nodes);
						delete quadsDrawn[quadId];
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

				var table = JSON.parse(response),
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
			stepScale = minScale;

			var incScale = options.nodesGrow ? 0.0015 : 0;

			// reverse edge width
			if(svg12T) {
				graphCSS.set('.' + options.mapClass + ' .' + options.edgeClass, {
					'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round'
				});
				graphCSS.set('.' + options.mapClass + ' .' + options.linescontainerClass + ' .' + options.edgeClass, {
					'font-size': '1px'
				});
				graphCSS.set('.' + options.mapClass + ' .' + options.highlightedlinescontainerClass + ' .' + options.edgeClass, {
					'font-size': '2px'
				});
			}

			// lines and nodes opacity based on focussed node
			graphCSS.set('.' + options.mapClass + ' .' + options.nodescontainerClass, {
				'opacity': '1'
			});
			graphCSS.set('.' + options.mapClass + ' .' + options.linescontainerClass, {
				'opacity': '1'
			});
			graphCSS.set('.' + options.mapClass + ' svg.with-focus' + ' .' + options.nodescontainerClass, {
				'opacity': '0.5'
			});
			graphCSS.set('.' + options.mapClass + ' svg.with-focus' + ' .' + options.linescontainerClass, {
				'opacity': svg12T ? '0.25' : '0.5'
			});

			while (stepScale <= maxScale && stepScale >= minScale) {

				if(startScaleStep === false && startScale >= (1 / stepScale)) {
					startScale = (1 / stepScale);
					startScaleStep = zoomStep;
					incScale = false;
				}
				zoomSteps[zoomStep] = (1 / stepScale);

				// edge width base em should always be around 2px at the screen
				// strictly only needed when SVG 1.2T not supported by the browser
				if(!svg12T) {
					graphCSS.set('.' + options.mapClass + '.i' + instance + '-zoom-level-' + zoomStep + ' .' + options.linescontainerClass + ' .' + options.edgeClass, {
						'stroke-width': Math.max((stepScale * 2), 0.017) + 'px'
					});
					graphCSS.set('.' + options.mapClass + '.i' + instance + '-zoom-level-' + zoomStep + ' .' + options.highlightedlinescontainerClass + ' .' + options.edgeClass, {
						'stroke-width': Math.max((stepScale * 6), 0.033) + 'px'
					});
				}

				var	scaleFactor = startScale * stepScale * (1 - (Math.log(zoomStep + 1) / 15));

				if(incScale && options.nodesGrow) {
					incScale += 0.0015;
				}
				scaleFactor += incScale;

				// reverse scale the node based on zoom level
				// keep in mind a min-width when using IE otherwise the nodes will disappear ..
				var scaleFactorM = svg12T ? scaleFactor : Math.max(scaleFactor, 0.04);
				graphCSS.set('.' + options.mapClass + '.i' + instance + '-zoom-level-' + zoomStep + ' .' + options.nodeClass, {
					'font-size': scaleFactorM + 'px'
				});

				// the highlighted node is 1.5 times bigger
				graphCSS.set('.' + options.mapClass + '.i' + instance + '-zoom-level-' + zoomStep + ' .' + options.nodeClass + '.' + options.highlightedNodeClass, {
					'font-size': (scaleFactorM * 1.5) + 'px'
				});
				graphCSS.set('.' + options.mapClass + '.i' + instance + '-zoom-level-' + zoomStep + ' g.' + options.highlightedNodeClass + ' .' + options.nodeClass, {
					'font-size': (scaleFactorM * 1.5) + 'px'
				});

				zoomStepsNodeScales[zoomStep] = scaleFactor;

				stepScale *= 1.1;
				zoomStep++;
			}

			// debug quad hover visual indicators
			if(options.debugQuads) {
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

		function getQuadCache(quadid, found, notfound) {
			if(quadsCache[quadid]) {
				found(quadsCache[quadid]);
			} else {
				notfound();
			}
		}

		function getQuadWithLoader(quadid, callback) {
			getQuadCache(quadid, callback, function() {
				quadsLoader.request(quadid, function(quad) {

					quadsCache[quadid] = quad;
					callback(quad);
				});
			});
		}

		function getQuadSingle(quadid, callback) {
			getQuadCache(quadid, callback, function() {

				var json_url = options.graphPath + quadid + ".json";

				ajaxGet(json_url, function(response) {
					var quad = JSON.parse(response);

					quadsCache[quadid] = quad;
					callback(quad);
				});
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

							if(quadsDrawn[quadid]) {
								var quadDrawn = quadsDrawn[quadid];

								if(quadDrawn.lines && quadDrawn.lines.parentNode) quadDrawn.lines.parentNode.removeChild(quadDrawn.lines);
								if(quadDrawn.nodes && quadDrawn.nodes.parentNode) quadDrawn.nodes.parentNode.removeChild(quadDrawn.nodes);
								delete quadsDrawn[quadid];
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
				var nredges = graph["relations"].length;
				var k;
				for (k = 0; k < nredges; k++) {
					var nodeidA = graph["relations"][k].nodeidA;
					var quadA = graph["relations"][k].quadA;
					var nodeidB = graph["relations"][k].nodeidB;
					var quadB = graph["relations"][k].quadB;

					if (nodeidA == currentnodeid || nodeidB == currentnodeid) {
						quadsWithHighlightedNodes[quadA] = 1;
						quadsWithHighlightedNodes[quadB] = 1;
					}
				}
			}
		}

		function forgetHighlightedNodesLoaded() {
			for (var quadId in quadsWithHighlightedNodes) {
				if (quadsWithHighlightedNodes.hasOwnProperty(quadId) && quadsDrawn[quadId]) {
					var quadDrawn = quadsDrawn[quadId];
						if(quadDrawn.lines && quadDrawn.lines.parentNode) quadDrawn.lines.parentNode.removeChild(quadDrawn.lines);
						if(quadDrawn.nodes && quadDrawn.nodes.parentNode) quadDrawn.nodes.parentNode.removeChild(quadDrawn.nodes);
				}
			}
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

			if(!dragCoordinates.x || !dragCoordinates.y) return ;

			var deltaX = evt.pageX - dragCoordinates.x,
				deltaY = evt.pageY - dragCoordinates.y;

			dragging = false;
			dragCoordinates.x = false;
			dragCoordinates.y = false;

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
					options.onBlur && options.onBlur(currentScaleStep);
					syncInfoDisplay(false);
				}
			} else {
				// pan
				options.onPan && options.onPan(deltaX, deltaY, currentScaleStep);
			}
		}

		function detectScrollRegular(evt, callback) {

			var delta = evt.wheelDelta / 40;

			if (delta) {
				callback((delta > 0) ? -1 : 1);
			}
		};

		function detectScrollFirefox(evt, callback) {

			var delta = evt.deltaY || evt.detail || 0;

			if (delta) {
				callback((delta > 0) ? 1 : -1);
			}
		};

		var detectScroll = isFirefox() ? detectScrollFirefox : detectScrollRegular;

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

						detectScroll(evt, function(delta) {
							doZoom(delta);
						});
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

		function loadBitmap(name, callback) {
			var xmlHTTP = new XMLHttpRequest();
			xmlHTTP.open('GET', options.graphPath + name, true);
			xmlHTTP.responseType = 'arraybuffer';
			xmlHTTP.onload = function(e) {
			    var blob = new Blob([this.response]);
				bitmapcontainer.setAttributeNS('http://www.w3.org/1999/xlink', "xlink:href", window.URL.createObjectURL(blob));
				updateBitmapOpacity();
				callback && callback();
			};
			xmlHTTP.send();
		}

		function createBaseSvgDOM() {
			svgCreated = true;

			var i,
				xmin = mapinfo["quadtree"]["xmin"],
				xmax = mapinfo["quadtree"]["xmax"],
				ymin = mapinfo["quadtree"]["ymin"],
				ymax = mapinfo["quadtree"]["ymax"];

			svg.setAttributeNS(null, "version", SVGversion);
			svg.setAttributeNS(null, "baseProfile", baseProfile);
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

            // Bitmap for all of map
            // Note IE9 does not support Blobs
            if(options.useBitmap && typeof(Blob) == "undefined") options.useBitmap = false;
            if(options.useBitmap) {
				bitmapcontainer = document.createElementNS(xmlns, "image");
				bitmapcontainer.setAttributeNS(null, "class", options.bitmapcontainerClass+" shingle-unselectable");
				bitmapcontainer.setAttributeNS(null, "x", ""+xmin);
				bitmapcontainer.setAttributeNS(null, "y", ""+ymin);
				bitmapcontainer.setAttributeNS(null, "width",  ""+(xmax-xmin));
				bitmapcontainer.setAttributeNS(null, "height", ""+(ymax-ymin));
				bitmapcontainer.style.opacity = 0;

				loadBitmap("image_2400low.jpg", function() {
					loadBitmap("image_2400.jpg");
				});

				bitmapcontainer.ondragstart = function() { return false; };

				translationEl.appendChild(bitmapcontainer);
            }

            // append the layer containers

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

			// names of the highlighted nodes
			highlightednamescontainer = document.createElementNS(xmlns, "g");
			highlightednamescontainer.setAttributeNS(null, "class", options.highlightednamescontainerClass);
			translationEl.appendChild(highlightednamescontainer);

			// highlighted nodes and related nodes
			// last in sequence because names van 'overlap' the nodes which impacts event handlers in FF
			highlightednodescontainer = document.createElementNS(xmlns, "g");
			highlightednodescontainer.setAttributeNS(null, "class", options.highlightednodescontainerClass);		
			translationEl.appendChild(highlightednodescontainer);
			if(options.selectNodes) {
				addNodeEvents(highlightednodescontainer);
			}
			mfrmap.appendChild(svg);
/*
			if(options.useMarkers) {
				markercontainer = document.createElementNS(xmlns, "div");
				markercontainer.setAttributeNS(null, "class", options.markercontainerClass);

				markercontainer.setAttributeNS(null, "width", "5in");
				markercontainer.setAttributeNS(null, "height", "3in");
	
				markercontainer.setAttributeNS(null, "position", "absolute");
				markercontainer.setAttributeNS(null, "x", "0");
				markercontainer.setAttributeNS(null, "y", "0");

				markercontainer.style.overflow = "visible";


				var marker = document.createElementNS(xmlns, "span");
				marker.setAttributeNS(null, "class", options.markerClass);
marker.style.position = "absolute";
marker.style.left = "1in;"
marker.style.top = "1in;"
                                marker.innerHTML = "Mr. Prof. Drs. PhD Sir."
				markercontainer.appendChild(marker);
 
				mfrmap.appendChild(markercontainer);
			}
*/
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
			var size;

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
				return ( 18.0 / scale );
			}
			return 1;
		}

		function calcCurrentNodeScale() {
			return startNodeScale;
		}

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

			var offSets = nodeOffSets || {
				x: 1,
				y: -1
			};
			offSets.xc = 0;
			offSets.yc = 0;

			var	range = nodeRange(node),
				nodeScaleFactor = zoomStepsNodeScales[currentScaleStep],
				nodeRadius = calcNodeRadius(range) * nodeRadiusScale * calcCurrentNodeScale() * nodeScaleFactor;

			// recreate text
			while (textfield.firstChild) {
				textfield.removeChild(textfield.firstChild);
			}
			// to get text dimensions
			var tN = document.createTextNode(node.name);
			textfield.appendChild(tN);

			var ttDims, fontSize;

			ttDims = {
				width: 0,
				height: 0
			};
			if(typeof fontAttrs == 'object') {
				// calculate new size from old and new
				fontSize = fontAttrs.newSize;
				ttDims.width = (fontAttrs.oldWidth / fontAttrs.oldSize) * fontAttrs.newSize;
				ttDims.height = (fontAttrs.oldHeight / fontAttrs.oldSize) * fontAttrs.newSize;
			} else {
				// first time, get the bounding box
				fontSize = fontAttrs;
				// can cause errors in firefox if not yet appended to DOM
				// since we need it to be not visible just use exception for now
				try {
					ttDims = textfield.getBBox();
				} catch(e) { };
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

				// optionally let caller manipulate node name
				if(options.setNodeName) node.name = options.setNodeName(node);

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
			line.setAttributeNS(null, "class", options.edgeClass);

			return line;
		}

		function makeLineElementStraight(x1, y1, x2, y2) {

			var line = document.createElementNS (xmlns, "line");
			 
			line.setAttributeNS(null, "x1", ""+x1);
			line.setAttributeNS(null, "y1", ""+y1);
			line.setAttributeNS(null, "x2", ""+x2);
			line.setAttributeNS(null, "y2", ""+y2);
			line.setAttributeNS(null, "class", options.edgeClass);

			return line;
		}

		function nodeSizeRange(nodesize) {
			var minsize = mapinfo["minsize"];
			var maxsize = mapinfo["maxsize"];

			var range = 0.5;
			if (Math.abs(maxsize - minsize) > 0.00001) {
				range = (nodesize - minsize) / (maxsize - minsize);
			}
			range = Math.pow(range, options.nodeRadiusScalePower);

			return range;
		}

		function nodeRange(node) {
			if(!node || !node.size) return 0;
			return nodeSizeRange(node.size);
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
							line = makeLineElement(x1, y1, x2, y2);

						if((!node2.name || node2.name == settings.NULLnodeName) && settings.hideNULLnameNodes) drawEdge = false;

						if(drawEdge) {
							line.id = this.quadid + "-edge-" + this.i;
							line.style.stroke = "" + edgeColor(node1, node2);
							line.setAttributeNS(null, "stroke-width", "1em");
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

		function MakeNodeElementUsingCircle(quadid, node, mode, showNameOnHover) {

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

			var circle = document.createElementNS(xmlns, circleTag);

			if(node.name && (node.name != settings.NULLnodeName || !settings.hideNULLnameNodes)) {

				// base props
				circle.setAttributeNS(null, "class", options.nodeClass);
				circle.setAttributeNS(null, "id", id);
				circle.setAttributeNS(null, "data-quadid", quadid);
				circle.setAttributeNS(null, "data-name", node.name);
				circle.setAttributeNS(null, "data-nodeid", "" + node.nodeid);
				circle.setAttributeNS(null, "data-nodevalue", "" + node.size);
				circle.setAttributeNS(null, "show-name-on-hover", textId);

				// dimensions
				circle.setAttributeNS(null, "cx", "" + x);
				circle.setAttributeNS(null, "cy", "" + y);
				circle.setAttributeNS(null, "r", "" + nodeRadius + "em");
				circle.setAttributeNS(null, "stroke", "" + nodeEdgeColor(node));
				circle.setAttributeNS(null, "stroke-width", "" + nEdgeWid);
				circle.setAttributeNS(null, "fill", color);
			}

			return circle;
		}

		function MakeNodeElementUsingLine(quadid, node, mode, showNameOnHover) {

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

			var circle = document.createElementNS(xmlns, circleTag);

			if(node.name && (node.name != settings.NULLnodeName || !settings.hideNULLnameNodes)) {

				// base props
				circle.setAttributeNS(null, "class", options.nodeClass);
				circle.setAttributeNS(null, "id", id);
				circle.setAttributeNS(null, "data-quadid", quadid);
				circle.setAttributeNS(null, "data-name", node.name);
				circle.setAttributeNS(null, "data-nodeid", "" + node.nodeid);
				circle.setAttributeNS(null, "data-nodevalue", "" + node.size);
				circle.setAttributeNS(null, "show-name-on-hover", textId);

				// dimensions
				circle.setAttributeNS(null, "x1", "" + x);
				circle.setAttributeNS(null, "y1", "" + y);
				circle.setAttributeNS(null, "x2", "" + x);
				circle.setAttributeNS(null, "y2", "" + y);
				circle.setAttributeNS(null, "stroke-linecap", "round");
				// note we set the radius using the stroke-width and the fill using the stroke..
				circle.setAttributeNS(null, "stroke-width", "" + (nodeRadius * 2) + "em");
				circle.setAttributeNS(null, "stroke", color);

				if(nEdgeWid > 0) {
					// beause we use stroke-width already we need a second circle as the stroke ..
					var circle1 = circle.cloneNode(false),
						circle2 = circle.cloneNode(false);

					circle2.setAttributeNS(null, "stroke-width", "" + ((nodeRadius + nEdgeWid) * 2) + "em");
					circle2.setAttributeNS(null, "stroke", nodeEdgeColor(node));

					circle = document.createElementNS(xmlns, 'g');
					circle.setAttributeNS(null, "class", circleTag);
					circle.setAttributeNS(null, "id", id);
					circle.setAttributeNS(null, "data-quadid", quadid);
					circle.setAttributeNS(null, "data-name", node.name);
					circle.setAttributeNS(null, "data-nodeid", "" + node.nodeid);
					circle.setAttributeNS(null, "data-nodevalue", "" + node.size);
					circle.setAttributeNS(null, "show-name-on-hover", textId);
					circle.appendChild(circle2);
					circle.appendChild(circle1);
				} 
			}

			return circle;
		}

		// because firefox does not always repaint circle css correctly we use a line 'hack'
		var useCircleEl = false,
			circleTag = useCircleEl ? "circle" : "line",
			MakeNodeElement = useCircleEl ? MakeNodeElementUsingCircle : MakeNodeElementUsingLine;

		function addNodeEvents(container) {
			container.addEventListener('mousedown', function (e) {
				var node = e.target;

				if(node) {
					e.cancelBubble = true;

					var name = node.getAttribute('data-name');

					if(name && (name != settings.NULLnodeName || settings.enableNULLnameNodes)) {
						var nodeId = node.getAttribute('data-nodeid'),
							quadId = node.getAttribute('data-quadid');
						addMarker(quadId, nodeId, name);
						currentnodeid = nodeId;
						showInfoAbout(quadId, nodeId);
						options.onNodeClick && options.onNodeClick(quadId, nodeId, currentScaleStep);
					}
				}
			});
			container.addEventListener('mouseup', function (e) {
				var node = e.target;

				if(node) e.cancelBubble = true;
			});

			var hoverAction = false;

			container.addEventListener('mouseover', function (e) {

				e.cancelBubble = true;
				var node = e.target;

				if(node) {
					if(node.tagName == circleTag || (node.tagName == 'g' && node.getAttributeNS(null, "class") == circleTag)) {

						var quadId = node.getAttribute('data-quadid'),
							nodeId = node.getAttribute('data-nodeid');

						hoverAction && clearTimeout(hoverAction);
						hoverAction = setTimeout(function() {
							hoverIn(quadId, nodeId);
							hoverAction = false;
						}, options.hoverDelay);
					}
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
						var quadId = node.getAttribute('data-quadid'),
							nodeId = node.getAttribute('data-nodeid');

						showInfoAbout(quadId, nodeId);
						evt.preventDefault();
						evt.cancelBubble = true;
						options.onNodeClick && options.onNodeClick(quadId, nodeId, currentScaleStep);
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

			graph.els = graph.els || { glin: null, gnod: null };

/*
			var xmin = mapinfo["quadtree"]["xmin"],
				xmax = mapinfo["quadtree"]["xmax"],
				ymin = mapinfo["quadtree"]["ymin"],
				ymax = mapinfo["quadtree"]["ymax"],
*/

			var glin;

			if(graph.els.glin == null) {
				// lines container for quad
				glin = document.createElementNS(xmlns, "g");
				graph.els.glin = glin;

				// EDGES
				glin.setAttributeNS(null, "class", options.quadClass);
				glin.setAttributeNS(null, "id", quadid);

				scheduler.addTask(new AsyncEdges(quadid, glin));

			} else {

				glin = graph.els.glin;
				setTimeout(function() {
					linescontainer.appendChild(glin);
				}, 10);
			}


			quadsDrawn[quadid] = {
				lines: glin
			};

			// NODES
			// nodes container for quad
			var gnod;

			if(graph.els.gnod == null) {
				gnod = document.createElementNS(xmlns, "g");
				graph.els.gnod = gnod;
				gnod.setAttributeNS(null, "class", options.quadClass);
				gnod.setAttributeNS(null, "id", quadid);

				for (var i = 0; i < graph["nodes"].length; i++) {
					var circle = MakeNodeElement(quadid, graph["nodes"][i], nodemodeGraph);
					gnod.appendChild(circle);
				}

				if(options.selectNodes) {
					addNodeEvents(gnod);
				}
			} else {
				gnod = graph.els.gnod;
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

			quadsDrawn[quadid].nodes = gnod;

			// DEBUG
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
		}

		function execSvgScales(finished) {

			// scale scaling layer
			scalingEl.setAttribute('transform', 'scale(' + currentScale + ')');			

			// scale texts
			scaleTextRects();
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
				var onZoomFn = (prevScaleStep > level) ? 'onZoomIn' : 'onZoomOut';

				currentScaleStep = level;
				currentScale = zoomSteps[level];

				// scaling step by class dyn css
				mfrmap.className = options.mapClass + ' shingle-unselectable' + ' i' + instance + '-zoom-level-' + level;

				zoom.value = level;
				updateBitmapOpacity();
				onZoomFn && options[onZoomFn] && options[onZoomFn](level);
				setSvgScales(done);

			}, 20);
		}

		var prevScaleStep;

		function doZoom(step) {

			// notice the zoom function works in reverse in shingle ..
			prevScaleStep = currentScaleStep;
			currentScaleStep += step;
			if(currentScaleStep < 0) {
				currentScaleStep = 0;
			}
			if(currentScaleStep > zoomSteps.length - 1) {
				currentScaleStep = zoomSteps.length - 1;
			}
			if(prevScaleStep != currentScaleStep) {
				scaleTo(currentScaleStep, function() {
					findQuadsToRemove();
					findQuadsToDraw();
				});
			}
		}

		function zoomIn() {
			doZoom(-1 * sliderZoomStep);
		}

		function zoomOut() {
			doZoom(sliderZoomStep);
		}

		function zoomReset() {
			options.onZoomReset && options.onZoomReset();
			currentScaleStep = startScaleStep;
			scaleTo(currentScaleStep, function() {
				findQuadsToRemove();
				findQuadsToDraw();
			});
		}

		function HighlightedNode() {
			this.currentHighlightedId = null;
			this.currentHighlightedIdHighlighted = null;

			this.ishighlighted = function() {
				return (this.currentHighlightedId != null);
			}

			this.unhighlight = function () {

				if (this.currentHighlightedId != null) {

					// unhighight the node
					var	circle = document.getElementById(this.currentHighlightedId);
					if (circle) {
						circle.classList.remove(options.highlightedNodeClass);
					}

					// unhighight the highlighted node (highlighted nodes layer)
					circle = document.getElementById(this.currentHighlightedIdHighlighted);					
					if (circle) {
						circle.classList.remove(options.highlightedNodeClass);
					}
				}
			};

			this.sethighlighted = function (quadid, nodeid) {
				this.currentHighlightedId = getNodeId(quadid, nodeid, false);
				this.currentHighlightedIdHighlighted = getNodeId(quadid, nodeid, true);
			};

			this.highlight = function () {

				var	circle = document.getElementById(this.currentHighlightedId);

				// highight the node
				if (circle) {
					circle.classList.add(options.highlightedNodeClass);
				}

				// highight the highlighted node (highlighted nodes layer)
				circle = document.getElementById(this.currentHighlightedIdHighlighted);
				if (circle) {
					var textid = circle.getAttributeNS(null, 'show-name-on-hover');
					if(textid && textid != "false") {
						document.getElementById(textid).style.display = "initial";
					}
					circle.classList.add(options.highlightedNodeClass);
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
			this.cancelFlag = false;

			this.cancel = function() {
				self.cancelFlag = true;
			};

			this.cancelled = function() {
				return self.cancelFlag;
			};

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

						// clear and show main node name, only at first cycle !
						if(this.j < 100) {

							var circle = MakeNodeElement(this.quadid, node1, nodemodeCentered);
							highlightednodescontainer.appendChild(circle);

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
					line = makeLineElement(x1, y1, x2, y2);

				line.style.stroke = "" + edgeHighlightColor(node1, node2);
				line.setAttributeNS(null, "stroke-width", "1em");
				highlightedlinescontainer.appendChild(line);

				if (highlightednodescontainer != null && node2 != null) {

					// related nodes
					var showNameOnHover = (options.showRelatedNodeNames == 'hover'),
						circle = MakeNodeElement(quadid, node2, nodemodeHighlighted, showNameOnHover);

					highlightednodescontainer.appendChild(circle);

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
					if(!quadsWithHighlightedNodes[toNode.quad]) {
						quadsWithHighlightedNodes[toNode.quad] = 1;
					}

					var quadWatcher = setInterval(function() {
						if(self.cancelled()) {
							clearInterval(quadWatcher);
						} else {
							graphB = graphs[toNode.quad];
							if (graphB) {
								clearInterval(quadWatcher);
								drawEdge();
							} else {
								if(++tries > 99) clearInterval(quadWatcher);
							}
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

					var drawRelatedEdges = function(quadid) {

						var url = options.graphPath + 'findRelations' +
								'?quadid=' + quadid +
								'&nodeid=' + self.nodeFrom.node.nodeid;

						ajaxGet(url, function(response) {
							if(response) {
								var relations = JSON.parse(response);

								if(relations && relations.toNodes && relations.toNodes.length) {
									for (var i = 0; i < relations.toNodes.length; i++) {
										if(self.cancelled()) break;
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
				last_async_showmfrinfo.cancel();
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

			if(currentHighlightedNode.ishighlighted()) {
				textRects = [];

				svg.classList.remove('with-focus');

				currentHighlightedNode.unhighlight();
				forgetHighlightedNodesLoaded();

				// remove highlighted lines
				while (highlightedlinescontainer.firstChild) {
					highlightedlinescontainer.removeChild(highlightedlinescontainer.firstChild);
				}
				// remove highlighted nodes
				while (highlightednodescontainer.firstChild) {
					highlightednodescontainer.removeChild(highlightednodescontainer.firstChild);
				}

				triggerClear();
			}
		}

		function showInfoAbout(quadid, nodeid) {
			removeInfoAbout();
			svg.classList.add('with-focus')

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


		function addMarker(quadid, nodeid, name) {
			if(options.useMarkers) {
				var marker = document.createElement("span");
				marker.setAttribute("class", options.markerClass+" markertype-visited");
				marker.style.position = "absolute";
				marker.style.left = "1in";
				marker.style.top = "1in";
                                marker.innerHTML = "<span class='markername'>"+name+"</a>";

				marker.addEventListener('click', function () {
					changehighlightTo(quadid, nodeid);
				});

				
				markercontainer.appendChild(marker);
			}
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


			if(options.useMarkers) {
				markercontainer = document.createElement("div");
				markercontainer.setAttribute("class", options.markercontainerClass);

				markercontainer.setAttribute("width", "5in");
				markercontainer.setAttribute("height", "3in");
	
				markercontainer.setAttribute("position", "absolute");
				markercontainer.setAttribute("x", "0");
				markercontainer.setAttribute("y", "0");

				markercontainer.style.width = options.width;
				markercontainer.style.height = options.height;
 
				shinglecontainer.appendChild(markercontainer);
			}








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
