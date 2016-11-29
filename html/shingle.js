var shingle = shingle || (function () {

	var graph = function (settings) {

		// Begin editable parameters
		var options = settings || {},
			defaults = {
				// these are equal to the possible settings
				// commented lines represent other option values
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
				nodeClass: 'shingle-node',
				nodeTextClass: 'shingle-node-text',
				mapClass: 'shingle-map',
				nodeColors: [[240, 188, 0], [178, 57, 147], [39, 204, 122], [21, 163, 206], [235, 84, 54], [138, 103, 52], [255, 116, 116], [120, 80, 171], [48, 179, 179], [211, 47, 91]],
				defaultNodeColor: [214, 29, 79],
				edgeColor: [213, 213, 213],
				edgeHighlightColor: [0, 0, 0],
				fontColor: [5, 87, 119, 0.6],
				nodeRadiusScaleFactor: 1/50.0 ,
				nodeRadiusScalePower: 1.25 ,
				fontFamily: "sans",
				fontSize: 18,
				relatedNodesFontSize: 18,
				textGrow: true,
				textShrink: false,
				infoSyncDelay: 100,
				//lineType: "Straight",
				lineType: "EllipticalArc",
				debug: false,
				debugQuads: false
			};

		// global private vars
		var nodeInfo, makeLineElement,
			xmlns = "http://www.w3.org/2000/svg",
			mapinfo = null,
			graphs = {},
			nodeRadiusScale = 1.0 / 100.0,
			nodeEdgeRadiusScale = 1 / 500.0,
			fontScale = null,
			minScale = 0.01,
			maxScale = 0.5,
			edgeWidthScale = 1 / 60.0,
			quadsDrawn = {},
			quadLevels = false,
			shouldQuadBeVisible = quadIntersects,
			boundingrect, mfrmap, debugEl, zoom,
			highlightedlinescontainer, highlightednodescontainer, highlightednamescontainer,
			linescontainer, nodescontainer,
			scalingEl, translationEl,
			lastX = 0, lastY = 0,
			startTranslateX = 0, startTranslateY = 0,
			dragging = false,
			svgCreated = false,
			sfactor = 48,
			KSymTableSize = 211,
			scheduler, highlightScheduler,
			nodemodeflagHighlighted = 1, nodemodeflagCentered = 2, nodemodeGraph = 0,
			nodemodeHighlighted = nodemodeflagHighlighted,
			nodemodeCentered = nodemodeflagHighlighted + nodemodeflagCentered,
			currentScale = 0.1, startScale, currentTranslateX = 0, currentTranslateY = 0,
			currentnodeid = null, currentHighlightedNode,
			last_async_showmfrinfo = null,
			infoDisplayAction = false,
			drawQ = {},
			firstQuadDrawn = false,
			zoomLevel = false,
			quadsWithHighlightedNodes = {},
			svg = document.createElementNS(xmlns, "svg");

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

		function rgbA(colorTuple) {
			var r = colorTuple[0];
			var g = colorTuple[1];
			var b = colorTuple[2];
			var a = colorTuple[3] || 1;
			return "rgba(" + r + "," + g + "," + b + "," + a + ")";
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
					this.timer = setTimeout(this.stepaftertimeout, 10);
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
			var datarectPixels = boundingrect.getBoundingClientRect(),
				containerRectPixels = mfrmap.getBoundingClientRect();

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
			if ((root["xmax"]-root["xmin"]) < 0.25*(screenrect[2]-screenrect[0])) {
				return false;
			}


			if ((root["ymax"]-root["ymin"]) < 0.25*(screenrect[3]-screenrect[1])) {
				return false;
			}

			// Else, draw.
			return true;
		}

		function findQuadsNodeJs(screenrect) {

			//var url = 'http://localhost:8081/shinglejs-local/data/auth25_01_tiled/datasets/elsevier-data/findQuads' +
			var url = options.graphPath + 'findQuads' +
					'?xmin=' + screenrect[0] +
					'&ymin=' + screenrect[1] +
					'&xmax=' + screenrect[2] +
					'&ymax=' + screenrect[3];

			ajaxGet(url, function(response) {
				if(response) {
					var quads = JSON.parse(response);
					if(quads.length) {
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

		function findQuadsToDrawRecursive(screenrect, root, quadid) {

			if (quadLevels) {
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
			else {
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
		}

		function findQuadsToRemove() {
			var i;
			var screenrect = containerWorldRect(),
				elements = svg.getElementsByClassName('quadcontainer');

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
					}
					if (visible == false) {
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

			currentScale = 1 / (minScale + (maxScale - minScale) * (options.initialZoom / 100.0));
			startScale = currentScale;

			createBaseSvgDOM();

			findQuadsToDraw();
		}

		function loadMapInfo(nodeid) {

			ajaxGet(options.graphPath + "mapinfo.json", function(response) {

				mapinfo = JSON.parse(response);
				
				if (mapinfo["data-format-version"] == null) {
					mapinfo["data-format-version"] = 0;
				}
				if (mapinfo["data-format-version"] > 0) {
					quadLevels = true;
					shouldQuadBeVisible = quadIntersectsAndQuadBigEnough;
				}
				
				if(nodeid) {
					findPosition(nodeid)
				} else {
					renderMap();
				}
			});
		}

		function loadQuad(quadid) {
			if (graphs[quadid] != null) {
				if (!drawnQuad(quadid)) {
					scheduler.addTask(new ScheduledAppendQuad(quadid));
				}
				return;
			}

			var json_url = options.graphPath + quadid + ".json";

			if (quadsWithHighlightedNodes.hasOwnProperty(quadid)) {
				json_url = options.graphPath + "e" + quadid + ".json";
			}

			ajaxGet(json_url, function(response) {
				
				var graph = JSON.parse(response);

				if (graphs[quadid] == null) {
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
				var json_url = options.graphPath + "e" + quadid + ".json";
				ajaxGet(json_url, function(response) {

					var graph = JSON.parse(response);

					if (loadReferenced) {
						keepHighlightedNodesLoaded(graph);
					}

					if (graphs[quadid] != null) {

						if (graphs[quadid]["header"]["compact"] == true) {
							var i;
							var elements = svg.getElementsByClassName('quadcontainer');
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
			var extendedQuadsToLoad = {};
			var nredges = graph["relations"].length;
			var k;
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

		function forgetHighlightedNodesLoaded() {
			quadsWithHighlightedNodes = {};
		}

		function debugLog(str) {
			if (options.debug) {
				debugEl.innerHTML = str;
			}
		}

		function handleMouseDown(evt) {

			lastX = (evt.pageX - mfrmap.offsetLeft);
			lastY = (evt.pageY - mfrmap.offsetTop);
			startTranslateX = currentTranslateX;
			startTranslateY = currentTranslateY;

			var rect = boundingrect.getBoundingClientRect();

			sfactor = (rect.right - rect.left) / ((1.0 * mapinfo["quadtree"]["xmax"]) - mapinfo["quadtree"]["xmin"]);

			dragging = true;
		}

		function handleMouseMove(evt) {
			if (dragging) {
				var newX = (evt.pageX - mfrmap.offsetLeft),
					newY = (evt.pageY - mfrmap.offsetTop);

				currentTranslateX = startTranslateX + (newX - lastX) / sfactor;
				currentTranslateY = startTranslateY + (newY - lastY) / sfactor;

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
			dragging = false;
			findQuadsToDraw();
			findQuadsToRemove();

			if (highlightednamescontainer != null) {
				highlightednamescontainer.style.display = "inherit";
			}

			var newX = (evt.pageX - mfrmap.offsetLeft),
				newY = (evt.pageY - mfrmap.offsetTop);
			if (Math.abs(newX - lastX) < 10 && Math.abs(newY - lastY) < 10) {
				removeInfoAbout();

				if(options.containerWithFocusClass) {
					options.el.classList.remove(options.containerWithFocusClass);
				}
				options.onBlur && options.onBlur();
				syncInfoDisplay(false);
			}
		}

		function attachMouseEvents() {

			var	inScroll = false;

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

					mfrmap.addEventListener('mouseleave', function (evt) {
						dragging = false;
						findQuadsToDraw();
						findQuadsToRemove();
					}, false);

					var handleScroll = function (evt) {
						if (inScroll)
							return;

						var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;

						if (delta) {
							if (delta > 0) {
								currentScale *= 1.1;
							} else if (delta < 0) {
								currentScale /= 1.1;
							}

							var mins = 1 / (minScale),
								maxs = 1 / (maxScale);

							if (currentScale < maxs){
								currentScale = maxs;
							}
							if (currentScale > mins) {
								currentScale = mins;
							}

							zoom.value = 100.0 * ((1 / currentScale) - minScale) / (maxScale - minScale);

							setSvgScales();
							findQuadsToDraw();
							findQuadsToRemove();
						}
						return evt.preventDefault() && false;
					};

					function detectScrollAttrs(e) {

						if (e.target.tagName !== 'svg') {
							inScroll = setTimeout(function () {
								clearInterval(inScroll);
								inScroll = false;
							}, options.scrollZoomInitDelay);
						}
					};
				}

				if (options.scrollZoom) {
					var wheelEvent = "onwheel" in mfrmap ? "wheel" : document.onmousewheel !== undefined ? "mousewheel" : "DOMMouseScroll";
					document.addEventListener(wheelEvent, detectScrollAttrs, false);
					mfrmap.addEventListener(wheelEvent, handleScroll, false);
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

			svg.setAttributeNS(null, "width", options.width);
			svg.setAttributeNS(null, "height", options.height);

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

			if(options.translateOffsetX) currentTranslateX += options.translateOffsetX / sfactor / 2;
			if(options.translateOffsetY) currentTranslateY += options.translateOffsetY / sfactor / 2;

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

			// all lines
			linescontainer = document.createElementNS(xmlns, "g");
			translationEl.appendChild(linescontainer);

			// lines of the highlighted node to the related nodes
			highlightedlinescontainer = document.createElementNS(xmlns, "g");
			translationEl.appendChild(highlightedlinescontainer);

			// all nodes
			nodescontainer = document.createElementNS(xmlns, "g");
			translationEl.appendChild(nodescontainer);

			// highlighted nodes and related nodes
			highlightednodescontainer = document.createElementNS(xmlns, "g");
			translationEl.appendChild(highlightednodescontainer);

			// names of the highlighted nodes
			highlightednamescontainer = document.createElementNS(xmlns, "g");
			translationEl.appendChild(highlightednamescontainer);

			mfrmap.className = options.mapClass;

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

		function calcCurrentFontScale() {

			//
			// calculate fontsize of text element to display as specified fontSize in px on screen
			if(!fontScale) {

				var	ymin = mapinfo["quadtree"]["ymin"],
					ymax = mapinfo["quadtree"]["ymax"],
					rect = mfrmap.getBoundingClientRect(),
					graphHeight = ymax - ymin,
					svgHeight = rect.bottom - rect.top,
					svgHeightFactor = svgHeight / graphHeight;

				fontScale = (options.fontSize / ( startScale * svgHeightFactor ));
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



		function calcCurrentNodeScale() {

			if (quadLevels) {

/*
				var	ymin = mapinfo["quadtree"]["ymin"],
					ymax = mapinfo["quadtree"]["ymax"],
					rect = mfrmap.getBoundingClientRect(),
					graphHeight = ymax - ymin,
					svgHeight = rect.bottom - rect.top,
					svgHeightFactor = svgHeight / graphHeight;

				return (1.0 / ( startScale * svgHeightFactor ));
*/



				return ( 18.0 / (currentScale) );

			}

			return 1;
		}









		function showNodeName(quadid, node, elemid, onHoverOnly, hoverEl) {

			var textfield = document.getElementById(elemid);

			// ensure unique elemid quick 'fix'
			elemid += node.nodeid;

			if (textfield == null) {
				// text size
				var size = calcCurrentFontScale(),
					relatedFactor = options.relatedNodesFontSize / options.fontSize;

				if(typeof onHoverOnly != "undefined") size *= relatedFactor;

				if (highlightednamescontainer == null) {
					return;
				}

				textfield = document.createElementNS(xmlns, "text");
				textfield.setAttributeNS(null, "class", options.nodeTextClass);
				textfield.setAttributeNS(null, "id", elemid);
				textfield.setAttributeNS(null, "fill", rgbA(options.fontColor));
				textfield.setAttributeNS(null, "font-family", options.fontFamily);
				textfield.setAttributeNS(null, "font-size", size);
				textfield.setAttributeNS(null, "data-nodeid", "");

				// only on hover
				if(onHoverOnly && hoverEl) {
					textfield.style.display = 'none';
					hoverEl.addEventListener('mouseenter', function() {
						textfield.style.display = '';
					});
					hoverEl.addEventListener('mouseleave', function() {
						textfield.style.display = 'none';
					});
				}

				highlightednamescontainer.appendChild(textfield);
			}

			if (textfield.getAttribute('data-nodeid') == node.nodeid) {
				return;
			}


			var x = node.x,
				y = node.y,
				nodename = node.name,
				range = nodeRange(node),
				nodeRadius = calcNodeRadius(range) * nodeRadiusScale * calcCurrentNodeScale();

			textfield.setAttributeNS(null, "data-nodeid", node.nodeid);
			textfield.setAttributeNS(null, "x", (x + 2 * nodeRadius));
			textfield.setAttributeNS(null, "y", y);

			while (textfield.firstChild) {
				textfield.removeChild(textfield.firstChild);
			}

			var t = document.createTextNode(nodename);
			textfield.appendChild(t);
		}

		function ScheduledAppendQuad(quadid) {
			this.quadid = quadid;
			drawQ[quadid] = true;

			this.call = function () {

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
			var nodesize = node.size;

			var range = 0.5;
			if (Math.abs(maxsize - minsize) > 0.00001) {
				range = (nodesize - minsize) / (maxsize - minsize);
			}
			range = Math.pow(range, options.nodeRadiusScalePower);

			return range;
		}

		function AsyncEdges(quadid) {
			this.quadid = quadid;
			this.i = 0;
			this.call = function ()
			{

				var graph = graphs[this.quadid];
				if (graph == null) {
					return true;
				}
				var nredges = graph["relations"].length;


//				if (nredges > 100) nredges = 100;

				var glin = document.getElementById(this.quadid);
				if (glin == null) {
					return true;
				}

				var j;
				for (j = 0; j < nredges; j++) {
					if (this.i >= nredges) {
						return true;
					}

					var graphA = graphs[graph["relations"][this.i].quadA],
						graphB = graphs[graph["relations"][this.i].quadB];
					
					if (graphA == null || graphB == null) {

						this.i = this.i + 1;
						continue;
					}

					var pos = graphA["idmap"][graph["relations"][this.i].nodeidA],
						node1 = graphA["nodes"][pos],
						x1 = graphA["nodes"][pos].x,
						y1 = graphA["nodes"][pos].y;

					pos = graphB["idmap"][graph["relations"][this.i].nodeidB];

					var node2 = graphB["nodes"][pos],
						x2 = graphB["nodes"][pos].x,
						y2 = graphB["nodes"][pos].y,
						edgeOpacity = 0.5,
						line = makeLineElement(x1, y1, x2, y2);

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

					this.i = this.i + 1;
				}

				return (this.i >= nredges);
			};

			return this;
		}

		function MakeNodeElement(quadid, node, mode) {

			var highlighted = ((mode & nodemodeflagHighlighted) != 0);
			var centered = ((mode & nodemodeflagCentered) != 0);

			var x = node.x;
			var y = node.y;

			var range = nodeRange(node);

			var nodeRadius = calcNodeRadius(range) * nodeRadiusScale * calcCurrentNodeScale();
			var nEdgeWid = 0;
			var opacity;

			var id;
			if (highlighted) {
				nodeRadius *= 1.5;
				id = quadid + "-node-" + node.nodeid + "highlighted";
				opacity = 1;
			} else {
				id = quadid + "-node-" + node.nodeid;
				opacity = 0.6;
			}
			var color;

			if (centered) {
				color = rgbA([255, 255, 255]); // pure white
				nEdgeWid = 5 * nodeEdgeWidth(range) * nodeEdgeRadiusScale;
			} else {
				color = nodeColor(node, opacity);
			}

			var circle = document.createElementNS(xmlns, "circle");
			circle.setAttributeNS(null, "class", options.nodeClass);
			circle.setAttributeNS(null, "id", id);
			circle.setAttributeNS(null, "data-quadid", "" + quadid);
			circle.setAttributeNS(null, "data-name", "" + node.name);
			circle.setAttributeNS(null, "data-nodeid", "" + node.nodeid);
			circle.setAttributeNS(null, "cx", "" + x);
			circle.setAttributeNS(null, "cy", "" + y);
			circle.setAttributeNS(null, "r", "" + nodeRadius);
			circle.setAttributeNS(null, "stroke", "" + nodeEdgeColor(node));
			circle.setAttributeNS(null, "stroke-width", "" + nEdgeWid);
			circle.setAttributeNS(null, "fill", "" + color);

			if(options.selectNodes) {
				circle.addEventListener('mouseenter', function (e) {
					e.cancelBubble = true;
					hoverIn(this.getAttribute('data-quadid'), this.getAttribute('data-nodeid'));
				});


				circle.addEventListener('mouseleave', function (e) {
					hoverOut();
				});

				circle.addEventListener('mousedown', function (e) {
					e.cancelBubble = true;
					currentnodeid = this.getAttribute('data-nodeid');
					showInfoAbout(this.getAttribute('data-quadid'), this.getAttribute('data-nodeid'));
				});

				circle.addEventListener('mouseup', function (e) {
					//        e.cancelBubble=true;
				});

				circle.addEventListener('touchstart', function (evt) {
					var e = evt.changedTouches[0];
					showInfoAbout(this.getAttribute('data-quadid'), this.getAttribute('data-nodeid'));
					evt.preventDefault();
					evt.cancelBubble = true;
				});

				circle.addEventListener('touchmove', function (evt) {
					var e = evt.changedTouches[0];
					evt.preventDefault();
					evt.cancelBubble = true;
				});

				circle.addEventListener('touchend', function (evt) {
					var e = evt.changedTouches[0];
					evt.preventDefault();
					evt.cancelBubble = true;
				});
			}
			return circle;
		}

		function appendSvgDOM(quadid) {

			if (drawnQuad(quadid)) {
				return;
			}

			var graph = graphs[quadid];

			if (graph == null) {
				return;
			}

			var i;

			var xmin = mapinfo["quadtree"]["xmin"],
				xmax = mapinfo["quadtree"]["xmax"],
				ymin = mapinfo["quadtree"]["ymin"],
				ymax = mapinfo["quadtree"]["ymax"],
				glin = document.createElementNS(xmlns, "g");

			linescontainer.appendChild(glin);

			glin.setAttributeNS(null, "class", "quadcontainer");
			glin.setAttributeNS(null, "id", quadid);

			if (options.debugQuads) {
				var rect = document.createElementNS(xmlns, "rect");
				rect.setAttributeNS(null, "x", "" + graph["header"]["xmin"]);
				rect.setAttributeNS(null, "y", "" + graph["header"]["ymin"]);

				rect.setAttributeNS(null, "width", "" + (graph["header"]["xmax"] - graph["header"]["xmin"]));
				rect.setAttributeNS(null, "height", "" + (graph["header"]["ymax"] - graph["header"]["ymin"]));


				rect.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
				rect.setAttributeNS(null, "stroke-width", "1px");

				rect.style.fill = "none";
				rect.style.stroke = "black";
//rect.style.strokeWidth = 2*edgeWidthScale;
				rect.style.fillOpacity = "0";
				rect.style.strokeOpacity = "1";
				glin.appendChild(rect);
			}

			scheduler.addTask(new AsyncEdges(quadid));

			var gnod = document.createElementNS(xmlns, "g");
			nodescontainer.appendChild(gnod);

			quadsDrawn[quadid] = true;

			gnod.setAttributeNS(null, "class", "quadcontainer");
			gnod.setAttributeNS(null, "id", quadid);

			for (i = 0; i < graph["nodes"].length; i++) {
				var node = graph["nodes"][i];
				var circle = MakeNodeElement(quadid, node, nodemodeGraph);
				gnod.appendChild(circle);
			}

			if (highlightednodescontainer != null) {

				if (highlightednodescontainer.firstChild == null) {

					var lookup = graph["idmap"][currentnodeid];
					if (lookup) {
						showInfoAbout(quadid, currentnodeid);
					}
				}
			}
		}

		function setSvgScales() {

			// scale scaling layer
			scalingEl.setAttribute('transform', 'scale(' + currentScale + ')');			

			// scale texts (currently only one)
			var size = calcCurrentFontScale(),
				nodeTextEls = svg.getElementsByClassName(options.nodeTextClass);

			len = nodeTextEls.length;
			for (i = 0; i < len; i++) {
				var element = nodeTextEls[i];
				element.setAttributeNS(null, "font-size", size);
			}
			
			if (quadLevels) {
				var nsize = calcCurrentNodeScale(),
					nodeEls = 	svg.getElementsByClassName(options.nodeClass);

				len = nodeEls.length;
				for (i = 0; i < len; i++) {
					var element = nodeEls[i];
					var node = getNodesData(element.getAttribute('data-quadid'), element.getAttribute('data-nodeid'));

					var range = nodeRange(node);
					var nodeRadius = calcNodeRadius(range) * nodeRadiusScale * nsize;
					element.setAttributeNS(null, "r", nodeRadius);
				}
			}

			
		}

		function setSvgTranslations() {
			translationEl.setAttribute('transform', 'translate(' + currentTranslateX + ' ' + currentTranslateY + ')');
		}

		function setSvgTransforms() {
			setSvgScales();
			setSvgTranslations();
		}

		function doscale(e) {
			var value = parseInt(e.target.value);
			currentScale = 1 / (minScale + (maxScale - minScale) * (value / 100.0));
			setSvgScales();
		}

		function doscaleFinish(e) {
			var value = parseInt(e.target.value);
			currentScale = 1 / (minScale + (maxScale - minScale) * (value / 100.0));

			setSvgScales();
			findQuadsToDraw();
			findQuadsToRemove();
		}

		function zoomTo(level) {
			zoomLevel = level;
			currentScale = 1 / (minScale + (maxScale - minScale) * (zoomLevel / 100.0));
			setSvgScales();
			findQuadsToDraw();
			findQuadsToRemove();
		}

		function doZoom(step) {
			// notice the zoom function works in reverse in shingle ..
			if(zoomLevel === false) zoomLevel = options.initialZoom;
			if((step > 0 && zoomLevel < 100) || (step < 0 && zoomLevel > 0)) {
				zoomTo(zoomLevel + step);
			}
		}

		function zoomIn() {
			doZoom(-1 * options.zoomStep);
		}

		function zoomOut() {
			doZoom(options.zoomStep);
		}

		function zoomReset() {
			zoomTo(options.initialZoom);
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
						circle = document.getElementById(this.currentHighlightedId);

					if (circle) {
						circle.setAttributeNS(null, "stroke-width", "0");
					}

					circle = document.getElementById(this.currentHighlightedIdHighlighted);
					
					if (circle) {
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

				this.currentHighlightedId = this.currentHighlightedQuadId + "-node-" + graph["nodes"][this.currentHighlightedIndex].nodeid;
				this.currentHighlightedIdHighlighted = this.currentHighlightedId + "highlighted";
			};

			this.highlight = function () {
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
						circle = document.getElementById(this.currentHighlightedId);

					if (circle) {
						circle.setAttributeNS(null, "stroke-width", "" + 5 * nEdgeWid);
					}

					circle = document.getElementById(this.currentHighlightedIdHighlighted);
					if (circle) {
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
				data = graph["nodes"][index];
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

		function async_showmfrinfo(quadid, nodeid) {

			var self = this;

			this.quadid = quadid;
			this.nodeid = nodeid;
			this.j = 0;

			this.findNodeFrom = function() {
				var result = {
					graph: null,
					node: null
				};

				if (highlightedlinescontainer == null) {
					return result;
				}

				if (highlightednodescontainer == null) {
					return result;
				}

				var graph = graphs[this.quadid];

				if (graph == null) {
					return result;
				}

				var node1 = null;
				var nodeIndex;

				nodeIndex = graph["idmap"][this.nodeid];

				node1 = graph["nodes"][nodeIndex];

				result.graph = graph;
				result.node = node1;

				// draw the selected node ?
				if (highlightednodescontainer != null && node1 != null) {
					var circle = MakeNodeElement(this.quadid, node1, nodemodeCentered, true);
					highlightednodescontainer.appendChild(circle);

					// clear and show main node name, only at first cycle !
					if(this.j < 100) {

						var circle = MakeNodeElement(this.quadid, node1, nodemodeCentered, true);
						highlightednodescontainer.appendChild(circle);
						clearNodeNames();
						showNodeName(this.quadid, node1, "centerednodetext");
					}
				}

				return result;
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
					var circle = MakeNodeElement(quadid, node2, nodemodeHighlighted);
					highlightednodescontainer.appendChild(circle);

					//
					// show the related node names ?
					// use unique name
					if(options.showRelatedNodeNames !== false) {
						showNodeName(quadid, node2, "centerednodetext", (options.showRelatedNodeNames == 'hover'), circle);
					}
				}
			};

			this.findRelationsUsingMap = function () {

				var result = this.findNodeFrom();

				if(!result.graph || !result.node || !result.node.nodeid) {
					return true;
				}

				var url = options.graphPath + 'findRelations' +
						'?quadid=' + quadid +
						'&nodeid=' + result.node.nodeid;

				ajaxGet(url, function(response) {
					if(response) {

						var relations = JSON.parse(response);

						if(relations && relations.toNodes && relations.toNodes.length) {

							var node1 = result.node;

							for (var i = 0; i < relations.toNodes.length; i++) {

								var toNode = relations.toNodes[i];

								var node2 = null,
									graphB = graphs[toNode.quad];

								if (graphB) {
									var nodeIndex = graphB["idmap"][toNode.node],
										node2 = graphB["nodes"][nodeIndex];

									options.onFocusRelatedNode && options.onFocusRelatedNode(toNode.quad, node2.nodeid, getNodesData(toNode.quad, node2.nodeid));
								}


								if (node1 != null && node2 != null) {

									// visualize edge between 2 highlighted nodes
									self.createEdge(toNode.quad, node1, node2);
								}
							};
						}
					}
				});

				// end cycles
				return true;
			};

			this.findRelations = function () {

				var result = this.findNodeFrom();

				if(!result.graph) {
					return true;
				}

				var	graph = result.graph,
					node1 = result.node;

				// highlight the related nodes / lines
				// max 100 at one scheduler cycle
				for (var i = 0; i < 100; i++) {

					var node2 = null;
					if (this.j >= graph["relations"].length) {
						return true;
					}

					var quadid2 = quadid;

					if (graph["relations"][this.j].nodeidA == nodeid) {
						quadid2 = graph["relations"][this.j].quadB;
						var graphB = graphs[quadid2];
						if (graphB) {
							var nodeIndex = graphB["idmap"][graph["relations"][this.j].nodeidB];
							node2 = graphB["nodes"][nodeIndex];
							options.onFocusRelatedNode && options.onFocusRelatedNode(quadid2, node2.nodeid, getNodesData(quadid2, node2.nodeid));
						}
					} else if (graph["relations"][this.j].nodeidB == nodeid) {
						quadid2 = graph["relations"][this.j].quadA;
						var graphA = graphs[quadid2];
						if (graphA) {
							var nodeIndex = graphA["idmap"][graph["relations"][this.j].nodeidA];
							node2 = graphA["nodes"][nodeIndex];
							options.onFocusRelatedNode && options.onFocusRelatedNode(quadid2, node2.nodeid, getNodesData(quadid2, node2.nodeid));
						}
					}

					if (node1 != null && node2 != null) {

						// visualize edge between 2 highlighted nodes
						this.createEdge(quadid2, node1, node2);
					}
					this.j = this.j + 1;
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
			options.onFocus && options.onFocus(quadid, nodeid, getNodesData(quadid, nodeid));

			syncInfoDisplay(true);

			if (quadLevels) {
				loadNonCompactQuad(quadid, true);
			}

			last_async_showmfrinfo = new async_showmfrinfo(quadid, nodeid);
			highlightScheduler.addTask(last_async_showmfrinfo);
		}

		function removeInfoAbout() {

			linescontainer.setAttributeNS(null, "opacity", "1");
			nodescontainer.setAttributeNS(null, "opacity", "1");

			currentHighlightedNode.unhighlight();
			forgetHighlightedNodesLoaded();

			while (highlightedlinescontainer.firstChild) {
				highlightedlinescontainer.removeChild(highlightedlinescontainer.firstChild);
			}

			while (highlightednodescontainer.firstChild) {
				highlightednodescontainer.removeChild(highlightednodescontainer.firstChild);
			}

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

			scheduler = new Scheduler(schedulerStep);
			highlightScheduler = new Scheduler(highlightschedulerStep)
			currentHighlightedNode = new HighlightedNode();

			mfrmap = document.createElement("div");
			mfrmap.setAttribute("class", "shingle-unselectable");
			shinglecontainer.appendChild(mfrmap);

			zoom = document.createElement("input");

			if(!options.zoomSlider) zoom.style.display= "none";

			zoom.setAttribute("type", "range");
			zoom.setAttribute("name", "zoom");
			zoom.setAttribute("value", "" + options.initialZoom);
			zoom.setAttribute("min", "0");
			zoom.setAttribute("max", "100");
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
		return new graph(settings);
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
