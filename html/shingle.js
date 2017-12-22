"use strict";

var shingle = shingle || (function () {

	var instances = 0,
		graph = function (settings, instance) {

			// Begin editable parameters
			var options = settings || {},
				defaults = {
					// these are equal to the possible settings
					// commented lines represent other option values
					renderDelay: 0,
					extraZoom: 0,
					useBitmap: false,
					showBitmapOnly: false,
					useMarkers: false,
					maxNrMarkers: 8,
					nodeHistorySize: 50,
					useHtmlOverlays: false,
					animateZoom: false,
					/*
					animateZoom: {
						duration: 2, // seconds are assumed
						timing: 'linear'
					},*/
					animatePan: false,
					/*
					animatePan: {
						duration: 0.66, // seconds are assumed
						timing: 'linear'
					},*/
					// use in cases where other elements may overlap the graph
					// e.g. markerOffsets: { top: 10, right: 10, bottom: 0, left: 10 }
					markerOffsets: null,
					initialNodeNames: false,
					showInitialNodeNames: true,
					initialNodeNameNodeMinSize: 0,
					markerCoverAreas: [],
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
					graphPars: [],
					initialZoom: 20,
					selectNodes: true,
					panning: true,
					staticMap: false,
					zoomSlider: true,
					zoomStep: 5,
					clickToBlurTimeThreshold: 100,
					scrollZoomInitDelay: 400,
					scrollZoom: true,
					// note when set to false the no node names will be displayed at all
					showNodeNames: true,
					showMainNodeNames: true,
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
					clickableClass: 'shingle-clickable',
					initialNodeTextClass: 'shingle-initial-node-text',
					visitedNodeTextClass: 'shingle-visited-node-text',
					highlightedNodeClass: 'shingle-node-highlighted',
					highlightedNodeTextClass: 'shingle-node-h-text',
					defaultNodeTextClass: 'shingle-d-node-text',
					communityClassPrefix: 'shingle-comm-',
					communityClassHiddenPostfix: '-hidden',
					hiddenCommunityCSS: {
						opacity: 0
					},
					mapClass: 'shingle-map',
					quadClass: 'shingle-quad',
					debugQuadClass: 'shingle-debug-quad',
					debugNodeClass: 'shingle-debug-node',
					nodeColors: [[240, 188, 0], [178, 57, 147], [39, 204, 122], [21, 163, 206], [235, 84, 54], [138, 103, 52], [255, 116, 116], [120, 80, 171], [48, 179, 179], [211, 47, 91]],
					defaultNodeColor: [214, 29, 79],
					edgeClass: 'shingle-edge',
					htmlOverlayClass: 'shingle-html-overlay',
					htmlOverlayNodeContainerClass: 'shingle-html-overlay-el',
					edgeColor: [213, 213, 213],
					edgeHighlightColor: [0, 0, 0],
					fontColor: [5, 87, 119, 0.6],
					quadDebugColors: [[240, 188, 0], [178, 57, 147], [39, 204, 122], [21, 163, 206], [235, 84, 54], [138, 103, 52], [255, 116, 116], [120, 80, 171], [48, 179, 179], [211, 47, 91]],
					nodeRadiusScaleFactor: 1 / 50.0,
					nodeRadiusScalePower: 1.25,
					nodesGrow: false,
					useNonScalingStrokeForNodes: false,
					fontFamily: "sans",
					fontSize: 18,
					relatedNodesFontSize: 18,
					textGrow: false,
					textShrink: false,
					infoSyncDelay: 100,
					//lineType: "Straight",
					lineType: "EllipticalArc",
					hoverDelay: 366,
					debug: false,
					debugQuads: false,
					calcBoundingRectDimsMethodExperimental: false,
					useMultipleQuadsLoader: true,
					quadDisplayThreshold: 0.25,
					edgeWidthFactor: 1,
					highlightedEdgeWidthFactor: 2
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
					value: function (searchString, position) {
						position = position || 0;
						return this.substr(position, searchString.length) === searchString;
					}
				});
			}
			if (!('classList' in Element.prototype)) {
				var ClassList = function (element) {
					this.element = element;
				}
				ClassList.prototype = {
					get: function () {
						return this.element.getAttributeNS(null, "class");
					}, set: function (name) {
						this.element.setAttributeNS(null, "class", name);
					}, add: function (addName) {
						var classStr = this.get();
						if (!classStr) classStr = addName;
						else {
							var clsArr = classStr.split(' ');
							if (clsArr.length && clsArr.indexOf(addName) == -1) {
								clsArr.push(addName);
							}
							classStr = clsArr.join(' ');
						}
						this.set(classStr);
					}, remove: function (remName) {
						var classStr = this.get();
						if (classStr) {
							var clsArr = classStr.split(' ');
							if (clsArr.length) {
								while (true) {
									var i = clsArr.indexOf(remName);
									if (i == -1) break;
									clsArr.splice(i, 1);
								}
							}
							classStr = clsArr.join(' ');
						}
						this.set(classStr);
					}
				};
				Object.defineProperty(Element.prototype, 'classList', {
					get: function () {
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
				zoomStep = 0, zoomSteps = [], zoomStepsNodeScales = [], revScaleNodesJSStep = -1, currentScaleStep = false, startScaleStep = false, sliderZoomStep,
				textRects = [], svgDims = false,
				currentRect = false,
				execScale = false,
				nodeScaleTimer = false,
				quadsCache = {},
				dragCoordinates = { x: false, y: false },
				origin = location.origin || (location.protocol + "//" + location.hostname + (location.port ? ':' + location.port : '')),
				scaleX = null, scaleY = null,
				navrect = null, navrect2 = null, setNavRect = null,
				mapLoadTries = 0, mapLoadMaxTries = 999, mapLoadWaitMsec = 200,
				doRepositionMarkers = null,
				visitedNodes = [], markerIdx = {},
				initiallyHighlightedNodes = {}, persistentNodeMarkers = [], initialQuads = true,
				revScaledNodes = [],
				scaleTimeout = 0,
				communities = {},
				pxFactor = null,
				renderStart = null,
				doRender = true;

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
						if (attrVal && attrVal.length) {
							// convert none char options
							if (defaults[defaultEntry]) {

								if (typeof (defaults[defaultEntry]) === "boolean") {
									// boolean
									if (attrVal.toLowerCase) {
										attrVal = (attrVal.toLowerCase() == "true");
									}
								} else if (!isNaN(defaults[defaultEntry])) {
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

				if (options.staticMap || options.showBitmapOnly) {
					options.selectNodes = false;
					options.panning = false;
					options.zoomSlider = false;
				}

				if (options.onBitmapChange) onBitmapChange = options.onBitmapChange;

				// extra zoom is available, but now only for WebKit browsers

				// useNonScalingStrokeForNodes can only be used when using the line hack
				if (circleTag != "line" || !svg12T) options.useNonScalingStrokeForNodes = false;

				// timeout for scaling to be used with animated
				scaleTimeout = options.animateZoom.duration ? options.animateZoom.duration * 1000 : 0;
			}

			// touch gestures support
			var touch = function (options) {

				var self = this;

				this.touchPoints = {},
					this.distance = 0,
					this.startDistance = 0,
					this.measuring = false,
					this.refDistance = 0;

				this.calcDistance = function () {
					if (Object.keys(self.touchPoints).length >= 2) {
						var p1 = self.touchPoints[Object.keys(self.touchPoints)[0]],
							p2 = self.touchPoints[Object.keys(self.touchPoints)[1]],
							xD = Math.abs(p2.x - p1.x),
							yD = Math.abs(p2.y - p1.y);
						return Math.sqrt(Math.pow(xD, 2) + Math.pow(yD, 2));
					}
					return false;
				}

				this.initEl = function () {

					var pinch = options.el;

					this.refDistance = Math.sqrt(Math.pow(pinch.clientWidth, 2) + Math.pow(pinch.clientHeight, 2)) / (options.growFactor || 4);

					pinch.addEventListener('touchstart', function (e) {
						for (var i = 0; i < e.touches.length; i++) {
							if (Object.keys(self.touchPoints).length >= 2) break;
							var touch = e.touches[i];
							if (!self.touchPoints[touch.identifier]) {
								self.touchPoints[touch.identifier] = {
									x: touch.pageX,
									y: touch.pageY
								};
							}
							if (Object.keys(self.touchPoints).length == 2) {
								self.distance = self.calcDistance();
								self.startDistance = self.distance;
								self.measuring = true;
								options.onPinchStart && options.onPinchStart(self.startDistance);
								e.preventDefault();
							} else {
								options.onTouchStart && options.onTouchStart(e);
							}
						}
					});

					pinch.addEventListener('touchmove', function (e) {
						if (self.measuring) {
							e.preventDefault();
							for (var i = 0; i < e.changedTouches.length; i++) {
								var touch = e.changedTouches[i];
								if (self.touchPoints[touch.identifier]) {
									self.touchPoints[touch.identifier] = {
										x: touch.pageX,
										y: touch.pageY
									};
								}
							}
							var newDistance = self.calcDistance(),
								delta = newDistance - self.distance;
							if (Math.abs(delta) > 1) {
								self.distance = newDistance;
								options.onPinchZoom(delta / self.refDistance, newDistance / self.startDistance);
							}
						} else {
							options.onTouchMove && options.onTouchMove(e);
						}
					});

					pinch.addEventListener('touchend', function (e) {
						for (var i = 0; i < e.changedTouches.length; i++) {
							var touch = e.changedTouches[i];
							if (self.touchPoints[touch.identifier]) {
								delete self.touchPoints[touch.identifier];
								e.preventDefault();
							}
							if (Object.keys(self.touchPoints).length < 2) {
								self.measuring = false;
								options.onPinchEnd && options.onPinchEnd(self.distance / self.startDistance, self.startDistance, self.distance);
							}
						}
						if (!self.measuring) {
							options.onTouchEnd && options.onTouchEnd(e);
						}
					});
				}

				if (options.el && options.onPinchZoom) self.initEl();
			}

			// node history
			// NOTE we might want to replace the visitedNodes with this too
			// this is used only with markers now, BUT it always keeps the initial node ..
			var nodeHistory = (function () {

				var nodes = [];

				function previous() {
					if (nodes.length < 2) return null;
					return nodes[nodes.length - 2];
				}

				function last() {
					if (!nodes.length) return null;
					return nodes[nodes.length - 1];
				}

				function push(nodeid) {
					if (nodeid === last()) return;
					if ((nodes.length + 1) > options.nodeHistorySize) nodes.shift();
					nodes.push(nodeid);
				}

				return {
					previous: previous,
					last: last,
					push: push
				}
			})();

			// shingle dynamic styles module
			var graphCSS = (function () {

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

					if (styles[selector]) {
						idx = styles[selector];
						deleteRule(idx);
					} else {
						idx = styleIdx++;
						styles[selector] = idx;
					}

					insertRule(selector, rules, idx);
				}

				function clearRule(selector) {
					if (styles[selector]) {
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
				if (sheet) {
					insertRule = sheet.insertRule ? fInsRule : fAddRule;
					deleteRule = sheet.deleteRule ? fDelRule : fRemRule;
				}

				return {
					set: setRule,
					clear: clearRule,
					exists: existsRule,
					getSheet: function () {
						return sheet;
					}
				}
			})();

			// timer class
			var Timer = function () {

				var millis = performance.now ? function () { return performance.now(); } : function () {
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

			// html overlay
			var htmlOverlay = (function () {

				var nodeType = function (settings) {

					var self = this;

					this.position = {
						x: settings.position.x || null,
						y: settings.position.y || null
					};
					this.nodeid = settings.nodeid || null;
					this.quadid = settings.quadid || null;
					this.community = settings.community || null;
					this.text = settings.text || null;
					this.el = null;
					this.highlighted = (((settings.mode || false) & nodemodeflagHighlighted) != 0);
					this.nodeEl = null;
					this.radius = 0;
					this.rendered = false;

					this.render = function (content, events) {

						if (!this.nodeid || !this.quadid) return;

						// get the node
						this.nodeEl = document.getElementById(getNodeId(this.quadid, this.nodeid, this.highlighted));

						if (this.nodeEl === null) return false;

						// recreate if already there
						this.detach();

						// needed to correct position
						this.radius = this.nodeEl.getAttributeNS(null, 'data-radius');

						this.el = document.createElement('div');
						this.el.className = options.htmlOverlayNodeContainerClass;

						this.el.setAttribute('data-x', this.position.x);
						this.el.setAttribute('data-y', this.position.y);

						if (content) {
							if (content instanceof HTMLElement) {
								this.el.appendChild(content);
							} else {
								this.el.innerHTML = content;
							}
						}

						this.el.style.position = 'absolute';
						//debug
						//						this.el.style.border = '1px solid black';
						//
						this.el.style.top = ((this.position.y / mapinfo["totalMapHeight"]) * 100) + '%';
						this.el.style.left = ((this.position.x / mapinfo["totalMapWidth"]) * 100) + '%';

						if (this.radius > 0) {
							this.el.style.margin = (-1 * this.radius / pxFactor) + 'px';
							this.el.style.padding = (this.radius / pxFactor) + 'px';
						}

						if (events && events.length) {
							var clickEvent = false;
							events.forEach(function (event) {
								var eventName = Object.keys(event)[0];
								if (eventName) {
									this.el.addEventListener(eventName, event[eventName]);
									if (eventName == 'click') clickEvent = true;
								}
							}, this);
							if (!clickEvent && this.quadid && this.nodeid) {
								this.el.addEventListener('click', function (e) {
									showInfoAbout(self.quadid, self.nodeid);
									options.onNodeClick && options.onNodeClick(self.quadid, self.nodeid, currentScaleStep);
								});
							}
						}

						el.appendChild(this.el);
						this.rendered = true;
					}

					this.hideText = function () {
						if (this.text && this.text.field) this.text.field.style.display = 'none';
					}

					this.showText = function () {
						if (this.text && this.text.field) this.text.field.style.display = 'inherit';
					}

					this.checkText = function (text) {
						if (text) this.text = text;
					}

					this.detach = function () {
						if (this.el) {
							this.el.innerHTML = '';
							el.removeChild(this.el);
							this.rendered = false;
						}
					}
				},
					el = null,
					dims = {
						top: 0,
						right: 0,
						bottom: 0,
						left: 0
					},
					nodes = {};

				function activate() {
					if (options.onHoverIn || options.onFocus) {
						el = document.createElement('div');
						el.className = options.htmlOverlayClass;
					}
					return el;
				}

				// move along while dragging, call render to reset
				function move(delta) {
					el.style.top = (dims.top + delta.y) + 'px';
					el.style.left = (dims.left + delta.x) + 'px';
				}

				function set(rect) {
					dims.top = rect.top;
					dims.left = rect.left;
					dims.width = rect.width;
					dims.height = rect.height;
				}

				function render(rect) {
					if (rect) {
						set(rect);
					}
					el.style.top = dims.top + 'px';
					el.style.left = dims.left + 'px';
					el.style.width = dims.width + 'px';
					el.style.height = dims.height + 'px';
				}

				function isActive() {
					return (el !== null);
				}

				function addNode(nodeData) {

					var node = nodes[nodeData.nodeid];

					if (node) {
						node.checkText(nodeData.text);
						return node;
					}

					node = new nodeType({
						position: {
							x: nodeData.x + Math.abs(mapinfo["quadtree"]["xmin"]),
							y: nodeData.y + Math.abs(mapinfo["quadtree"]["ymin"])
						},
						text: nodeData.text,
						mode: nodeData.highlighted,
						quadid: nodeData.quadid,
						nodeid: nodeData.nodeid,
						community: nodeData.community || false
					});

					nodes[nodeData.nodeid] = node;
					return node;
				}

				function removeNode(nodeid) {
					var node = nodes[nodeid];
					if (node) {
						node.detach();
						delete nodes[nodeid];
					}
				}

				function getNode(nodeid) {
					return nodes[nodeid] || null;
				}

				function clear() {
					for (var nodeid in nodess) {
						if (nodes.hasOwnProperty(nodeid)) {
							removeNode(nodeid);
						}
					}
				}

				return {
					activate: activate,
					move: move,
					render: render,
					isActive: isActive,
					addNode: addNode,
					removeNode: removeNode,
					getNode: getNode,
					clear: clear
				};
			})();

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

				this.init = function (options) {
					this.options = options;
					if (this.options.failure) {
						// retoute timeouts and cors errors to failure if not explicitly set and failure
						// is defined
						if (!this.options.ontimeout) {
							this.options.ontimeout = function () {
								self.options.failure('timeout');
							}
						}
						if (!this.options.corsnotsupported) {
							this.options.ontimeout = function () {
								self.options.failure('CORS error');
							}
						}
					}
					this.options.method = options.method || 'GET';
					if (this.options.url.startsWith('http://')) {
						// cors check
						if (!this.options.url.startsWith(origin)) {
							this.isCORS = true;
						}
					}
					// CORS in old IE
					if (this.isCORS && this.IElt10) this.xhr = new XDomainRequest();
				};

				this.open = function () {
					var url = this.options.url;

					this.options.data = this.options.data || {};
					this.options.data.httpAccept = this.options.httpAccept || 'application/json';

					var params = [];

					for (var par in this.options.data) {
						params.push(encodeURIComponent(par) + '=' + encodeURIComponent(this.options.data[par]));
					}

					// extra parameters for graph (backend) ?
					for (var i = 0; i < options.graphPars.length; i++) {
						var parameter = options.graphPars[i];
						if (typeof parameter == 'object' && Object.keys(parameter)[0]) {
							params.push(Object.keys(parameter)[0] + '=' + parameter[Object.keys(parameter)[0]]);
						}
					}

					if (params.length) {
						url += ((url.indexOf('?') == -1) ? '?' : '&') + params.join('&');
					}

					if (this.IElt10) {
						this.xhr.open(this.options.method, url);
					} else {
						this.xhr.open(this.options.method, url, true);
					}
				};

				this.send = function (options) {

					this.init(options);

					if (this.xhr) {
						if (this.options.url && this.options.success) {
							this.open();
							// Response handlers.
							this.xhr.onload = function () {
								if (self.IElt10) {
									self.options.success(self.xhr.responseText);
								} else {
									if (self.xhr.readyState) {
										if (self.options.statusChange) {
											var statusText = self.xhr.readyState;
											if (self.xhr.status) {
												statusText += ' (' + self.xhr.status + ')';
											}
											self.options.statusChange(statusText);
										}
										if (self.xhr.readyState == 4) {
											if (self.xhr.status < 400) {
												self.options.success(self.xhr.responseText);
											} else {
												var errorText = 'error HTTP response ' + self.xhr.status;
												if (self.options.failure) {
													self.options.failure(errorText);
												}
											}
										}
									} else {
										if (self.xhr.status < 400) {
											self.options.success(self.xhr.responseText);
										} else {
											var errorText = 'error HTTP response ' + self.xhr.status;
											if (self.options.failure) {
												self.options.failure(errorText);
											}
										}
									}
								}
							};
							if (this.options.failure) {
								this.xhr.onerror = function (error) {
									self.options.failure(error);
								};
							}
							// ie9 not working without this..
							if (this.xhr.onprogress !== undefined) {
								this.xhr.onprogress = function () {
									self.options.progress && self.options.progress(self.IElt10 ? self.xhr.responseText : arguments);
								};
							}
							// ie11 in ie9 mode not working without this..
							if (this.xhr.ontimeout !== undefined) {
								this.xhr.ontimeout = this.options.timeout || function () { };
							}
							//
							// 500 errors and some cors errors occur during send
							this.xhr.send();
						}
					} else {
						if (this.options.corsnotsupported) {
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
					failure: function (e) { console.log(e); }
				});
			}

			// module for loading quads
			var quadsLoader = function () {

				var gReqQ = [], timer = false;

				function load(reqQ) {
					var quadPars = '';

					if (reqQ.length > 1) {

						var callbacks = {};
						for (var i = 0; i < reqQ.length; i++) {

							var req = reqQ[i], fileName = req.quadid + ".json";

							if (i > 0) quadPars += ',';
							quadPars += fileName;
							callbacks[fileName] = req.callback;
						};

						var json_url = options.graphPath + quadPars;
						ajaxGet(json_url, function (responses) {

							var quadsArr = JSON.parse(responses);
							for (var i = 0; i < quadsArr.length; i++) {
								var response = quadsArr[i];
								if (response.fileName && callbacks[response.fileName]) {
									callbacks[response.fileName](response.data);
								}
							};
						});

					} else if (reqQ.length) {

						var json_url = options.graphPath + reqQ[0].quadid + ".json",
							callback = reqQ[0].callback;

						ajaxGet(json_url, function (response) {
							callback(JSON.parse(response));
						});
					}
				}

				function exec(i) {
					clearTimeout(timer);
					if (gReqQ.length > 5 || i > 5) {
						load(gReqQ.slice());
						gReqQ = [];
					} else {
						timer = setTimeout(function () {
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
				if (currentScale > 1) {
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
				if (currentTranslateX) {
					var tWidth = currentTranslateX * svgDims.factor * currentScale;
					rect.left += tWidth;
					rect.right += tWidth;
				}
				if (currentTranslateY) {
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

			function setBoundingrectDims() { };

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
				var id = 'i' + instance + '-' + quadid + "-node-" + nodeid;
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

			function communityClassName(community) {

				var elClassName = options.communityClassPrefix + (community || 0);

				// show / hide class newly used communities
				// note we could use data-attrs (much cleaner)
				// but classes still seem to perform better
				if (typeof community !== "undefined") {
					if (!communities[community]) {

						var parentClassName4Hide = options.communityClassPrefix + community + options.communityClassHiddenPostfix;
						communities[community] = parentClassName4Hide;

						graphCSS.set('.' + options.mapClass + '.' + parentClassName4Hide + ' .' + elClassName, options.hiddenCommunityCSS);
					}
				}

				// 
				return elClassName;
			}

			function showCommunity(community) {
				if (community && communities[community]) {
					mfrmap.classList.remove(communities[community]);
				}
			}

			function hideCommunity(community) {
				if (community && communities[community]) {
					mfrmap.classList.add(communities[community]);
				}
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

				if (htmlOverlay.isActive()) htmlOverlay.render(datarectPixels);

				scaleX = ((1.0 * mapinfo["quadtree"]["xmax"]) - mapinfo["quadtree"]["xmin"]) / (datarectPixels.right - datarectPixels.left),
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
				if ((root["xmax"] - root["xmin"]) < options.quadDisplayThreshold * (screenrect[2] - screenrect[0])) {
					return false;
				}

				if ((root["ymax"] - root["ymin"]) < options.quadDisplayThreshold * (screenrect[3] - screenrect[1])) {
					return false;
				}

				// Else, draw.
				return true;
			}

			function findQuadsNodeJs(screenrect) {

				// make sure we do not send out of bounds values to the mapServer
				// it will see all 404's as evil
				var xmin = Math.max(screenrect[0], mapinfo["quadtree"]["xmin"]),
					ymin = Math.max(screenrect[1], mapinfo["quadtree"]["ymin"]),
					xmax = Math.min(screenrect[2], mapinfo["quadtree"]["xmax"]),
					ymax = Math.min(screenrect[3], mapinfo["quadtree"]["ymax"]);

				var url = options.graphPath + 'findQuads' +
					'?xmin=' + xmin +
					'&ymin=' + ymin +
					'&xmax=' + xmax +
					'&ymax=' + ymax +
					'&quadDisplayThreshold=' + options.quadDisplayThreshold,
					thisRect = JSON.stringify(screenrect);

				currentRect = thisRect;

				ajaxGet(url, function (response) {
					if (response) {
						var quads = JSON.parse(response);

						if (quads.length && thisRect == currentRect) {

							for (var i = 0; i < quads.length; i++) {
								if (!drawnQuad(quads[i])) {
									loadQuad(quads[i]);
								}
							};
						}
					}
				});
			}

			function mapLoaded(callback) {

				var wait = true;
				if (mapinfo && mapinfo["quadtree"] && typeof scalingEl != "undefined" && typeof translationEl != "undefined") {
					wait = false;
					callback();
				}
				if (wait) {
					var self = this;
					if (mapLoadTries < mapLoadMaxTries) {
						mapLoadTries++;
						setTimeout(function () {
							mapLoaded(callback);
						}, mapLoadWaitMsec);
					} else {
						console.log('Map not loaded after ' + mapLoadTries + ' attempts');
					}
				}
			}

			function setSelection(dims) {

				if (dims && dims.x && isNaN(dims.x)) return;
				if (dims && dims.y && isNaN(dims.y)) return;
				if (dims && dims.width && isNaN(dims.width)) return;
				if (dims && dims.height && isNaN(dims.height)) return;

				mapLoaded(function () {
					var dimensions = dims || {}, minPerc = 3 / 100;

					dimensions.x = dimensions.x || 0;
					dimensions.y = dimensions.y || 0;
					dimensions.width = dimensions.width || 0;
					dimensions.height = dimensions.height || 0;

					// minimum width and height to prevent dissapearing rect
					if (dimensions.width < minPerc || dimensions.height < minPerc) {
						var ratio = dimensions.width / dimensions.height;
						dimensions.width = minPerc;
						dimensions.height = dimensions.width / ratio;
					}

					if (!navrect) {
						navrect = document.createElementNS(xmlns, "rect");
						navrect.setAttributeNS(null, "fill", 'none');
						navrect.setAttributeNS(null, "stroke", '#808080');

						navrect2 = document.createElementNS(xmlns, "rect");
						navrect2.setAttributeNS(null, "fill", 'none');
						navrect2.setAttributeNS(null, "stroke", '#fff');

						translationEl.appendChild(navrect2);
						translationEl.appendChild(navrect);
					}

					var width = (mapinfo["quadtree"]["xmax"] - mapinfo["quadtree"]["xmin"]),
						height = (mapinfo["quadtree"]["ymax"] - mapinfo["quadtree"]["ymin"]),
						strokeFactor = 1.33,
						onePX = scaleX / currentScale,
						strokeWidth = (strokeFactor * onePX) + "px";

					navrect.setAttributeNS(null, "x", "" + ((width * dimensions.x) + mapinfo["quadtree"]["xmin"]));
					navrect.setAttributeNS(null, "y", "" + ((height * dimensions.y) + mapinfo["quadtree"]["ymin"]));
					navrect.setAttributeNS(null, "width", "" + (width * dimensions.width));
					navrect.setAttributeNS(null, "height", "" + (height * dimensions.height));
					navrect.setAttributeNS(null, "stroke-width", "" + strokeWidth);

					// set second navrect has x y offset
					navrect2.setAttributeNS(null, "x", "" + ((width * dimensions.x) + mapinfo["quadtree"]["xmin"] + (strokeFactor * onePX)));
					navrect2.setAttributeNS(null, "y", "" + ((height * dimensions.y) + mapinfo["quadtree"]["ymin"] + (strokeFactor * onePX)));
					navrect2.setAttributeNS(null, "width", "" + (width * dimensions.width));
					navrect2.setAttributeNS(null, "height", "" + (height * dimensions.height));
					navrect2.setAttributeNS(null, "stroke-width", "" + strokeWidth);
				});
			}

			function findQuadsToDraw() {

				var screenrect = containerWorldRect(),
					root = mapinfo["quadtree"],
					quadid = "quad_";

				// map view changed

				// reverse scale nodes in viewport when not possible with CSS
				revScaleNodesInViewport();

				// optional callback for the event
				if (options.onMapViewChanged) {
					var mapTop = mapinfo["quadtree"]["ymin"],
						mapRight = mapinfo["quadtree"]["xmax"],
						mapBottom = mapinfo["quadtree"]["ymax"],
						mapLeft = mapinfo["quadtree"]["xmin"],
						mapWidth = mapRight - mapLeft,
						mapHeight = mapBottom - mapTop,
						viewTop = screenrect[1],
						viewRight = screenrect[2],
						viewBottom = screenrect[3],
						viewLeft = screenrect[0],
						viewWidth = viewRight - viewLeft,
						viewHeight = viewBottom - viewTop;

					var viewX = viewLeft - mapLeft,
						viewY = viewTop - mapTop;

					// return view on the map in the viewport, in percentages
					options.onMapViewChanged({
						x: Math.min(Math.max(viewX / mapWidth, 0), 1),
						y: Math.min(Math.max(viewY / mapHeight, 0), 1),
						width: Math.min(viewWidth / mapWidth, 1),
						height: Math.min(viewHeight / mapHeight, 1)
					});
				}

				showInitialNodeNames();

				if (mapinfo.loadFromBackend) {
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

					if (!quadsDrawn.hasOwnProperty(quadId)) continue;
					if (quadsWithHighlightedNodes.hasOwnProperty(quadId)) continue;

					var quadDrawn = quadsDrawn[quadId],
						header = graphs[quadId].header;

					if (header != null) {
						if (!shouldQuadBeVisible(screenrect, header)) {

							if (quadDrawn.lines && quadDrawn.lines.parentNode) {
								quadDrawn.lines.parentNode.removeChild(quadDrawn.lines);
							}
							if (quadDrawn.nodes && quadDrawn.nodes.parentNode) {
								quadDrawn.nodes.parentNode.removeChild(quadDrawn.nodes);
							}
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

				if (mapinfo.loadFromBackend) {
					url += '?nodeid=' + nodeid;
				}

				ajaxGet(url, function (response) {

					var table = JSON.parse(response),
						entry = table[nodeid],
						doRender = true;

					if (entry) {
						currentTranslateX = -entry[0];
						currentTranslateY = -entry[1];
						currentnodeid = nodeid;
						nodeHistory.push(currentnodeid);
						options.onNodeFound && options.onNodeFound();

						if (quadLevels) {
							highlightedQuad = entry[2];
						}
					} else {
						doRender = options.renderWhenNodeNotFound;
						options.onNodeNotFound && options.onNodeNotFound();
					}
					if (doRender) {
						renderMap();

						if (highlightedQuad != null) {
							//console.log("going to load higlighted quad "+highlightedQuad);
							loadNonCompactQuad(highlightedQuad, true);
						}
					}
				});
			}

			function calcMapStyles() {

				var incScale = options.nodesGrow ? 0.0015 : 0;

				// reverse edge width
				if (svg12T) {
					graphCSS.set('.' + options.mapClass + ' .' + options.edgeClass, {
						'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round'
					});
					graphCSS.set('.' + options.mapClass + ' .' + options.linescontainerClass + ' .' + options.edgeClass, {
						'font-size': options.edgeWidthFactor + 'px'
					});
					graphCSS.set('.' + options.mapClass + ' .' + options.highlightedlinescontainerClass + ' .' + options.edgeClass, {
						'font-size': options.highlightedEdgeWidthFactor + 'px'
					});
					if (options.useNonScalingStrokeForNodes) {
						graphCSS.set('.' + options.mapClass + ' .' + options.nodeClass, {
							'font-size': options.fontSize + 'px',
							'vector-effect': 'non-scaling-stroke'
						});

						// the highlighted node is 1.5 times bigger
						graphCSS.set('.' + options.mapClass + ' .' + options.nodeClass + '.' + options.highlightedNodeClass, {
							'font-size': (options.fontSize * 1.5) + 'px'
						});
						graphCSS.set('.' + options.mapClass + ' g.' + options.highlightedNodeClass + ' .' + options.nodeClass, {
							'font-size': (options.fontSize * 1.5) + 'px'
						});
					}
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
				graphCSS.set('.' + options.mapClass + ' svg.with-focus' + ' .' + options.defaultNodeTextClass, {
					'opacity': '0.78'
				});

				// use generated scaling steps, scaling using dynamic generated css
				var dMinScale = (options.extraZoom > 0) ? minScale / options.extraZoom : minScale, stepScale = dMinScale;

				// there is a min node size because of minimum PX size limits in firefox and IE
				// no problems in WebKit browsers
				var minPX = 0.00001;

				if (isFirefox()) minPX = 0.025;
				if (!svg12T) minPX = 0.04; // IE

				while (stepScale <= maxScale && stepScale >= dMinScale) {

					var thisScale = stepScale;

					if (startScaleStep === false && startScale >= (1 / thisScale)) {
						startScale = (1 / thisScale);
						startScaleStep = zoomStep;
						incScale = false;
					}

					zoomSteps[zoomStep] = (1 / thisScale);

					// edge width base em should always be around 2px at the screen
					// strictly only needed when SVG 1.2T not supported by the browser
					if (!svg12T) {
						graphCSS.set('.' + options.mapClass + '.i' + instance + '-zoom-level-' + zoomStep + ' .' + options.linescontainerClass + ' .' + options.edgeClass, {
							'stroke-width': Math.max((thisScale * options.edgeWidthFactor * 2 * pxFactor), 0.00017) + 'px'
						});
						graphCSS.set('.' + options.mapClass + '.i' + instance + '-zoom-level-' + zoomStep + ' .' + options.highlightedlinescontainerClass + ' .' + options.edgeClass, {
							'stroke-width': Math.max((thisScale * options.highlightedEdgeWidthFactor * 2 * pxFactor), 0.00033) + 'px'
						});
					}

					var scaleFactor = startScale * thisScale * (1 - (Math.log(zoomStep + 1) / 15));

					if (incScale && options.nodesGrow && stepScale >= minScale) {
						incScale += (0.015 * stepScale / maxScale);
					}
					scaleFactor += incScale;

					// reverse scale the node based on zoom level
					// up to the max where we go below minPX
					// in which case scale remains minPX and the rest is done via JS (revScale Quad/Node)
					// only needed when no non-scaling stroke supported or enabled for circles
					var scaleFactorM = Math.max(scaleFactor, minPX);

					if (!options.useNonScalingStrokeForNodes) {

						// animate
						if (options.animateZoom) {
							graphCSS.set('.' + options.mapClass + ' .' + options.nodeClass, {
								'transition': 'font-size ' + options.animateZoom.duration + 's ' + options.animateZoom.timing
							});
						}

						graphCSS.set('.' + options.mapClass + '.i' + instance + '-zoom-level-' + zoomStep + ' .' + options.nodeClass, {
							'font-size': scaleFactorM + 'px'
						});
					}

					zoomStepsNodeScales[zoomStep] = {
						cssFactor: scaleFactorM,
						jsFactor: scaleFactor / scaleFactorM,
						factor: scaleFactor
					};

					if (scaleFactor < scaleFactorM) {
						// note here we could decide to stop the zoomlevels for FF to prevent the non-clickable nodes issue on FF
						revScaleNodesJSStep = zoomStep;
					}

					stepScale *= 1.1;
					zoomStep++;
				}

				// animate text
				if (options.animateZoom) {
					graphCSS.set('.' + options.mapClass + ' .' + options.nodeTextClass, {
						'transition': 'transform ' + options.animateZoom.duration + 's ' + options.animateZoom.timing
					});
					graphCSS.set('.' + options.mapClass + ' .' + options.highlightedNodeTextClass, {
						'transition': 'transform ' + options.animateZoom.duration + 's ' + options.animateZoom.timing
					});
				}

				// animate layer zoom and pan
				if (options.animateZoom) {
					graphCSS.set('.' + options.scaleElClass, {
						'transition': 'transform ' + options.animateZoom.duration + 's ' + options.animateZoom.timing
					});
				}
				if (options.animatePan) {
					graphCSS.set('.' + options.translationElClass + ':not(.moving)', {
						'transition': 'transform ' + options.animatePan.duration + 's ' + options.animatePan.timing
					});
				}

				// debug quad hover visual indicators
				if (options.debugQuads) {
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
			}

			function renderMap() {

				// for IE (absence of non-scaling strokes / svg1.2tiny) we need to know the pixel factor
				var mapWidth = mapinfo["totalMapWidth"], dspWidth = options.el.clientWidth,
					mapHeight = mapinfo["totalMapHeight"], dspHeight = options.el.clientHeight;

				pxFactor = Math.min(mapWidth / dspWidth, mapHeight / dspHeight);
				minScale = mapinfo["averageQuadWidth"] / mapWidth;
				maxScale = (5 * mapinfo["averageQuadWidth"]) / mapWidth;

				if (quadLevels) {
					maxScale = 1;
				}

				nodeRadiusScale = mapinfo["averageQuadWidth"] * options.nodeRadiusScaleFactor;

				if (nodeRadiusScale > 1)
					nodeRadiusScale = 1;

				// calculate edge radius depending on average quad width
				nodeEdgeRadiusScale = (2 / 3 * mapinfo["averageQuadWidth"]) / 200.0;
				edgeWidthScale = (2 / 3 * mapinfo["averageQuadWidth"]) * minScale / 10.0;

				startScale = 1 / (minScale + (maxScale - minScale) * (options.initialZoom / 100.0));
				startNodeScale = calcNodeScale(startScale);

				calcMapStyles();

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

				renderBase();
			}

			function renderBase(callback, force) {
				var msecs = (typeof force == "undefined") ? options.renderDelay : 0;
				clearTimeout(renderStart);
				renderStart = setTimeout(function () {
					if (doRender) {
						doRender = false;
						if (!options.showBitmapOnly) {
							// show the graph
							findQuadsToDraw();
						} else {
							// only the bitmap is displayed
							// init the screenrect only
							containerWorldRect();
						}
						options.onMapRender && options.onMapRender({
							zoomLevel: currentScaleStep
						});
					}
					callback && callback();
				}, msecs);
			}

			function loadMapInfo(nodeid) {
				ajaxGet(options.graphPath + "mapinfo.json", function (response) {

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
					if (mapinfo.supportsMultipleQuadsLoader && options.useMultipleQuadsLoader) {
						getQuad = getQuadWithLoader;
					}

					if (nodeid) {
						findPosition(nodeid)
					} else {
						renderMap();
					}
				});
			}

			function getQuadCache(quadid, found, notfound) {
				if (quadsCache[quadid]) {
					found(quadsCache[quadid]);
				} else {
					notfound();
				}
			}

			function getQuadWithLoader(quadid, callback) {
				getQuadCache(quadid, callback, function () {
					quadsLoader.request(quadid, function (quad) {

						quadsCache[quadid] = quad;
						callback(quad);
					});
				});
			}

			function getQuadSingle(quadid, callback) {
				getQuadCache(quadid, callback, function () {

					var json_url = options.graphPath + quadid + ".json";

					ajaxGet(json_url, function (response) {
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

				getQuad((quadsWithHighlightedNodes.hasOwnProperty(quadid) ? 'e' : '') + quadid, function (graph) {
					if (graphs[quadid] == null) {
						graph.shingleIndex = Object.keys(graphs).length - 1;
						graphs[quadid] = graph;
						scheduler.addTask(new ScheduledAppendQuad(quadid));
					}
				});
			}

			function loadNonCompactQuad(quadid, loadReferenced) {
				if (!quadLevels) {
					return;
				}
				var doload = true;

				// Check to see if we already have a non-compact quad loaded
				if (graphs[quadid]) {
					if (graphs[quadid]["header"]["compact"] != true) {
						doload = false;
					}
				}

				if (doload) {

					getQuad("e" + quadid, function (graph) {
						if (loadReferenced) {
							keepHighlightedNodesLoaded(graph);
						}

						if (graphs[quadid] != null) {

							if (graphs[quadid]["header"]["compact"] == true) {

								if (quadsDrawn[quadid]) {
									var quadDrawn = quadsDrawn[quadid];

									if (quadDrawn.lines && quadDrawn.lines.parentNode) quadDrawn.lines.parentNode.removeChild(quadDrawn.lines);
									if (quadDrawn.nodes && quadDrawn.nodes.parentNode) quadDrawn.nodes.parentNode.removeChild(quadDrawn.nodes);
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

				if (!graph["relations"]) return;

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
						loadNonCompactQuad(key, false);
					}
				}
			}

			function keepHighlightedNodesLoaded(graph) {
				if (graph["relations"]) {
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
						if (quadDrawn.lines && quadDrawn.lines.parentNode) quadDrawn.lines.parentNode.removeChild(quadDrawn.lines);
						if (quadDrawn.nodes && quadDrawn.nodes.parentNode) quadDrawn.nodes.parentNode.removeChild(quadDrawn.nodes);
					}
				}
				quadsWithHighlightedNodes = {};
			}

			function debugLog(str) {
				if (options.debug) {
					debugEl.innerHTML = str;
				}
			}

			function isNearEnough(val1, val2, tolerance) {
				var toleranceV = tolerance || 0;
				return (val2 > val1 - toleranceV && val2 < val1 + toleranceV);
			}

			function detectNodeClicked(x, y, tolerance) {

				var screenrect = containerWorldRect(),
					nodes = [];

				// check nodes in visible quads, only visible van be clicked
				for (var quadId in quadsDrawn) {

					if (!quadsDrawn.hasOwnProperty(quadId)) continue;

					var quad = graphs[quadId];

					if (quad.header != null) {
						if (quadIntersects(screenrect, quad.header)) {
							for (var i = 0; i < quad.nodes.length; i++) {
								var node = quad.nodes[i];
								if (isNearEnough(x, node.x, tolerance) && isNearEnough(y, node.y, tolerance)) {
									nodes.push({
										nodeId: node.nodeid,
										quadId: quadId,
										x: node.x,
										y: node.y,
										deltaX: Math.abs(x - node.x),
										deltaY: Math.abs(y - node.y)
									});
								}
							}
						}
					}
				}

				if (nodes.length) {
					nodes.sort(function (a, b) {
						return (a.deltaX - b.deltaX) + (a.deltaY - b.deltaY);
					});
				}

				return nodes[0];
			}

			function handleMouseDown(evt) {

				renderBase(function () {
					dragTimer.start();

					dragCoordinates.x = evt.pageX;
					dragCoordinates.y = evt.pageY;

					startTranslateX = currentTranslateX;
					startTranslateY = currentTranslateY;

					var rect = getBoundingrectDims();
					sfactor = (rect.right - rect.left) / ((1.0 * mapinfo["quadtree"]["xmax"]) - mapinfo["quadtree"]["xmin"]);

					dragging = true;

					// prevent animations while dragging
					translationEl.classList.add('moving');
				}, true);
			}

			function handleMouseMove(evt) {
				if (dragging) {
					var deltaX = evt.pageX - dragCoordinates.x,
						deltaY = evt.pageY - dragCoordinates.y;

					currentTranslateX = startTranslateX + deltaX / sfactor;
					currentTranslateY = startTranslateY + deltaY / sfactor;

					//@@@ removing the following line causes the map to not render well when zoomed in on Firefox, no idea why...
					debugLog("<p style=\"color:#ffffff\">" + 0 + "</p>");

					// the overlay should 'drag along'
					if (htmlOverlay.isActive()) {
						htmlOverlay.move({
							x: deltaX,
							y: deltaY
						});
					}

					setSvgTranslations();
				}
			}

			function handleMouseUp(evt) {

				dragTimer.end();

				if (!dragCoordinates.x || !dragCoordinates.y) return;

				var deltaX = evt.pageX - dragCoordinates.x,
					deltaY = evt.pageY - dragCoordinates.y;

				dragging = false;
				dragCoordinates.x = false;
				dragCoordinates.y = false;

				// an actual pan
				if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
					setBoundingrectDims();

					// class for translate animations disabling while dragging
					translationEl.classList.remove('moving');

					// reset the overlay
					if (htmlOverlay.isActive()) htmlOverlay.render();

					findQuadsToDraw();
					findQuadsToRemove();
				}

				if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
					// no panning, just a click
					// WHICH is NOT catched by the node click event handlers
					if (dragTimer.elapsed() > options.clickToBlurTimeThreshold) {
						//
						// use a threshold in milliseconds to make sure this is
						// is an intended 'long' click to de-select a node
						//
						removeInfoAbout();
						if (options.containerWithFocusClass) {
							options.el.classList.remove(options.containerWithFocusClass);
						}
						options.onBlur && options.onBlur(currentScaleStep, nodeHistory.last());
						syncInfoDisplay(false);
					}
					if (isFirefox()) {
						// due to bug in firefox ..
						// .. this might be an intended node click
						// just outside a node or a node click bubbling up
						// because the node handler did not catch the click
						// on the node when extremely scaled up
						var rect = containerWorldRect(),
							left = rect[0], top = rect[1],
							x = (evt.pageX * scaleX) + left,
							y = (evt.pageY * scaleY) + top,
							nodeClicked = detectNodeClicked(x, y, 0.05);

						if (nodeClicked) {
							showInfoAbout(nodeClicked.quadId, nodeClicked.nodeId);
							options.onNodeClick && options.onNodeClick(nodeClicked.quadId, nodeClicked.nodeId, currentScaleStep);
						}

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

						mfrmap.addEventListener('mouseleave', function (evt) {
							handleMouseUp(evt);
						}, false);

						if ('ontouchstart' in document.documentElement) {
							var touchHandler = new touch({
								el: mfrmap,
								growFactor: 4,
								onPinchStart: function (distance) {
								}, onPinchZoom: function (delta, totalGrowth) {
									var newStep = Math.max(Math.round(currentScaleStep / (1 + delta)), 1);
									if (newStep != currentScaleStep) {
										scheduleScaleTo(newStep, 3, function () {
										});
									}
								}, onPinchEnd: function (totalGrowth, startDistance, endDistance) {
									findQuadsToRemove();
									findQuadsToDraw();
								}, onTouchStart: function (evt) {
									var touchobj = evt.changedTouches[0];
									handleMouseDown(touchobj);
									evt.preventDefault();
									evt.cancelBubble = true;
								}, onTouchMove: function (evt) {
									var touchobj = evt.changedTouches[0];
									handleMouseMove(touchobj);
									evt.preventDefault();
									evt.cancelBubble = true;
								}, onTouchEnd: function (evt) {
									var touchobj = evt.changedTouches[0];
									handleMouseUp(touchobj);
									evt.preventDefault();
									evt.cancelBubble = true;
								}
							});
						}

						var handleScroll = function (evt) {

							detectScroll(evt, function (delta) {
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

			function onBitmapChange(event, type, scaleSteps, currentScaleStep, initialStep, bitmapElement, filterContainer) {

				var delta = currentScaleStep / scaleSteps, newOpacity;

				if (delta >= 0.75) {
					newOpacity = 1;
				} else if (delta >= 0.5) {
					newOpacity = 4 * (delta - 0.5);
				} else {
					newOpacity = 0;
				}

				bitmapcontainer.style.opacity = newOpacity;
			}

			function updateBitmapStyles(event, type) {
				if (bitmapcontainer != null) {
					onBitmapChange(event, type, zoomSteps.length, currentScaleStep, startScaleStep, bitmapcontainer, svg, linescontainer, highlightedlinescontainer);
				}
			}

			function loadBitmap(name, type, callback) {
				var xmlHTTP = new XMLHttpRequest(),
					params = [],
					url = options.graphPath + name;

				for (var i = 0; i < options.graphPars.length; i++) {
					var parameter = options.graphPars[i];
					if (typeof parameter == 'object' && Object.keys(parameter)[0]) {
						params.push(Object.keys(parameter)[0] + '=' + parameter[Object.keys(parameter)[0]]);
					}
				}
				if (params.length) url += '?' + params.join('&');

				xmlHTTP.open('GET', url, true);

				xmlHTTP.responseType = 'arraybuffer';
				xmlHTTP.onload = function (e) {
					var blob = new Blob([this.response]);
					bitmapcontainer.setAttributeNS('http://www.w3.org/1999/xlink', "xlink:href", window.URL.createObjectURL(blob));
					updateBitmapStyles('load', type);
					callback && callback();
				};
				updateBitmapStyles('request', type);
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

				if (options.translateOffsetX) currentTranslateX += options.translateOffsetX / currentScale;
				if (options.translateOffsetY) currentTranslateY += options.translateOffsetY / currentScale;

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
				if (options.useBitmap && typeof (Blob) == "undefined") options.useBitmap = false;
				if (options.useBitmap) {

					bitmapcontainer = document.createElementNS(xmlns, "image");
					bitmapcontainer.setAttributeNS(null, "class", options.bitmapcontainerClass + " shingle-unselectable");
					bitmapcontainer.setAttributeNS(null, "x", "" + xmin);
					bitmapcontainer.setAttributeNS(null, "y", "" + ymin);
					bitmapcontainer.setAttributeNS(null, "width", "" + (xmax - xmin));
					bitmapcontainer.setAttributeNS(null, "height", "" + (ymax - ymin));
					bitmapcontainer.style.opacity = 0;

					loadBitmap("image_2400low.jpg", "lowRes", function () {
						loadBitmap("image_2400.jpg", "hiRes");
					});

					bitmapcontainer.ondragstart = function () { return false; };

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

				// highlighted nodes and related nodes
				highlightednodescontainer = document.createElementNS(xmlns, "g");
				highlightednodescontainer.setAttributeNS(null, "class", options.highlightednodescontainerClass);
				translationEl.appendChild(highlightednodescontainer);

				// names of the highlighted nodes
				highlightednamescontainer = document.createElementNS(xmlns, "g");
				highlightednamescontainer.setAttributeNS(null, "class", options.highlightednamescontainerClass);
				translationEl.appendChild(highlightednamescontainer);

				// node and name events
				if (options.selectNodes) {
					addNodeEvents(highlightednodescontainer);
					addTextEvents(highlightednamescontainer);
				}

				mfrmap.appendChild(svg);
			}

			function clearNodeNames() {
				if (highlightednamescontainer == null) {
					return;
				}
				if (options.useMarkers) {
					var i = textRects.length;
					while (i--) {
						var textRect = textRects[i];
						if (!textRect.scaleStep) {
							if (visitedNodes.indexOf(textRect.node.nodeid) == -1) {
								if (textRect.field.parentNode) textRect.field.parentNode.removeChild(textRect.field);
								textRects.splice(i, 1);
							} else {
								var fieldClassName = textRect.field.getAttributeNS(null, "class");

								if (fieldClassName.indexOf(options.visitedNodeTextClass) == -1) {
									textRect.field.setAttributeNS(null, "class", fieldClassName + ' ' + options.visitedNodeTextClass);
								}
							}
						}
					}
				} else {
					for (var i = textRects.length - 1; i >= 0; i--) {
						var textRect = textRects[i];
						if (!textRect.scaleStep && textRect.field) {
							textRect.field.parentNode.removeChild(textRect.field);
							textRects.splice(i, 1);
						}
					};
				}
				// clear overlay
				// here when and how ?
				if (htmlOverlay.isActive()) {
					//				htmlOverlay.clear();
				}
			}

			function setSvgDims() {

				if (typeof mapinfo == "undefined") {
					console.log('NOTICE: mapinfo not loaded');
					return;
				}

				svgDims = {};

				var mRect = svg.getBoundingClientRect(), rect = {};

				var ymin = mapinfo["quadtree"]["ymin"],
					ymax = mapinfo["quadtree"]["ymax"],
					graphHeight = ymax - ymin,
					svgHeight = mRect.bottom - mRect.top,
					svgHeightFactor = svgHeight / graphHeight;

				var xmin = mapinfo["quadtree"]["xmin"],
					xmax = mapinfo["quadtree"]["xmax"],
					graphWidth = xmax - xmin,
					svgWidth = mRect.right - mRect.left,
					svgWidthFactor = svgWidth / graphWidth;

				// svg fits to box in as well width as height
				svgDims.factor = Math.min(svgHeightFactor, svgWidthFactor);
				svgDims.heightFactor = svgHeightFactor;
				svgDims.widthFactor = svgWidthFactor;
				if (svgHeightFactor < svgWidthFactor) {
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
				if (svgHeightFactor < svgWidthFactor) {
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
				if (!baseScale) {
					baseScale = (1 / (startScale * getSvgFactor()));
				}
			}

			function calcCurrentFontScale() {

				//
				// calculate fontsize of text element to display as specified fontSize in px on screen
				var size;

				calcBaseScale();
				if (!fontScale) {
					fontScale = options.fontSize * baseScale;
				}
				if (options.textGrow) {
					if (options.textShrink) {
						// grow and shrink
						size = fontScale;
					} else {
						// keep thesame size but do not shrink
						size = fontScale * (Math.max(startScale, currentScale) / currentScale);
					}
				} else {
					// keep thesame size
					size = fontScale * (startScale / currentScale);
				}

				return size;
			}

			function calcNodeScale(scale) {
				if (quadLevels) {
					return (18.0 / scale);
				}
				return 1;
			}

			function calcCurrentNodeScale() {
				return startNodeScale;
			}

			function textBoxCollides(tRect) {

				if (!tRect.displayed) return false;

				var collisionRect = false,
					fSVG = getSvgFactor(),
					textRect = {
						top: tRect.top * currentScale * fSVG,
						right: tRect.right * currentScale * fSVG,
						bottom: tRect.bottom * currentScale * fSVG,
						left: tRect.left * currentScale * fSVG
					};

				for (var i = 0; i < textRects.length; i++) {
					var oRect = textRects[i];

					if (oRect.displayed && tRect.node.name != oRect.node.name) {

						var otherRect = {
							top: oRect.top * currentScale * fSVG,
							right: oRect.right * currentScale * fSVG,
							bottom: oRect.bottom * currentScale * fSVG,
							left: oRect.left * currentScale * fSVG
						};

						if (!(textRect.right < otherRect.left ||
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

			function getTextRect(textfield, node, onHoverOnly, fontAttrs, nodeOffSets, mainNode, scaleStep) {

				var offSets = nodeOffSets || {
					x: 1,
					y: -1
				};

				offSets.xc = 0;
				offSets.yc = 0;

				var range = nodeRange(node),
					nodeScaleFactor = zoomStepsNodeScales[currentScaleStep].factor,
					// note radius x 3 because node has size radius x 2 and there are always highlighted (x 1,5)
					nodeRadius = calcNodeRadius(range) * nodeRadiusScale * calcCurrentNodeScale() * nodeScaleFactor * 3;

				var ttDims, fontSize;

				ttDims = {
					width: textfield.getAttributeNS(null, 'data-width') || 0,
					height: textfield.getAttributeNS(null, 'data-height') || 0
				};

				// correct to scaled font-size
				var revScale = (1 / currentScale) / getSvgFactor();

				if (typeof fontAttrs == 'object') {
					fontSize = fontAttrs.newSize;
				} else {
					fontSize = fontAttrs;
				}

				if (!ttDims.width || !ttDims.height) {
					// first time, get the bounding box
					// can cause errors in firefox if not yet appended to DOM
					// since we need it to be not visible just use exception for now
					try {

						// this is not a very clean way to determine the width
						// but more trustworthy than the getBBox
						var tEl = document.createElement('span');
						tEl.innerHTML = node.name;
						tEl.style.fontSize = fontSize + "px";
						document.body.appendChild(tEl);

						ttDims.width = tEl.offsetWidth;
						ttDims.height = tEl.offsetHeight;

						// correct for bbox scale
						textfield.setAttributeNS(null, 'data-width', ttDims.width);
						textfield.setAttributeNS(null, 'data-height', ttDims.height);

						document.body.removeChild(tEl);

					} catch (e) { };
				}

				ttDims.width *= revScale;
				ttDims.height *= revScale;

				if (offSets.x < 0) {
					offSets.xc = -1 * ttDims.width;
				}
				if (offSets.y > 0) {
					offSets.yc = .5 * ttDims.height;
				}

				var safetyX = 0.88, //1.75,
					safetyY = 0.44, //0.88,
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
						scaleStep: scaleStep || false,
						displayed: true
					};

				// add attributes for SVG matrix scaling
				textRect.revScale = revScale;
				textRect.revX = textRect.left - (revScale * textRect.left);
				textRect.revY = textRect.top - (revScale * textRect.top);

				return textRect;
			}

			function positionTextRect(tRect, strict) {

				var textRect = tRect;

				textRect.displayed = !textRect.scaleStep || (textRect.scaleStep >= currentScaleStep);

				if (textRect.displayed && !textRect.mainNode && !textRect.onHoverOnly) {

					// check if distance to main node is mimimum of 1.8 lineheight on display
					if (textRect.offSets.d && (textRect.offSets.d * currentScale * getSvgFactor() < options.relatedNodesFontSize * 1.8)) {
						textRect.displayed = false;
					} else {
						// check overlap
						var overlapRect = textBoxCollides(textRect);

						if (overlapRect) {

							if (typeof strict != "undefined") {

								// do not try different positions again
								textRect.displayed = false;

							} else if (textRect.node.size <= overlapRect.node.size || overlapRect.mainNode) {

								// check if it still collides when swapping placement position
								var offSets = {
									x: textRect.offSets.x * -1,
									y: textRect.offSets.y * -1
								};

								var textRectRev = getTextRect(textRect.field, textRect.node, textRect.onHoverOnly, textRect.fontSize, offSets),
									overlapRectRev = textBoxCollides(textRectRev);

								if (overlapRectRev) {

									// note we could check what would happen if we swap back textRect and swap overlapRectRev's position
									// but that would impact all other labels that can potentially collide with overlapRecRev

									// check node importance, conditionally swap visibility of text
									if (overlapRectRev.node.size <= textRect.node.size && !overlapRectRev.mainNode) {
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

				if (textRect.displayed) {

					textRect.field.style.display = textRect.onHoverOnly ? 'none' : 'initial';
					textRect.field.setAttributeNS(null, "x", textRect.left);
					textRect.field.setAttributeNS(null, "y", textRect.top);
				} else {
					textRect.field.style.display = 'none';
				}

				return textRect;
			}

			function textAntiCollide() {
				for (var i = 0; i < textRects.length; i++) {
					var textRect = textRects[i];
					positionTextRect(textRect, true);
				}
			}

			function scaleTextRects() {

				var size = options.fontSize,
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

					// reposition, node has become smaller or larger (reversed scaling to scaling layer)
					// a text box might not belong to a main node (selected / current node) anymore
					// we need to reset it here because collision detection skips main nodes (always visible)
					var mainNode = textRect.mainNode;

					textRect = getTextRect(textRect.field, textRect.node, textRect.onHoverOnly, fontSize, textRect.offSets, mainNode, textRect.scaleStep || false);
					if (!isNaN(textRect.left) && !isNaN(textRect.top)) {
						textRect.field.setAttributeNS(null, "x", textRect.left);
						textRect.field.setAttributeNS(null, "y", textRect.top);
						textRects[i] = textRect;

						// matrix scale text backwards and translate position regarding origin
						textRect.field.setAttributeNS(null, 'transform', 'matrix(' + textRect.revScale + ' 0 0 ' + textRect.revScale + ' ' + textRect.revX + ' ' + textRect.revY + ')');
					}
				};

				// check collisions again, so if hidden ones can be displayed and vice versa
				textAntiCollide();
			}

			function showNodeName(quadid, node, elemClass, onHoverOnly, nodeOffSets, mainNode) {

				if (!options.showNodeNames) return;

				var elemid = instance + '-' + node.nodeid, textfield = null, textRect = null;

				if (node.name && node.name != settings.NULLnodeName) {

					textfield = document.getElementById(elemid);

					if (textfield == null) {
						// text size
						var size = options.fontSize,
							relatedFactor = options.relatedNodesFontSize / options.fontSize;

						if (typeof nodeOffSets != "undefined" && nodeOffSets !== false) size *= relatedFactor; // not a main node

						if (highlightednamescontainer == null) {
							return;
						}

						textfield = document.createElementNS(xmlns, "text");
						textfield.setAttributeNS(null, "id", elemid);
						textfield.setAttributeNS(null, "fill", rgbA(options.fontColor));
						textfield.setAttributeNS(null, "font-family", options.fontFamily);
						textfield.setAttributeNS(null, "font-size", size);

						textfield.setAttributeNS(null, "font-size", size);
						textfield.setAttributeNS(null, "data-nodeid", "");
						textfield.setAttributeNS(null, "data-name", node.name);

						highlightednamescontainer.appendChild(textfield);

						textRect = getTextRect(textfield, node, onHoverOnly, size, nodeOffSets, mainNode || false);
						textfield.setAttributeNS(null, "data-nodeid", node.nodeid);
						textfield.setAttributeNS(null, "data-quadid", quadid);

						textfield.setAttributeNS(null, "x", textRect.left);
						textfield.setAttributeNS(null, "y", textRect.top);

						textfield.setAttributeNS(null, 'transform', 'matrix(' + textRect.revScale + ' 0 0 ' + textRect.revScale + ' ' + textRect.revX + ' ' + textRect.revY + ')');

						// optionally let caller manipulate node name
						if (options.setNodeName) node.name = options.setNodeName(node);

						textfield.textContent = node.name;

						// anti collision for display / hide text
						textRect = positionTextRect(textRect);

						// remember the textRect's belonging to the node text labels
						textRects.push(textRect);
					}

					var fieldClassName = options.nodeTextClass + ' shingle-unselectable ' + options.clickableClass;
					if (node.nodeid == options.nodeId) {
						fieldClassName += ' ' + options.initialNodeTextClass;
					}
					if (elemClass) {
						fieldClassName += ' ' + elemClass;
					}
					fieldClassName += ' ' + communityClassName(node.community);
					textfield.setAttributeNS(null, "class", fieldClassName);
				}
				/*
							if(htmlOverlay.isActive()) {
								var nodeData = Object.assign({}, node);
								nodeData.text = textRect;
								htmlOverlay.addNode(nodeData);
							}
				*/
				return textRect;
			}

			function revScaleNode(nodEl, screenrect) {

				// when it cannot happen just return
				if (revScaleNodesJSStep < 0) return false;

				// only reverse scale when jsFactor < 1 (which is the scale to be applied)
				var s = zoomStepsNodeScales[currentScaleStep].jsFactor;

				if (s >= 1) return false;

				var x = nodEl.getAttributeNS(null, 'data-x'),
					y = nodEl.getAttributeNS(null, 'data-y'),
					r = nodEl.getAttributeNS(null, "data-radius");

				if (!x || !y || !r) return false;

				var rect = screenrect || containerWorldRect(),
					safety = mapinfo["averageQuadWidth"] / 2;

				// only if node itself also in viewport
				if (((x + r) < (rect[0] - safety)) || ((y + r) < (rect[1] - safety)) || ((x - r) > (rect[2] + safety)) || ((y - r) > (rect[3] + safety))) return;

				var revX = x - (s * x), revY = y - (s * y);

				nodEl.setAttributeNS(null, 'display', 'none');
				nodEl.setAttributeNS(null, 'transform', 'matrix(' + s + ' 0 0 ' + s + ' ' + revX + ' ' + revY + ')');
				nodEl.setAttributeNS(null, 'display', 'initial');

				revScaledNodes.push(nodEl);

				return true;
			}

			function revScaleQuadNodes(quadId, screenrect) {

				var quadDrawn = quadsDrawn[quadId];

				if (quadDrawn.nodes && quadDrawn.nodes.firstChild) {

					var children = quadDrawn.nodes.childNodes,
						rect = screenrect || containerWorldRect();

					for (var i = 0; i < children.length; i++) {
						var nodEl = children[i];
						revScaleNode(nodEl, rect);
					};
				}
			}

			function revScaleNodesInViewport() {

				// scale nodes JS when beyond max zoom / browser related min PX size
				if (revScaleNodesJSStep < 0) return;

				if (revScaledNodes.length > 0) {
					// reset
					for (var i = revScaledNodes.length - 1; i >= 0; i--) {
						var nodEl = revScaledNodes[i];
						if (nodEl) nodEl.setAttributeNS(null, 'transform', '');
						revScaledNodes.splice(i, 1);
					}
				}

				// only scale when above max zoom AND fixing PX due to min PX
				if (zoomStepsNodeScales[currentScaleStep].jsFactor >= 1) return;

				var screenrect = containerWorldRect();

				// scale nodes in visible quads
				for (var quadId in quadsDrawn) {

					if (!quadsDrawn.hasOwnProperty(quadId)) continue;

					var header = graphs[quadId].header;

					if (header != null) {
						if (quadIntersects(screenrect, header)) {
							revScaleQuadNodes(quadId, screenrect);
						}
					}
				}

				// scale highlighted nodes
				if (highlightednodescontainer && highlightednodescontainer.firstChild) {

					var children = highlightednodescontainer.childNodes;

					for (var i = 0; i < children.length; i++) {
						var nodEl = children[i];
						revScaleNode(nodEl, screenrect);
					};
				}
			}

			function ScheduledAppendQuad(quadid) {
				this.quadid = quadid;
				drawQ[quadid] = true;

				this.call = function () {

					if (graphs[quadid]) {

						appendSvgDOM(quadid);

						setTimeout(function () {
							delete drawQ[quadid];
							if (Object.keys(drawQ).length == 0) {
								if (options.onQuadsDrawn) {
									options.onQuadsDrawn();
								}
								showInitialNodeNames();
							}

							// fix first quad drawn this was incorrect !
							if (!firstQuadDrawn) {
								if (options.onFirstQuadDrawn) {
									options.onFirstQuadDrawn();
								}
								firstQuadDrawn = true;
							}
						}, 400);
					}

					return true;
				}
				return this;
			}


			function showInitialNodeNames() {
				if (options.initialNodeNames) {

					for (var community in initiallyHighlightedNodes) {
						if (initiallyHighlightedNodes.hasOwnProperty(community)) {
							var node = initiallyHighlightedNodes[community];
							if (!node.textRect) {
								if (options.showInitialNodeNames) {
									node.textRect = showNodeName(node.quadid, node, options.defaultNodeTextClass, false, false, false);
								} else {
									// only overlay
									node.textRect = {};
								}
								// note that a text box is created only once
								if (node.textRect) node.textRect.scaleStep = currentScaleStep;
								var nodeOverlay = null;
								if (htmlOverlay.isActive()) {
									var nodeData = Object.assign({}, node);
									nodeData.text = node.textRect;
									nodeOverlay = htmlOverlay.addNode(nodeData);
								}
								options.onInitialNodeName && options.onInitialNodeName(node.quadid, node.nodeid, node.name, nodeOverlay);
							}
						}
					}
				}
			}

			function showHideInitialNodeNames() {
				if (options.initialNodeNames) {
					for (var community in initiallyHighlightedNodes) {
						if (initiallyHighlightedNodes.hasOwnProperty(community)) {
							var node = initiallyHighlightedNodes[community];
							if (node.textfield) {
								if (node.scaleStep < currentScaleStep) {
									node.textfield.style.display = 'none';
								} else {
								}
							}
						}
					}
					initiallyHighlightedNodes = {};
				}
			}

			function makeLineElementEllipticalArc(x1, y1, x2, y2, community1, community2) {

				var line = document.createElementNS(xmlns, "path"),
					dx = x2 - x1, dy = y2 - y1,
					len = Math.sqrt(dx * dx + dy * dy),
					r = 2 * len,
					sweep = (dy < 0) ? "0" : "1",
					d = "M" + x1 + "," + y1 + " A" + r + "," + r + " 0 0 " + sweep + " " + x2 + "," + y2,
					edgeClass = options.edgeClass + ' ' + communityClassName(community1) + ' ' + communityClassName(community2);

				line.setAttributeNS(null, "d", "" + d);
				line.setAttributeNS(null, "fill", "none");
				line.setAttributeNS(null, "class", edgeClass);

				return line;
			}

			function makeLineElementStraight(x1, y1, x2, y2, community1, community2) {

				var line = document.createElementNS(xmlns, "line"),
					edgeClass = options.edgeClass + ' ' + communityClassName(community1) + ' ' + communityClassName(community2);

				line.setAttributeNS(null, "x1", "" + x1);
				line.setAttributeNS(null, "y1", "" + y1);
				line.setAttributeNS(null, "x2", "" + x2);
				line.setAttributeNS(null, "y2", "" + y2);
				line.setAttributeNS(null, "class", edgeClass);

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
				if (!node || !node.size) return 0;
				return nodeSizeRange(node.size);
			}

			function AsyncEdges(quadid, glin) {
				this.quadid = quadid;
				this.i = 0;

				this.call = function () {

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

						if ((!node1.name || node1.name == settings.NULLnodeName) && settings.hideNULLnameNodes) drawEdge = false;

						if (drawEdge) {
							pos = graphB["idmap"][graph["relations"][this.i].nodeidB];

							var node2 = graphB["nodes"][pos],
								x2 = graphB["nodes"][pos].x,
								y2 = graphB["nodes"][pos].y,
								line = makeLineElement(x1, y1, x2, y2, node1.community || 0, node2.community || 0);

							if ((!node2.name || node2.name == settings.NULLnodeName) && settings.hideNULLnameNodes) drawEdge = false;

							if (drawEdge) {
								line.id = this.quadid + "-edge-" + this.i;
								line.style.stroke = "" + edgeColor(node1, node2);
								line.setAttributeNS(null, "stroke-width", "1em");
								glin.appendChild(line);
							}
						}

						this.i = this.i + 1;
					}

					if (this.i >= nredges) linescontainer.appendChild(glin);
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

				if (node.name && (node.name != settings.NULLnodeName || !settings.hideNULLnameNodes)) {

					// base props
					var nodeClass = options.nodeClass + ' ' + communityClassName(node.community);

					circle.setAttributeNS(null, "class", nodeClass);
					circle.setAttributeNS(null, "id", id);
					circle.setAttributeNS(null, "data-quadid", quadid);
					circle.setAttributeNS(null, "data-name", node.name);
					circle.setAttributeNS(null, "data-nodeid", "" + node.nodeid);
					circle.setAttributeNS(null, "data-nodevalue", "" + node.size);
					circle.setAttributeNS(null, "data-radius", "" + nodeRadius);
					circle.setAttributeNS(null, "show-name-on-hover", textId);

					circle.setAttributeNS(null, "data-x", x);
					circle.setAttributeNS(null, "data-y", y);

					// dimensions
					circle.setAttributeNS(null, "cx", "" + x);
					circle.setAttributeNS(null, "cy", "" + y);
					circle.setAttributeNS(null, "r", "" + nodeRadius + "em");
					circle.setAttributeNS(null, "stroke", "" + nodeEdgeColor(node));
					circle.setAttributeNS(null, "stroke-width", "" + nEdgeWid);
					circle.setAttributeNS(null, "fill", color);
				}

				// scaling
				revScaleNode(circle);

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

				if (node.name && (node.name != settings.NULLnodeName || !settings.hideNULLnameNodes)) {

					// base props
					var nodeClass = options.nodeClass + ' ' + communityClassName(node.community);

					circle.setAttributeNS(null, "class", nodeClass);
					circle.setAttributeNS(null, "id", id);
					circle.setAttributeNS(null, "data-quadid", quadid);
					circle.setAttributeNS(null, "data-name", node.name);
					circle.setAttributeNS(null, "data-nodeid", "" + node.nodeid);
					circle.setAttributeNS(null, "data-nodevalue", "" + node.size);
					circle.setAttributeNS(null, "data-radius", "" + nodeRadius);
					circle.setAttributeNS(null, "show-name-on-hover", textId);
					circle.setAttributeNS(null, "data-x", x);
					circle.setAttributeNS(null, "data-y", y);


					// dimensions
					var x2 = x;
					if (options.useNonScalingStrokeForNodes && isFirefox()) {
						//
						// FF hack:  at large scale and rev scale of the line 'hack' circle the circle becomes and oval
						// this can be solved by truncing x2 at 4 decimals
						// funnny detail that this hack can produce the FF issue on chrome, so only use on FF
						//
						x2 = Math.floor(x * 10000) / 10000;
					}

					circle.setAttributeNS(null, "x1", "" + x);
					circle.setAttributeNS(null, "y1", "" + y);
					circle.setAttributeNS(null, "x2", "" + x2);
					circle.setAttributeNS(null, "y2", "" + y);
					circle.setAttributeNS(null, "stroke-linecap", "round");
					// note we set the radius using the stroke-width and the fill using the stroke..
					circle.setAttributeNS(null, "stroke-width", "" + (nodeRadius * 2) + "em");
					circle.setAttributeNS(null, "stroke", color);

					if (nEdgeWid > 0) {
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
						circle.setAttributeNS(null, "data-radius", "" + nodeRadius);
						circle.setAttributeNS(null, "show-name-on-hover", textId);
						circle.setAttributeNS(null, "data-x", x2);
						circle.setAttributeNS(null, "data-y", y);
						circle.appendChild(circle2);
						circle.appendChild(circle1);
					}

					// reverse scaling
					revScaleNode(circle);
				}

				return circle;
			}

			// because firefox does not always repaint circle css correctly we use a line 'hack' by default
			var useCircleEl = false,
				circleTag = useCircleEl ? "circle" : "line",
				MakeNodeElement = useCircleEl ? MakeNodeElementUsingCircle : MakeNodeElementUsingLine;

			function addNodeEvents(container) {

				container.addEventListener('mousedown', function (e) {

					var node = e.target;
					if (node) {
						e.cancelBubble = true;

						var name = node.getAttribute('data-name');
						if (name && (name != settings.NULLnodeName || settings.enableNULLnameNodes)) {
							var nodeId = node.getAttribute('data-nodeid'),
								quadId = node.getAttribute('data-quadid');

							showInfoAbout(quadId, nodeId);
							options.onNodeClick && options.onNodeClick(quadId, nodeId, currentScaleStep);
						}
					}
				});
				container.addEventListener('mouseup', function (e) {
					var node = e.target;
					if (node) e.cancelBubble = true;
				});

				var hoverAction = false;

				container.addEventListener('mouseover', function (e) {

					e.cancelBubble = true;
					var node = e.target;

					if (node) {
						if (node.tagName == circleTag || (node.tagName == 'g' && node.getAttributeNS(null, "class") == circleTag)) {

							var quadId = node.getAttribute('data-quadid'),
								nodeId = node.getAttribute('data-nodeid'),
								name = node.getAttribute('data-name');

							hoverAction && clearTimeout(hoverAction);
							hoverAction = setTimeout(function () {
								hoverIn(quadId, nodeId, name);
								hoverAction = false;
							}, options.hoverDelay);
						}
					}
				});
				container.addEventListener('mouseout', function (e) {

					var node = e.target;

					if (node) {

						if (node.tagName == circleTag || (node.tagName == 'g' && node.getAttributeNS(null, "class") == circleTag)) {

							if (!hoverAction) {
								hoverOut();
							} else {
								clearTimeout(hoverAction);
								hoverAction = false;
							}
						}
					}
				});

				if ('ontouchstart' in document.documentElement) {
					container.addEventListener('touchstart', function (evt) {
						var e = evt.changedTouches[0],
							node = e.target;
						if (node) {
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
						if (node) {
							evt.preventDefault();
							evt.cancelBubble = true;
						}
					});

					container.addEventListener('touchend', function (evt) {
						var e = evt.changedTouches[0],
							node = e.target;
						if (node) {
							evt.preventDefault();
							evt.cancelBubble = true;
						}
					});
				}
			}

			function addTextEvents(container) {
				container.addEventListener('mousedown', function (e) {

					var text = e.target;
					if (text) {
						e.cancelBubble = true;
						var name = text.getAttribute('data-name');

						if (name) {
							var nodeId = text.getAttribute('data-nodeid'),
								quadId = text.getAttribute('data-quadid');

							showInfoAbout(quadId, nodeId);
							options.onNodeClick && options.onNodeClick(quadId, nodeId, currentScaleStep);
						}
					}
				});
				container.addEventListener('mouseup', function (e) {
					var text = e.target;

					if (text) e.cancelBubble = true;
				});

				var hoverAction = false;

				container.addEventListener('mouseover', function (e) {

					var text = e.target;
					if (text) {
						e.cancelBubble = true;

						var name = text.getAttribute('data-name');

						if (name) {
							var nodeId = text.getAttribute('data-nodeid'),
								quadId = text.getAttribute('data-quadid');

							hoverAction && clearTimeout(hoverAction);
							hoverAction = setTimeout(function () {
								hoverIn(quadId, nodeId, name);
								hoverAction = false;
							}, options.hoverDelay);
						}
					}
				});
				container.addEventListener('mouseleave', function (e) {
					var text = e.target;
					if (text) {
						if (!hoverAction) {
							hoverOut();
						} else {
							clearTimeout(hoverAction);
							hoverAction = false;
						}
					}
				});

				if ('ontouchstart' in document.documentElement) {
					container.addEventListener('touchstart', function (evt) {
						var e = evt.changedTouches[0],
							text = e.target;
						if (text) {
							var quadId = text.getAttribute('data-quadid'),
								nodeId = text.getAttribute('data-nodeid');

							showInfoAbout(quadId, nodeId);
							evt.preventDefault();
							evt.cancelBubble = true;
							options.onNodeClick && options.onNodeClick(quadId, nodeId, currentScaleStep);
						}
					});

					container.addEventListener('touchmove', function (evt) {
						var e = evt.changedTouches[0],
							text = e.target;
						if (text) {
							evt.preventDefault();
							evt.cancelBubble = true;
						}
					});

					container.addEventListener('touchend', function (evt) {
						var e = evt.changedTouches[0],
							text = e.target;
						if (text) {
							evt.preventDefault();
							evt.cancelBubble = true;
						}
					});
				}
			}

			function appendSvgDOM(quadid) {

				if (!graphs[quadid] || !graphs[quadid]["nodes"]) return;
				if (drawnQuad(quadid)) return;

				var graph = graphs[quadid];

				if (graph == null) {
					return;
				}

				graph.els = graph.els || { glin: null, gnod: null };

				var glin;

				if (graph.els.glin == null) {
					// lines container for quad
					glin = document.createElementNS(xmlns, "g");
					graph.els.glin = glin;

					// EDGES
					glin.setAttributeNS(null, "class", options.quadClass);
					glin.setAttributeNS(null, "id", quadid);

					scheduler.addTask(new AsyncEdges(quadid, glin));

				} else {

					glin = graph.els.glin;
					setTimeout(function () {
						linescontainer.appendChild(glin);
					}, 10);
				}

				quadsDrawn[quadid] = {
					lines: glin
				};

				// NODES
				// nodes container for quad
				var gnod, revScaleCached = false;

				if (graph.els.gnod == null) {
					gnod = document.createElementNS(xmlns, "g");
					graph.els.gnod = gnod;
					gnod.setAttributeNS(null, "class", options.quadClass);
					gnod.setAttributeNS(null, "id", quadid);

					for (var i = 0; i < graph["nodes"].length; i++) {

						var node = graph["nodes"][i];
						node.quadid = quadid;

						var circle = MakeNodeElement(quadid, node, nodemodeGraph);
						gnod.appendChild(circle);

						var zoomCorr = (currentScaleStep / zoomSteps.length),
							curInitialNodeNameNodeMinSize = Math.max(options.initialNodeNameNodeMinSize * zoomCorr, 0);

						if (options.initialNodeNames && node.size > curInitialNodeNameNodeMinSize) {
							var idx = node.community + "";
							if (!initiallyHighlightedNodes[idx] || initiallyHighlightedNodes[idx].size < node.size) {
								initiallyHighlightedNodes[idx] = node;
							}
						}
					}

					if (options.selectNodes) {
						addNodeEvents(gnod);
					}
				} else {
					gnod = graph.els.gnod;
					revScaleCached = (revScaleNodesJSStep >= 0 && zoomStepsNodeScales[currentScaleStep].jsFactor < 1);
				}

				if (highlightednodescontainer != null) {
					if (highlightednodescontainer.firstChild == null) {
						var lookup = graph["idmap"][currentnodeid];
						if (typeof lookup != "undefined") {
							showInfoAbout(quadid, currentnodeid);
						}
					}
				}

				if (quadsDrawn[quadid]) quadsDrawn[quadid].nodes = gnod;
				if (revScaleCached) {
					// revscale nodes that were create earlier and cached
					revScaleQuadNodes(quadid, containerWorldRect(), gnod);
				}

				nodescontainer.appendChild(gnod);

				// DEBUG
				if (options.debugQuads && graph["header"]) {

					var quadStroke = 'black',
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

					if (!(quadid.endsWith('_')) && quadLevel < 5) {
						parentQuadid = quadid.slice(0, -1);

						var parentGraph = graphs[parentQuadid];
						if (parentGraph && parentGraph["header"]) {
							if (parentGraph["header"]["ymin"] < graph["header"]["ymin"]) {
								textYindent = 1 + quadLevel * pixelWidth / 3;
							}
						} else {
							textYindent = 1;
						}
					}

					// alternating colors for quads
					if (graph.shingleIndex > -1) {
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
					textfield.addEventListener('mouseenter', function () {
						rect.setAttributeNS(null, "stroke-width", 3);
						gnod.setAttributeNS(null, "class", options.debugQuadClass);
						glin.setAttributeNS(null, "class", options.debugQuadClass);
					});
					textfield.addEventListener('mouseleave', function () {
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

				setTimeout(function () {
					setBoundingrectDims();
					finished && finished();
					repositionMarkers();
				}, scaleTimeout || 10);
			}

			function setSvgTranslations() {
				translationEl.setAttribute('transform', 'translate(' + currentTranslateX + ' ' + currentTranslateY + ')');
				setBoundingrectDims();
				repositionMarkers();
			}

			function doscale(e, done) {
				var value = parseInt(e.target.value);
				prevScaleStep = currentScaleStep;
				scaleTo(value, done || false);
			}

			function doscaleFinish(e) {
				doscale(e, function () {
					findQuadsToDraw();
					findQuadsToRemove();
				});
			}

			function scheduleScaleTo(toLevel, delay, done) {
				var level = toLevel;
				if (level < 0) {
					level = 0;
				}
				if (level > zoomSteps.length - 1) {
					level = zoomSteps.length - 1;
				}
				clearTimeout(execScale);
				execScale = setTimeout(function () {
					// uniform scale function for use with wheel, slider, api's
					var onZoomFn = (prevScaleStep > level) ? 'onZoomIn' : 'onZoomOut';

					// clear scaling step by class dyn css
					mfrmap.classList.remove('i' + instance + '-zoom-level-' + prevScaleStep);

					currentScaleStep = level;
					currentScale = zoomSteps[level];

					// set new scaling step by class dyn css
					mfrmap.classList.add('i' + instance + '-zoom-level-' + currentScaleStep);

					zoom.value = level;
					updateBitmapStyles('scale');
					onZoomFn && options[onZoomFn] && options[onZoomFn](level);
					setSvgScales(done);
				}, delay);
			}

			function scaleTo(level, done) {
				scheduleScaleTo(level, 20, done);
			}

			var prevScaleStep;

			function doZoom(step) {

				// notice the zoom function works in reverse in shingle ..
				prevScaleStep = currentScaleStep;
				currentScaleStep += step;
				if (currentScaleStep < 0) {
					currentScaleStep = 0;
				}
				if (currentScaleStep > zoomSteps.length - 1) {
					currentScaleStep = zoomSteps.length - 1;
				}
				if (prevScaleStep != currentScaleStep) {
					scaleTo(currentScaleStep, function () {
						findQuadsToRemove();
						findQuadsToDraw();
					});
				}
			}

			function zoomIn() {
				renderBase(function () {
					doZoom(-1 * sliderZoomStep);
				}, true);
			}

			function zoomOut() {
				renderBase(function () {
					doZoom(sliderZoomStep);
				}, true);
			}

			function zoomReset() {
				renderBase(function () {
					options.onZoomReset && options.onZoomReset();
					currentScaleStep = startScaleStep;
					scaleTo(currentScaleStep, function () {
						findQuadsToRemove();
						findQuadsToDraw();
					});
				}, true);
			}

			function HighlightedNode() {

				this.currentHighlightedId = null;
				this.currentHighlightedIdHighlighted = null;
				this.currentHighlightedOverlay = null;

				this.ishighlighted = function () {
					return (this.currentHighlightedId != null);
				}

				this.unhighlight = function () {

					if (this.currentHighlightedId != null) {

						// unhighight the node
						var circle = document.getElementById(this.currentHighlightedId);
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
					this.currentHighlightedOverlay = htmlOverlay.isActive() ? getOrCreateNodeOverlay(quadid, nodeid) : null;
				};

				this.highlight = function () {

					var circle = document.getElementById(this.currentHighlightedId);

					// highight the node
					if (circle) {
						//					circle.classList.add(options.highlightedNodeClass);
					}

					// highight the highlighted node (highlighted nodes layer)
					circle = document.getElementById(this.currentHighlightedIdHighlighted);
					if (circle) {
						var textid = circle.getAttributeNS(null, 'show-name-on-hover');
						if (textid && textid != "false") {
							document.getElementById(textid).style.display = "initial";
						}
						//					circle.classList.add(options.highlightedNodeClass);
					}
				};

				return this;
			}

			function getNodesData(quadid, nodeid) {
				var graph = graphs[quadid],
					data = null;

				if (graph) {
					var index = graph["idmap"][nodeid];
					if (typeof index != "undefined") data = graph["nodes"][index];
				}
				return data;
			}

			function triggerClear() {
				options.onClear && options.onClear();
				clearNodeNames();
			}

			function changehighlightTo(quadid, nodeid) {
				renderBase(function () {
					showInfoAbout(quadid, nodeid);
					repositionMarkers();

					if (!quadid || !nodeid) return;

					var graph = graphs[quadid];

					if (graph) {
						var index = graph["idmap"][nodeid];
						var node = graph["nodes"][index];

						if (node) {
							// bounding rect only change on pan, zoom and external move (focusIn)
							setBoundingrectDims();

							var rect = containerWorldRect();
							if (node.x < (rect[0] * 0.88) ||
								node.y < (rect[1] * 0.88) ||
								node.x > (rect[2] * 0.88) ||
								node.y > (rect[3]) * 0.88) {
								currentTranslateX = -node.x;
								currentTranslateY = -node.y;

								setSvgTranslations();
								findQuadsToDraw();
								findQuadsToRemove();
							}
						}
					}
				}, true);
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

				this.cancel = function () {
					self.cancelFlag = true;
				};

				this.cancelled = function () {
					return self.cancelFlag;
				};

				this.findNodeFrom = function () {

					if (this.nodeFrom) return;

					if (highlightedlinescontainer == null) {
						return;
					}

					if (highlightednodescontainer == null) {
						return;
					}

					var graph = graphs[this.quadid];

					if (graph == null) {
						if (!this.loadingQuad) {
							this.loadingQuad = true;
							loadQuad(quadid);
						}
						return;
					}

					this.nodeFrom = {
						graph: null,
						node: null
					};

					var node1 = null;
					var nodeIndex;

					nodeIndex = graph["idmap"][this.nodeid];

					node1 = graph["nodes"][nodeIndex];

					if (node1) {
						this.nodeFrom.graph = graph;
						this.nodeFrom.node = node1;

						// draw the selected node ?
						if (highlightednodescontainer != null && node1 != null) {

							// clear and show main node name, only at first cycle !
							if (this.j < 100) {

								var circle = MakeNodeElement(this.quadid, node1, nodemodeCentered);
								highlightednodescontainer.appendChild(circle);

								clearNodeNames();
								var textRect = null,
									nodeOverlay = null;

								if (options.showMainNodeNames) {
									textRect = showNodeName(this.quadid, node1, options.highlightedNodeTextClass);
								}

								if (htmlOverlay.isActive()) {
									var nodeData = Object.assign({}, node1);
									nodeData.text = textRect;
									nodeData.mode = nodemodeCentered;
									nodeOverlay = htmlOverlay.addNode(nodeData);
								}

								//BUG #2 also here the node is sometimes not present in getNodesData, failing the onFocus
								options.onFocus && options.onFocus(quadid, nodeid, node1, nodeOverlay, nodeHistory.previous());
							}
						}
					}
				};

				this.createEdge = function (quadid, node1, node2) {

					var x1 = node1.x, y1 = node1.y,
						x2 = node2.x, y2 = node2.y,
						line = makeLineElement(x1, y1, x2, y2, node1.community || 0, node2.community || 0);

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
						if (options.showRelatedNodeNames !== false) {
							var offSets = {
								x: (x2 < x1) ? -1 : 1,
								y: (y2 < y1) ? -1 : 1,
								d: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
							}

							var textRect = showNodeName(quadid, node2, options.highlightedNodeTextClass, showNameOnHover, offSets);

							if (htmlOverlay.isActive()) {
								var nodeData = Object.assign({}, node2);
								nodeData.text = textRect;
								nodeData.mode = nodemodeCentered;
								nodeData.quadid = quadid;
								htmlOverlay.addNode(nodeData);
							}
						}
					}
				};

				this.drawRelatedEdge = function (fromNode, toNode) {

					var node2 = null,
						graphB = graphs[toNode.quad],
						tries = 0,
						drawEdge = function () {
							node2 = graphB["nodes"][graphB["idmap"][toNode.node]];

							if (fromNode != null && node2 != null) {

								// visualize edge between 2 highlighted nodes
								if (!self.relatedDrawn[node2.nodeid]) {
									self.relatedDrawn[node2.nodeid] = true;
									self.createEdge(toNode.quad, fromNode, node2);
									if (node2.name && node2.name != settings.NULLnodeName) {
										// callbacks for related nodes only when on map
										var nodeData = getNodesData(toNode.quad, node2.nodeid),
											nodeOverlay = htmlOverlay.isActive() ? htmlOverlay.getNode(node2.nodeid) : null;

										options.onFocusRelatedNode && options.onFocusRelatedNode(toNode.quad, node2.nodeid, nodeData, nodeOverlay);
									}
								}
							}
						};

					if (!graphB) {

						loadQuad(toNode.quad);
						if (!quadsWithHighlightedNodes[toNode.quad]) {
							quadsWithHighlightedNodes[toNode.quad] = 1;
						}

						var quadWatcher = setInterval(function () {
							if (self.cancelled()) {
								clearInterval(quadWatcher);
							} else {
								graphB = graphs[toNode.quad];
								if (graphB) {
									clearInterval(quadWatcher);
									drawEdge();
								} else {
									if (++tries > 99) clearInterval(quadWatcher);
								}
							}
						}, 200);
					} else {
						drawEdge();
					}
				};

				this.findRelationsUsingMap = function () {

					if (++this.j > 100) return true;

					this.findNodeFrom();

					if (this.nodeFrom) {

						if (!this.nodeFrom.graph || !this.nodeFrom.node || !this.nodeFrom.node.nodeid) {
							return true;
						}

						var drawRelatedEdges = function (quadid) {

							var url = options.graphPath + 'findRelations' +
								'?quadid=' + quadid +
								'&nodeid=' + self.nodeFrom.node.nodeid;

							ajaxGet(url, function (response) {
								if (response) {
									var relations = JSON.parse(response);

									if (relations && relations.toNodes && relations.toNodes.length) {
										for (var i = 0; i < relations.toNodes.length; i++) {
											if (self.cancelled()) break;
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

					if (this.nodeFrom) {

						if (!this.nodeFrom.graph) {
							return true;
						}

						var graph = this.nodeFrom.graph,
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
					infoDisplayAction = setTimeout(function () {
						if (!(nodeInfo.parentNode === options.el)) {
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

				if (options.containerWithFocusClass) {
					options.el.classList.add(options.containerWithFocusClass);
				}

				syncInfoDisplay(true);

				if (quadLevels) {
					loadNonCompactQuad(quadid, true);
				}

				last_async_showmfrinfo = new async_showmfrinfo(quadid, nodeid);
				highlightScheduler.addTask(last_async_showmfrinfo);
			}

			function setRectMainNode(nodeid, main) {

				// set the corresponding textRect to main
				var i = textRects.length;
				while (i--) {
					var textRect = textRects[i];
					if (textRect.node && textRect.node.nodeid == nodeid) {
						textRect.mainNode = main;
						break;
					}
				}
			}

			function removeInfoAbout() {

				if (currentHighlightedNode.ishighlighted()) {

					if (last_async_showmfrinfo != null) {
						last_async_showmfrinfo.j = 1000000;
						last_async_showmfrinfo.cancel();
					}

					if (currentnodeid) setRectMainNode(currentnodeid, false);

					currentnodeid = null;
					svg.classList.remove('with-focus');

					currentHighlightedNode.unhighlight();
					//
					// this has weird effects when deselecting a node and surrounding nodes and edges just dissapear
					// disable for now and look into later
					//				forgetHighlightedNodesLoaded();

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
				if (!quadid || !nodeid) return;

				svg.classList.add('with-focus')
				currentHighlightedNode.sethighlighted(quadid, nodeid);
				currentnodeid = nodeid;
				nodeHistory.push(currentnodeid);

				setRectMainNode(currentnodeid, true);

				currentHighlightedNode.highlight();
				showmfrinfo(quadid, nodeid);

				addMarker(quadid, nodeid);
			}

			function getOrCreateNodeOverlay(quadid, nodeid) {
				var nodeOverlay = htmlOverlay.getNode(nodeid);
				if (!nodeOverlay) {
					var nodeData = getNodesData(quadid, nodeid);
					nodeOverlay = htmlOverlay.addNode(nodeData);
				}
				return nodeOverlay;
			}

			function hoverIn(quadid, nodeid, name) {
				renderBase(function () {
					currentHighlightedNode.unhighlight();
					currentHighlightedNode.sethighlighted(quadid, nodeid);
					options.onHoverIn && options.onHoverIn(quadid, nodeid, name, currentHighlightedNode.currentHighlightedOverlay);
					currentHighlightedNode.highlight();
				}, true);
			}

			function hoverOut() {
				renderBase(function () {
					options.onHoverOut && options.onHoverOut(currentHighlightedNode.currentHighlightedOverlay);
					currentHighlightedNode.unhighlight();
				}, true);
			}

			function setMarkerOffsets(offSets) {
				options.markerOffsets = offSets;
				mapLoaded(function () {
					repositionMarkers();
				});
			}

			function setMarkerCoverAreas(areas) {
				mapLoaded(function () {
					// filter out areas contained by other areas
					// or out of the viewport
					var screenRect = getMapRect(),
						screenWidth = screenRect.right - screenRect.left,
						screenHeight = screenRect.bottom - screenRect.top;

					// out of viewport, otherwise set margins
					for (var i = areas.length - 1; i >= 0; i--) {

						if (areas[i].right <= screenRect.left ||
							areas[i].left >= screenRect.right ||
							areas[i].bottom <= screenRect.top ||
							areas[i].top >= screenRect.bottom) {
							areas.splice(i, 1);
						} else {
							areas[i].margins = {
								top: Math.max(screenRect.top - areas[i].top, 0),
								right: Math.max(screenRect.right - areas[i].right, 0),
								bottom: Math.max(screenRect.bottom - areas[i].bottom, 0),
								left: Math.max(screenRect.left - areas[i].left, 0)
							}
						}
					}

					// covered by other areas
					for (var i = areas.length - 1; i >= 0; i--) {
						for (var j = areas.length - 1; j >= 0; j--) {
							if (i != j) {
								if (areas[i].top >= areas[j].top &&
									areas[i].left >= areas[j].left &&
									areas[i].bottom <= areas[j].bottom &&
									areas[i].right <= areas[j].right) {
									areas[i].ignore = true;
								}
							}
						};
					};
					for (var i = areas.length - 1; i >= 0; i--) {
						if (areas[i].ignore) areas.splice(i, 1);
					}

					options.markerCoverAreas = areas;
					repositionMarkers();
				});
			}

			function repositionMarkers() {

				if (options.staticMap) return;

				clearTimeout(doRepositionMarkers);

				doRepositionMarkers = setTimeout(function () {

					var screenRect = getMapRect();
					var worldRect = containerWorldRect();

					var screenWidth = screenRect.right - screenRect.left;
					var screenHeight = screenRect.bottom - screenRect.top;

					var worldWidth = worldRect[2] - worldRect[0];
					var worldHeight = worldRect[3] - worldRect[1];

					var markers = document.getElementsByClassName(options.markerClass);

					var offSets = options.markerOffsets || {};
					offSets.top = offSets.top || 0;
					offSets.right = offSets.right || 0;
					offSets.bottom = offSets.bottom || 0;
					offSets.left = offSets.left || 0;

					// first the offsets
					Array.prototype.forEach.call(markers, function (markerEl) {

						var x = markerEl.getAttribute('data-x');
						var y = markerEl.getAttribute('data-y');

						// map to screen pixels
						x -= worldRect[0];
						y -= worldRect[1];
						x /= worldWidth;
						y /= worldHeight;
						x *= screenWidth;
						y *= screenHeight;

						var out = false;

						// out of viewport ?
						if (x < offSets.left) {
							x = offSets.left;
							out = true;
						}
						if (y < offSets.top) {
							y = offSets.top;
							out = true;
						}

						// note we need to temporary display out of view to get the offset dimensions
						markerEl.style.display = "inherit";
						markerEl.style.left = "-10000px";
						markerEl.style.top = "-10000px";

						if (x > screenWidth - (markerEl.offsetWidth / 2) - offSets.right) {
							x = screenWidth - markerEl.offsetWidth - offSets.right;
							out = true;
						}
						if (y > screenHeight - (markerEl.offsetHeight / 2) - offSets.bottom) {
							y = screenHeight - markerEl.offsetHeight - offSets.bottom;
							if (options.markerOffsets && options.markerOffsets.bottom) y -= options.markerOffsets.bottom;
							out = true;
						}

						markerEl.style.left = x + "px";
						markerEl.style.top = y + "px";

						// check the covered areas
						if (options.markerCoverAreas.length) {

							var markerRect = {
								top: y,
								right: x + markerEl.offsetWidth,
								bottom: y + markerEl.offsetHeight,
								left: x
							}

							Array.prototype.forEach.call(options.markerCoverAreas, function (coverArea) {

								// covered ?
								var covered = !(coverArea.right < markerRect.left ||
									coverArea.left > markerRect.right ||
									coverArea.bottom < markerRect.top ||
									coverArea.top > markerRect.bottom);

								// only display when covered by area(s)
								if (covered) {

									// find side closest to marker with
									// enough space to display marker
									var margins = [
										{ pos: 'top', val: Math.abs(coverArea.top - markerRect.top), fix: 'y', space: markerEl.offsetHeight },
										{ pos: 'right', val: Math.abs(coverArea.right - markerRect.right), fix: 'x', space: markerEl.offsetWidth },
										{ pos: 'bottom', val: Math.abs(coverArea.bottom - markerRect.bottom), fix: 'y', space: markerEl.offsetHeight },
										{ pos: 'left', val: Math.abs(coverArea.left - markerRect.left), fix: 'x', space: markerEl.offsetWidth }
									], useMargin = false;

									margins.sort(function (a, b) {
										return b.val - a.val;
									});

									for (var i = margins.length - 1; i >= 0; i--) {
										if (coverArea.margins[margins[i].pos] >= margins[i].space) {
											useMargin = i;
											break;
										}
									};

									if (useMargin) {
										if (margins[useMargin].fix == 'x') {
											x = coverArea[margins[useMargin].pos];
										} else {
											y = coverArea[margins[useMargin].pos];
										}
									}

									out = true;
									markerEl.style.left = x + "px";
									markerEl.style.top = y + "px";
								}
							});
						}

						// only display when out of viewport or covered
						if (!out) {
							markerEl.style.display = "none";
						}
						else {
							markerEl.style.display = "inherit";
						}
					});
				}, 200);
			}

			function removeMarker(nodeid) {
				if (markerIdx[nodeid]) {
					var marker = markerIdx[nodeid];
					if (marker.parentNode) markercontainer.removeChild(markerIdx[nodeid]);
				}
			}

			function addMarker(quadid, nodeid) {

				if (options.useMarkers && !visitedNodes[nodeid]) {

					var node = getNodesData(quadid, nodeid);

					var markers = document.getElementsByClassName(options.markerClass);
					Array.prototype.forEach.call(markers, function (e) {
						if (e.getAttributeNS(null, 'data-nodeid') != currentnodeid) {
							return;
						}
					});

					visitedNodes.push(nodeid);

					var marker = document.createElement("span");
					marker.setAttribute("class", options.markerClass + " markertype-visited");
					marker.setAttribute("font-family", options.fontFamily);
					marker.setAttribute("font-size", Math.round(options.fontSize * .77));
					marker.style.position = "absolute";
					marker.style.display = "none";
					marker.addEventListener('click', function () {
						changehighlightTo(quadid, nodeid);
					});
					markercontainer.appendChild(marker);

					marker.setAttribute('data-nodeid', nodeid);
					marker.innerHTML = node.name;
					marker.setAttribute("data-x", node.x);
					marker.setAttribute("data-y", node.y);
					markerIdx[nodeid] = marker;
					repositionMarkers();

					// remove the first marker if max exceeded
					if (visitedNodes.length > options.maxNrMarkers) {
						// remove the oldest added visitednode / marker
						// do not remove the initial nodeid if specified nor initially higlighted
						if (options.nodeId && options.nodeId == visitedNodes[0]) {
							visitedNodes.push(options.nodeId)
						} else if (persistentNodeMarkers.length && persistentNodeMarkers.indexOf(visitedNodes[0]) > -1) {
							visitedNodes.push(visitedNodes[0]);
						} else {
							removeMarker(visitedNodes[0]);
						}
						visitedNodes.shift();
					}
				}
			}

			function init() {

				var shinglecontainer = options.el;
				if (!shinglecontainer) return;

				initDefaults();

				if (!options.graphPath) return;
				if (!options.useBitmap && options.showBitmapOnly) return;

				setBoundingrectDims = options.calcBoundingRectDimsMethodExperimental ? setBoundingrectDimsExperimental : setBoundingrectDimsDefault;

				scheduler = new Scheduler(schedulerStep);
				highlightScheduler = new Scheduler(highlightschedulerStep)
				currentHighlightedNode = new HighlightedNode();

				mfrmap = document.createElement("div");
				shinglecontainer.appendChild(mfrmap);


				if (options.useMarkers) {
					markercontainer = document.createElement("div");
					markercontainer.setAttribute("class", options.markercontainerClass);

					markercontainer.setAttribute("position", "absolute");
					markercontainer.setAttribute("x", "0");
					markercontainer.setAttribute("y", "0");

					markercontainer.style.width = options.width;
					markercontainer.style.height = options.height;

					shinglecontainer.appendChild(markercontainer);
				}

				// activate overlay if used
				if (options.useHtmlOverlays) {
					shinglecontainer.appendChild(htmlOverlay.activate());
				}

				zoom = document.createElement("input");

				if (!options.zoomSlider) zoom.style.display = "none";

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
						options.nodeId = request[options.nodeField];
					}
					if (request["debug"]) {
						options.debug = true;
					}
					if (request["debugquads"]) {
						options.debugQuads = true;
					}
				}

				loadMapInfo(options.nodeId);

				// the map rect only needs to be determined initial and on resize
				window.addEventListener("resize", function () {
					setMapRect();
					// also reposition the markers
					repositionMarkers();
				});

				if (!options.staticMap && !options.showBitmapOnly) {
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
			}

			if (options.el) {
				init();
			}

			return {
				hoverIn: hoverIn,
				hoverOut: hoverOut,
				changehighlightTo: changehighlightTo,
				zoomIn: zoomIn,
				zoomOut: zoomOut,
				zoomReset: zoomReset,
				setSelection: setSelection,
				currentNodeId: function () { return currentnodeid; },
				setMarkerOffsets: setMarkerOffsets,
				setMarkerCoverAreas: setMarkerCoverAreas,
				showCommunity: showCommunity,
				hideCommunity: hideCommunity
			};

		}, newGraph = function (settings) {
			return new graph(settings, instances++);
		}

	return {
		new: newGraph
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