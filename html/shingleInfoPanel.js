/*
	example component to show details in info panel in graph, based on the callbacks in settings
 */
function shingleInfoPanel(settings) {
	var self = this,
		options = settings || {};

	this.el = document.createElement('span');
	this.el.className = "shingle-info";

	var mainNode = document.createElement("div");
	mainNode.className = "shingle-info-main-node";
	this.el.appendChild(mainNode);

	var relatedNodes = document.createElement("div");
	relatedNodes.className = "shingle-info-related-nodes";
	this.el.appendChild(relatedNodes);

	var nodePages = document.createElement("div");
	nodePages.className = "shingle-info-node-pages";
	this.el.appendChild(nodePages);

	var edgeInfo = document.createElement("div");
	edgeInfo.setAttribute("id", "shingle-edge-info");
	this.el.appendChild(edgeInfo);

	this.mainNode = null;
	this.list = [];
	this.nodeInfoEls = {};
	this.nrpages = 0;
	this.currentpage = 0;
	this.currentNode = false;

	this.showLength = 12;
	this.showNrPages = 5;

	this.clear = function () {

		this.mainNode = null;
		this.list = [];
		this.nodeInfoEls = {};
		this.nrpages = 0;
		this.currentpage = 0;

		mainNode.innerHTML = "";
		relatedNodes.innerHTML = "";
		nodePages.innerHTML = "";
		edgeInfo.innerHTML = "";
	};

	this.hoverIn = function () { };
	this.onHover = function (callback) {
		this.hoverIn = callback;
	};
	this.changehighlightTo = function () { };
	this.onClick = function (callback) {
		this.changehighlightTo = callback;
	};

	this.setMainNode = function (quadid, nodeid, data) {
		this.mainNode = [quadid, nodeid];

		if (data) {
			var name = data.name;

			var moreOnNode = ''; //GetMoreOnNode(nodeid);

			mainNode.innerHTML = "<span class=\"shingle-info-node\" id=\"node-" + nodeid + "\" data-nodeid=\"" + nodeid + "\" data-quadid-=\"" + quadid + "\" >" + name + "</span> " + nodeid + "<br>" + moreOnNode + "<hr>";
			var mainNodeEl = mainNode.getElementsByClassName('shingle-info-node');
			self.nodeInfoEls[nodeid] = mainNodeEl[0];

			var relatedEls = mainNode.getElementsByClassName('shingle-info-node');
			if (relatedEls.length) {
				var relatedEl = relatedEls[0];
				relatedEl.addEventListener('mouseover', function () {
					self.hoverIn(quadid, nodeid);
				});

				relatedEl.addEventListener('click', function () {
					self.changehighlightTo(quadid, nodeid);
				});
			}
		}
	};

	this.appendRelatedNode = function (quadid, nodeid, data) {
		this.list.push([quadid, nodeid, data]);
		if (this.list.length < this.showLength + 1) {
			this.shownodes();
		} else {
			this.nrpages = Math.floor((this.list.length + this.showLength - 1) / this.showLength);
			if (this.nrpages <= this.showNrPages) {
				this.showpages();
			}
		}
	};

	this.switchtopage = function (page) {
		if (page != this.currentpage) {
			this.currentpage = page;
			this.shownodes();
			this.showpages();
		}
	};

	this.shownodes = function () {
		var i, startindex = this.currentpage * this.showLength, endindex = (this.currentpage + 1) * this.showLength;

		if (endindex > this.list.length) {
			endindex = this.list.length;
		}

		relatedNodes.innerHTML = '';
		for (i = startindex; i < endindex; i++) {
			var quadid = this.list[i][0],
				nodeid = this.list[i][1],
				data = this.list[i][2],
				relatedNodeEl = document.createElement('span');

			relatedNodeEl.className = 'shingle-info-node';
			relatedNodeEl.setAttribute('id', "node-" + nodeid);
			relatedNodeEl.setAttribute('data-nodeid', nodeid);
			relatedNodeEl.setAttribute('data-quadid', quadid);
			relatedNodeEl.innerHTML = data.name;
			self.nodeInfoEls[nodeid] = relatedNodeEl;

			relatedNodeEl.addEventListener('mouseover', function () {
				self.hoverIn(this.getAttribute('data-quadid'), this.getAttribute('data-nodeid'));
			});
			relatedNodeEl.addEventListener('click', function () {
				self.changehighlightTo(this.getAttribute('data-quadid'), this.getAttribute('data-nodeid'));
			});

			relatedNodes.appendChild(relatedNodeEl);
			relatedNodes.appendChild(document.createElement('br'));
		}
	}

	this.showpages = function () {
		var innerhtml = "";
		if (this.nrpages > 1) {
			var i;
			var startindex = this.currentpage - Math.floor(this.showNrPages / 2);
			if (startindex < 0) {
				startindex = 0;
			}

			var endindex = startindex + this.showNrPages;
			if (endindex > this.nrpages) {
				endindex = this.nrpages;
			}
			for (i = startindex; i < endindex; i++) {
				if (i == this.currentpage) {
					innerhtml += "[" + i + "] ";
				} else {
					innerhtml += '<a href="#" data-page="' + i + '" >[' + i + ']</a>';
				}
			}
		}

		nodePages.innerHTML = innerhtml;

		var pageLinkNodes = nodePages.getElementsByTagName('a');
		if (pageLinkNodes.length) {
			var pageLinks = Array.prototype.slice.call(pageLinkNodes);
			pageLinks.forEach(function (pageLink, idx) {
				pageLink.addEventListener('click', function (e) {
					e.preventDefault();
					var page = this.getAttribute('data-page');
					if (typeof page !== "undefined") {
						self.switchtopage(page);
					}
				});
			});
		}
	};

	this.highLightNode = function (quadid, nodeid) {
		var i, found = false;
		for (i = 0; i < this.list.length && !found; i++) {
			if (this.list[i][0] == quadid && this.list[i][1] == nodeid) {
				self.switchtopage(Math.floor(i / self.showLength));
				found = true;
			}
		}
		if(self.nodeInfoEls[nodeid]) {
			self.unHighLightNode();
			var node = self.nodeInfoEls[nodeid];
			node.classList.add('shingle-info-hovered');
			self.currentNode = node;
		}
	};

	this.unHighLightNode = function () {
		if(self.currentNode) {
			self.currentNode.classList.remove('shingle-info-hovered');
		}
	};

	return this;
}