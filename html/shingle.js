
/////////////////////////////////////////////////////
//
// Begin editable parameters
//
//


// node color based on community id
function nodeColor(node,opacity)
{
  var colortuple = nodeColorTuple(node);
  var r = colortuple[0];
  var g = colortuple[1];
  var b = colortuple[2];
  return "rgba("+r+","+g+","+b+","+opacity+")";
}


function nodeColorTuple(node)
{
  var communityid = node.community;


  switch (communityid % 10)
  {
  case 0:
    return [240,188,0];
  case 1:   
    return [178,57,147];
  case 2:   
    return [39,204,122];
  case 3:   
    return [21,163,206];
  case 4:   
    return [235,84,54];
  case 5:   
    return [138,103,52];
  case 6:   
    return [255,116,116];
  case 7:   
    return [120,80,171];
  case 8:   
    return [48,179,179];

  case 9:   
    return [211,47,91];
  }

  return [214,29,79];
}

function edgeColor(nodeA,nodeB)
{
  if (nodeA != null)
  {
    return nodeColor(nodeA,1);
  }
  else if (nodeB != null)
  {
    return nodeColor(nodeB,1);
  }
  return "rgb(213,213,213)";
}

function edgeHighlightColor(nodeA,nodeB)
{
  if (nodeA != null)
  {
    return nodeColor(nodeA,1);
  }
  else if (nodeB != null)
  {
    return nodeColor(nodeB,1);
  }
  return "rgb(0,0,0)";
}


// nodegrootte en edge lijn dikte
function calcNodeRadius(range)
{
//  return (0.2+0.8*range)*15;
  return (0.2+0.8*range)*18;
}

var edgeWidth = 1;

// randen van de nodes

function nodeEdgeWidth(range)
{
 // return 1.5+5*range; //1.5;
 return 0.5+1*range;
}

function nodeEdgeColor(node)
{
  var colortuple = nodeColorTuple(node);
  var r = colortuple[0];
  var g = colortuple[1];
  var b = colortuple[2];
  return "rgba("+r+","+g+","+b+",1)";

//  return "rgba(214,29,79,1)";
}

// Font voor de namen
var fontColor = "rgba(5,87,119,0.6)";
var fontSize = 18;
var fontFamily = "sans";


var allowPhysics = false;


var selectedNodeColor = "#505050";

var startZoomControlValue = 5;

//
//
// End editable parameters
//
/////////////////////////////////////////////////////


//var msie = (window.navigator.userAgent.indexOf("MSIE ") > 0);

var nodefield = "nodeid";

var xmlns = "http://www.w3.org/2000/svg";

var graphPath="";

var mapinfo = null;
var graphs = {};

var nodeRadiusScale = 1.0/100.0;
var nodeEdgeRadiusScale = 1/500.0;
var fontScale = 1.0/50.0;
var minScale = 0.1;
var maxScale = 0.5;

var edgeWidthScale = 1/60.0;

var debugQuads = false;




function Scheduler(stepaftertimeout)
{
  this.tasks = [];
  this.timer = null;
  this.stepaftertimeout = stepaftertimeout;


  this.addTask = function(task)
  {
    this.tasks.push(task);
    if (this.tasks.length == 1)
    {
      this.reSchedule();
    }
  };

  this.abandonAll = function()
  {
    if (this.timer != null)
    {
      clearTimeout(this.timer);
      this.timer = null;
      this.tasks = [];
    }
  }

  this.reSchedule = function()
  {
    if (this.tasks.length > 0)
    {
      this.timer = setTimeout(this.stepaftertimeout , 10);
    }
    else
    {
      this.timer = null;
    }
  };

  this.step = function()
  {
    if (this.tasks.length > 0)
    {
      var finished = this.tasks[0].call();
      if (finished)
      {
        this.tasks.splice(0,1);
      }
    }
    this.reSchedule();

  };
 
  return this;
}




function schedulerStep()
{
  scheduler.step();
}
var scheduler = new Scheduler(schedulerStep);

function highlightschedulerStep()
{
  highlightscheduler.step();
}
var highlightscheduler = new Scheduler(highlightschedulerStep);




var KSymTableSize = 211;
function HashByte(h, c)
{
  h=(h*16)+c;
  h = h & 0xffffff;
  return h;
}

function HASHBIN(h)    
{
  return (h % KSymTableSize);
}

function getHash( s )
{
  var i;
  var h=0;

  for (i=0;i<s.length;i++)
  {
    h = HashByte( h, s.charCodeAt(i));
  }
  return HASHBIN(h);
}







function drawnQuad(quadid)
{
  var element = document.getElementById(quadid);
  return element;
}


function containerWorldRect()
{
  var datarectPixels = document.getElementById('boundingrect').getBoundingClientRect();
  var containerRectPixels = document.getElementById('mfrmap').getBoundingClientRect();

  var scaleX = ((1.0*mapinfo["quadtree"]["xmax"])-mapinfo["quadtree"]["xmin"])/(datarectPixels.right-datarectPixels.left);
  var scaleY = ((1.0*mapinfo["quadtree"]["ymax"])-mapinfo["quadtree"]["ymin"])/(datarectPixels.bottom-datarectPixels.top);

  var containerWidth = (containerRectPixels.right-containerRectPixels.left)*scaleX;
  var containerHeight = (containerRectPixels.bottom-containerRectPixels.top)*scaleY;

  var movedWorldDeltaX = (datarectPixels.left)*scaleX-mapinfo["quadtree"]["xmin"];
  var movedWorldDeltaY = (datarectPixels.top)*scaleX-mapinfo["quadtree"]["ymin"];

  var containerX = (containerRectPixels.left)*scaleX - movedWorldDeltaX;
  var containerY = (containerRectPixels.top)*scaleY - movedWorldDeltaY;
  return [ containerX, containerY, containerX+containerWidth, containerY+containerHeight ];
}


function quadIntersects(screenrect,root)
{
  if (root["xmin"] < screenrect[2] && root["xmax"] > screenrect[0] && 
      root["ymin"] < screenrect[3] && root["ymax"] > screenrect[1])
  {
    return true;
  }
  return false;
}

function findQuadsToDraw()
{
  var screenrect = containerWorldRect();
  var root = mapinfo["quadtree"];
  var quadid = "quad_";

  findQuadsToDrawRecursive(screenrect,root,quadid);
}

function findQuadsToDrawRecursive(screenrect,root,quadid)
{ 
  if (quadIntersects(screenrect,root))
  {
    if (root["type"] == "Leaf")
    {
      if (drawnQuad(quadid))
      {
        return;
      }
      loadQuad(quadid);
    }
    else
    {
      findQuadsToDrawRecursive(screenrect,root["left"],(quadid+"l"));
      findQuadsToDrawRecursive(screenrect,root["right"],(quadid+"r"));
    }
  } 
}




function findQuadsToRemove()
{
  var i;
  var screenrect = containerWorldRect();
  var elements = document.getElementsByClassName('quadcontainer');
  for (var i = 0; i < elements.length; i++)
  {
    var el = elements[i];
    var elid = el.id;
    var header = graphs[elid].header;

    if (header != null)
    {
      if (!quadIntersects(screenrect,header))
      {
        el.parentNode.removeChild(el);
        i--;
      }
    }
  }

  for (i=1;i<scheduler.tasks.length;i++)
  {
    if (scheduler.tasks[i].quadid != null)
    {
      var graph = graphs[scheduler.tasks[i].quadid];
      if (graph != null)
      {
        var header = graph.header;
        if (header != null)
        {
          if (!quadIntersects(screenrect,header))
          {
            scheduler.tasks.splice(i,1);
            i--;
          }
        }
      }
    }
  }


  for (var quadid in graphs) 
  {
    if (graphs.hasOwnProperty(quadid)) 
    {
      var visible = false;
      var graph = graphs[quadid];
      
      if (graph == null)
      {
        continue;
      }
      
      var header = graph.header;

      if (quadIntersects(screenrect,header))
      {
        visible = true;
      }
      else
      {
        var referenced = graph["referenced"];
        var j;
        for (j=0;j<referenced.length;j++)
        {
	  var othergraph = graphs[referenced[j]];
	  if (othergraph == null)
	  {
	    continue;
	  }

          header = othergraph.header;

          if (quadIntersects(screenrect,header))
          {
            visible = true;
	    break;
          }
        }
      }
      if (visible == false)
      {
        graphs[quadid] = null;
      }
    }
  }

}

    



function findPosition(nodeid)
{
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
    {
      var table = JSON.parse(xmlhttp.responseText);
      var entry = table[nodeid];
      if (entry)
      {
        currentTranslateX = -entry[0];
        currentTranslateY = -entry[1];
        currentnodeid   = nodeid;
      }
      loadMapInfo();
    }
  };

  var has = getHash(nodeid);
  var table = graphPath+"table"+has+".json";
  xmlhttp.open("GET", table, true);
  xmlhttp.send();
}



function loadMapInfo()
{
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
    {
      mapinfo = JSON.parse(xmlhttp.responseText);

      minScale = mapinfo["averageQuadWidth"]/mapinfo["totalMapWidth"];
      maxScale = (5*mapinfo["averageQuadWidth"])/mapinfo["totalMapWidth"];

      nodeRadiusScale = mapinfo["averageQuadWidth"]/200.0;

//alert("nodeRadiusScale = "+nodeRadiusScale);

if (nodeRadiusScale>1) nodeRadiusScale = 1;

      nodeEdgeRadiusScale = mapinfo["averageLineLength"]/200.0;
      fontScale = mapinfo["averageLineLength"]/80.0;
      edgeWidthScale = mapinfo["averageLineLength"]*minScale/10.0;

      currentScale = 1/(minScale + (maxScale-minScale)*(startZoomControlValue/100.0));

      createBaseSvgDOM();

      findQuadsToDraw();
    }
  };
  xmlhttp.open("GET", graphPath+"mapinfo.json", true);
  xmlhttp.send();
}




function loadQuad(quadid)
{
  if (graphs[quadid] != null)
  {
    if (!drawnQuad(quadid))
    {
      scheduler.addTask(new ScheduledAppendQuad(quadid));
    }
    return;
  }

  var json_url = graphPath+quadid+".json";
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
    {
      var graph = JSON.parse(xmlhttp.responseText);
      graphs[quadid] = graph;
      scheduler.addTask(new ScheduledAppendQuad(quadid));
    }
  };
  xmlhttp.open("GET", json_url, true);
  xmlhttp.send();
}


function debug(str)
{
  var debugelement = document.getElementById('debug');
  if (debugelement!= null)
  {
    debugelement.innerHTML = str;
  }
}


var lastX=0;
var lastY=0;
var startTranslateX = 0;
var startTranslateY = 0;

var sfactor = 48;

function attachMouseEvents()
{
  var mfrmap = document.getElementById("mfrmap");
  if (mfrmap)
  {
    mfrmap.addEventListener('mousedown',function(evt)
    {
      lastX = (evt.pageX - mfrmap.offsetLeft);
      lastY = (evt.pageY - mfrmap.offsetTop);
      startTranslateX = currentTranslateX;
      startTranslateY = currentTranslateY;

      var rect = document.getElementById('boundingrect').getBoundingClientRect();
      
      sfactor = (rect.right-rect.left)/((1.0*mapinfo["quadtree"]["xmax"])-mapinfo["quadtree"]["xmin"]);

      dragging=true;
    },false);

    mfrmap.addEventListener('mousemove',function(evt)
    {
      if  (dragging)
      {
        var newX = (evt.pageX - mfrmap.offsetLeft);
        var newY = (evt.pageY - mfrmap.offsetTop);
        currentTranslateX = startTranslateX + (newX-lastX)/sfactor;
        currentTranslateY = startTranslateY + (newY-lastY)/sfactor;

//@@@ removing the following line causes the map to not render well when zoomed in on Firefox, no idea why...
debug ("<p style=\"color:#ffffff\">"+0+"</p>");

        setSvgTransforms();
      }
    },false);

    mfrmap.addEventListener('mouseup',function(evt)
    {
      var newX = (evt.pageX - mfrmap.offsetLeft);
      var newY = (evt.pageY - mfrmap.offsetTop);
      if (Math.abs(newX-lastX)<10 && Math.abs(newY-lastY)<10)
      {
        removeInfoAbout();
      }
      dragging=false;
      findQuadsToRemove();
      findQuadsToDraw();
    },false);
    mfrmap.addEventListener('mouseleave',function(evt)
    {
      dragging=false;
      findQuadsToRemove();
      findQuadsToDraw();
    },false);


    var handleScroll = function(evt)
    {
      var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
      if (delta)
      {
        if (delta>0)
	{
          currentScale *= 1.1;
	}
	else if (delta<0)
	{
          currentScale /= 1.1;
	}


        var mins = 1/(minScale);
        var maxs = 1/(maxScale);
        if (currentScale < maxs)
	{
	  currentScale = maxs;
	}
        if (currentScale > mins)
	{
	  currentScale = mins;
	}


        document.getElementById("zoom").value = 100.0*((1/currentScale)-minScale)/(maxScale-minScale);
	
        setSvgTransforms();
        findQuadsToRemove();
        findQuadsToDraw();
      }
      return evt.preventDefault() && false;
    };
    mfrmap.addEventListener('DOMMouseScroll',handleScroll,false);
    mfrmap.addEventListener('mousewheel',handleScroll,false);
  }
}



var svgCreated = false;



function createBaseSvgDOM()
{
  svgCreated = true;

  var i;
  var xmin=mapinfo["quadtree"]["xmin"];
  var xmax=mapinfo["quadtree"]["xmax"];
  var ymin=mapinfo["quadtree"]["ymin"];
  var ymax=mapinfo["quadtree"]["ymax"];

  var svg = document.createElementNS (xmlns, "svg");

  svg.setAttributeNS (null, "viewBox", ""+xmin+" "+ymin+" "+(xmax-xmin)+" "+(ymax-ymin)+"");

  var svgwidth = "2in";
  var svgheight = "2in";

  var shinglecontainer = document.getElementById("shinglecontainer");
  {
    var setwidth = shinglecontainer.getAttribute("data-width");
    var setheight = shinglecontainer.getAttribute("data-height");

    if (setwidth != null)
    {
      svgwidth = setwidth;
    }
    if (setheight != null)
    {
      svgheight = setheight;
    }
    shinglecontainer.style.width = svgwidth;
    var mfrmapElement = document.getElementById("mfrmap");
    mfrmapElement.style.width = svgwidth;
    var mfrinfoElement = document.getElementById("mfrinfo");
    mfrinfoElement.style.maxHeight = svgheight;

  }
  svg.setAttributeNS (null, "width", svgwidth);
  svg.setAttributeNS (null, "height", svgheight);

  svg.setAttributeNS (null, "position", "absolute");
  svg.setAttributeNS (null, "x", "0");
  svg.setAttributeNS (null, "y", "0");

  svg.style.overflow="visible";

  var gscaling = document.createElementNS (xmlns, "g");
  svg.appendChild (gscaling);
  gscaling.setAttributeNS (null, 'transform', "scale("+currentScale+")");
  gscaling.setAttributeNS(null, "class", "scaling");

  var gtranslation = document.createElementNS (xmlns, "g");
  gscaling.appendChild (gtranslation);

  gtranslation.setAttributeNS (null, 'transform', "translate("+currentTranslateX+" "+currentTranslateY+")");
  gtranslation.setAttributeNS(null, "class", "translation");
  gtranslation.setAttributeNS(null, "id", "translation");

  var rect = document.createElementNS (xmlns, "rect");
  rect.setAttributeNS (null, "id", "boundingrect");

  rect.setAttributeNS (null, "x", ""+xmin);
  rect.setAttributeNS (null, "y", ""+ymin);

  rect.setAttributeNS (null, "width", ""+(xmax-xmin));
  rect.setAttributeNS (null, "height", ""+(ymax-ymin));
  rect.style.fill="none";
  rect.style.stroke="black";
  rect.style.strokeWidth=0.2*edgeWidthScale;
  rect.style.fillOpacity="0";
  rect.style.strokeOpacity="0.5";
  gtranslation.appendChild(rect);

  var glines = document.createElementNS (xmlns, "g");
  gtranslation.appendChild (glines);
  glines.setAttributeNS (null, "id", "linescontainer");

  var ghighlightedlines = document.createElementNS (xmlns, "g");
  gtranslation.appendChild (ghighlightedlines);
  ghighlightedlines.setAttributeNS (null, "id", "highlightedlinescontainer");

  var gnodes = document.createElementNS (xmlns, "g");
  gtranslation.appendChild (gnodes);
  gnodes.setAttributeNS (null, "id", "nodescontainer");

  var ghighlightednodes = document.createElementNS (xmlns, "g");
  gtranslation.appendChild (ghighlightednodes);
  ghighlightednodes.setAttributeNS (null, "id", "highlightednodescontainer");

  var gnames = document.createElementNS (xmlns, "g");
  gtranslation.appendChild (gnames);
  gnames.setAttributeNS (null, "id", "namescontainer");

  document.getElementById("mfrmap").appendChild(svg);   
}


function clearNodeNames()
{
  var gnames = document.getElementById("namescontainer");
  if (gnames == null)
  {
    return;
  }

  while (gnames.firstChild) 
  {
    gnames.removeChild(gnames.firstChild);
  }
}

function showNodeName(quadid,node)
{
  clearNodeNames();

  var minsize = mapinfo["minsize"];
  var maxsize = mapinfo["maxsize"];
  var x = node.x;
  var y = node.y;
  var name = node.name;

  var size=Math.floor(0.2*fontSize);
  size = ""+size;
/*
  var range = 0.8;
  if (Math.abs(maxsize-minsize) > 0.00001)
  {
    range = (node.size-minsize)/(maxsize-minsize);
  }
  range = Math.pow(range,1.25);
  size = ((0.1+0.9*range)*fontSize);
*/
  var gnames = document.getElementById("namescontainer");
  if (gnames == null)
  {
    return;
  }

  var textfield = document.createElementNS (xmlns, "text");
  textfield.setAttributeNS (null, "class", "authorText");
  textfield.setAttributeNS (null, "id", "nodetext-"+node.nodeid);
  textfield.setAttributeNS (null, "data-quad-id",""+quadid); 
  textfield.setAttributeNS (null, "data-scopus-name",""+node.name); 
  textfield.setAttributeNS (null, "data-scopus-id",""+node.nodeid); 
  textfield.setAttributeNS (null, "x",""+x); 
  textfield.setAttributeNS (null, "y",""+y);
  textfield.setAttributeNS (null, "fill",""+fontColor);
  textfield.setAttributeNS (null, "font-family",""+fontFamily); 
  textfield.setAttributeNS (null, "font-size",""+(size*fontScale));
  textfield.innerHTML = name;
  gnames.appendChild(textfield);
}



function ScheduledAppendQuad(quadid)
{
  this.quadid=quadid;
  
  this.call = function()
  {
    appendSvgDOM(quadid);
    return true;
  }
  return this;
}



function makeLineElenent(x1,y1,x2,y2)
{
  var line = document.createElementNS (xmlns, "path");
  var dx = x2-x1;
  var dy = y2-y1;

  var len = Math.sqrt(dx*dx+dy*dy);

  var r = 2*len;
  var sweep="1";

  if (dy<0)
  {
    sweep = "0";
  }
  
  var d = "M"+x1+","+y1+" A"+r+","+r+" 0 0 "+sweep+" "+x2+","+y2;

  line.setAttributeNS (null, "d", ""+d);
  line.setAttributeNS (null, "fill", "none");

  return line;

/*This is the simple straight line version

  var line = document.createElementNS (xmlns, "line");
  line.setAttributeNS (null, "x1", ""+x1);
  line.setAttributeNS (null, "y1", ""+y1);
  line.setAttributeNS (null, "x2", ""+x2);
  line.setAttributeNS (null, "y2", ""+y2);
  return line;

*/
}


function nodeRange(node)
{
  var minsize = mapinfo["minsize"];
  var maxsize = mapinfo["maxsize"];
  var range = 0.5;
  if (Math.abs(maxsize-minsize) > 0.00001)
  {
    range = (node.size-minsize)/(maxsize-minsize);
  }
  range = Math.pow(range,1.25);
  return range;
}    





function AsyncEdges(quadid)
{
  this.quadid = quadid;
  this.i = 0;
  this.call = function()
  {
    var graph = graphs[this.quadid];
    if (graph == null)
    {
      return true;
    }
    var nredges = graph["relations"].length;

    if (nredges>100) nredges = 100;

    var glin = document.getElementById(this.quadid);
    if (glin == null)
    {
      return true;
    }

    var j;
    for (j=0;j<100;j++)
    {
      if (this.i >= nredges)
      {
        return true;
      }
      var graphA = graphs[graph["relations"][this.i].quadA];
      var graphB = graphs[graph["relations"][this.i].quadB];
      if (graphA == null || graphB == null)
      {
        this.i = this.i + 1;
        continue;
      }
      var pos = graphA["idmap"][graph["relations"][this.i].nodeidA];
      var node1 = graphA["nodes"][pos];
      var x1 = graphA["nodes"][pos].x;
      var y1 = graphA["nodes"][pos].y;
      pos = graphB["idmap"][graph["relations"][this.i].nodeidB];
      var node2 = graphB["nodes"][pos];
      var x2 = graphB["nodes"][pos].x;
      var y2 = graphB["nodes"][pos].y;
      var edgeOpacity = 0.5;

      var line = makeLineElenent(x1,y1,x2,y2);

      line.id = this.quadid+"-edge-"+this.i;
      line.style.stroke=""+edgeColor(node1, node2);
      line.setAttributeNS (null, "stroke-opacity", ""+edgeOpacity);

//      if (msie)
//      {
//        line.setAttributeNS (null, "stroke-width",""+(edgeWidth*edgeWidthScale)); 
//      }
//      else
      {
        line.setAttributeNS (null, "vector-effect", "non-scaling-stroke");
        line.setAttributeNS (null, "stroke-width","1px"); 
      }


      line.setAttributeNS (null, "stroke-linecap","round");
      glin.appendChild(line);

      this.i = this.i + 1;
    }
    return (this.i >= nredges);
  };
  return this;
}


var nodemodeflagHighlighted = 1;
var nodemodeflagCentered = 2;

var nodemodeGraph = 0;
var nodemodeHighlighted = nodemodeflagHighlighted;
var nodemodeCentered    = nodemodeflagHighlighted + nodemodeflagCentered;

function MakeNodeElement(quadid,node,mode)
{
  var highlighted = ((mode&nodemodeflagHighlighted) != 0);
  var centered = ((mode&nodemodeflagCentered) != 0);

  var x = node.x;
  var y = node.y;
    
  var range = nodeRange(node);

  var nodeRadius = calcNodeRadius(range)*nodeRadiusScale;
  var nEdgeWid = 0;
  var opacity;

  var id;
  if (highlighted)
  {
    nodeRadius *= 1.5;
    id = quadid+"-node-"+node.nodeid+"highlighted";
    opacity = 1;
  }
  else
  {
    id = quadid+"-node-"+node.nodeid;
    opacity = 0.6;
  }
  var color;
  
  if  (centered)
  {
    color = "rgb(255,255,255)";
    nEdgeWid = 5*nodeEdgeWidth(range)*nodeEdgeRadiusScale;
  }
  else
  {
    color = nodeColor(node,opacity);
  }


  var circle = document.createElementNS (xmlns, "circle");
  circle.setAttributeNS (null, "class", "authorNode");
  circle.setAttributeNS (null, "id", id);
  circle.setAttributeNS (null, "data-quadid",""+quadid); 
  circle.setAttributeNS (null, "data-name",""+node.name); 
  circle.setAttributeNS (null, "data-nodeid",""+node.nodeid); 
  circle.setAttributeNS (null, "cx",""+x); 
  circle.setAttributeNS (null, "cy",""+y);
  circle.setAttributeNS (null, "r",""+nodeRadius); 
  circle.setAttributeNS (null, "stroke",""+nodeEdgeColor(node)); 
  circle.setAttributeNS (null, "stroke-width",""+nEdgeWid); 
  circle.setAttributeNS (null, "fill",""+color);





  circle.addEventListener('mouseenter', function(e) {
        e.cancelBubble=true;
        hoverIn(this.getAttribute('data-quadid'),this.getAttribute('data-nodeid'));
    });

  circle.addEventListener('mouseleave', function(e) {
        hoverOut();
    });

  circle.addEventListener('mousedown', function(e) {
        e.cancelBubble=true;
        showInfoAbout(this.getAttribute('data-quadid'),this.getAttribute('data-nodeid'));
    });

  circle.addEventListener('mouseup', function(e) {
        e.cancelBubble=true;
    });

  return circle;
}


function appendSvgDOM(quadid)
{
  if (drawnQuad(quadid))
  {
//    alert("would have added double");
    return;
  }

  var graph = graphs[quadid];

  if (graph == null)
  {
    return;
  }

  var i;

  var xmin=mapinfo["quadtree"]["xmin"];
  var xmax=mapinfo["quadtree"]["xmax"];
  var ymin=mapinfo["quadtree"]["ymin"];
  var ymax=mapinfo["quadtree"]["ymax"];

  var glines = document.getElementById("linescontainer");
  var gnodes = document.getElementById("nodescontainer");

  var glin = document.createElementNS (xmlns, "g");
  glines.appendChild (glin);

  glin.setAttributeNS (null, "class", "quadcontainer");
  glin.setAttributeNS (null, "id", quadid);

  if (debugQuads)
  {
    rect = document.createElementNS (xmlns, "rect");
    rect.setAttributeNS (null, "x", ""+graph["header"]["xmin"]);
    rect.setAttributeNS (null, "y", ""+graph["header"]["ymin"]);

    rect.setAttributeNS (null, "width", ""+(graph["header"]["xmax"]-graph["header"]["xmin"]));
    rect.setAttributeNS (null, "height", ""+(graph["header"]["ymax"]-graph["header"]["ymin"]));
    rect.style.fill="none";
    rect.style.stroke="black";
    rect.style.strokeWidth=edgeWidthScale;
    rect.style.fillOpacity="0";
    rect.style.strokeOpacity="0.75";
    glin.appendChild(rect);
  }

  scheduler.addTask(new AsyncEdges(quadid));

  var gnod = document.createElementNS (xmlns, "g");
  gnodes.appendChild (gnod);

  gnod.setAttributeNS (null, "class", "quadcontainer");
  gnod.setAttributeNS (null, "id", quadid);


  for (i=0;i<graph["nodes"].length;i++)
  {
    var node = graph["nodes"][i];
    var circle = MakeNodeElement(quadid, node,nodemodeGraph);
    gnod.appendChild(circle);
  }



  var highlightednodescontainer = document.getElementById('highlightednodescontainer');
  if (highlightednodescontainer != null)
  {
    if (highlightednodescontainer.firstChild == null) 
    {
      var lookup = graph["idmap"][currentnodeid];
      if (lookup)
      {
        showInfoAbout(quadid, currentnodeid);
      }
    }
  }
}





var currentScale = 0.1;
var currentTranslateX = 0;
var currentTranslateY = 0;
var currentnodeid = null;


function setSvgTransforms()
{
  var i;
  var len;
  var authorTextEls = document.getElementsByClassName('scaling');
  len = authorTextEls.length;
  for (i = 0; i < len; i++)
  {
    var element = authorTextEls[i];
    element.setAttribute('transform', 'scale('+currentScale+')');
  }

  authorTextEls = document.getElementsByClassName('translation');
  len = authorTextEls.length;
  for (i = 0; i < len; i++)
  {
    var element = authorTextEls[i];
    element.setAttribute('transform', 'translate('+currentTranslateX+' '+currentTranslateY+')');
  }
}

function doscale(value)
{
  currentScale = 1/(minScale + (maxScale-minScale)*(value/100.0));
  setSvgTransforms();
}
function doscaleFinish(value)
{
  currentScale = 1/(minScale + (maxScale-minScale)*(value/100.0));

  setSvgTransforms();
  findQuadsToRemove();
  findQuadsToDraw();
}



document.onkeyup = KeyCheck;       
function KeyCheck(e)
{  
  var KeyID = (window.event) ? event.keyCode : e.keyCode;
  var actualkey=String.fromCharCode(KeyID);
  if (actualkey == "a" || actualkey == "A")
  {
    findQuadsToDraw();
  }
  else if (actualkey == "r" || actualkey == "R")
  {
    findQuadsToRemove();
  }
}



function HighlightedNode()
{
  this.currentHighlightedId = null;
  this.currentHighlightedIdHighlighted = null;
  this.currentHighlightedQuadId = 0;
  this.currentHighlightedIndex = 0;

  this.unhighlight = function()
  {
    if (this.currentHighlightedId != null)
    {
      var graph = graphs[this.currentHighlightedQuadId];
      if (graph == null)
      {
        return;
      }
      
      var node = graph["nodes"][this.currentHighlightedIndex];
      if (node == null)
      {
        return;
      }
      var range = nodeRange(node);

      var nEdgeWid = nodeEdgeWidth(range)*nodeEdgeRadiusScale;
      var circle = document.getElementById(this.currentHighlightedId);
      if (circle)
      {
        circle.setAttributeNS (null, "stroke-width","0"); 
      }
      circle = document.getElementById(this.currentHighlightedIdHighlighted);
      if (circle)
      {
        circle.setAttributeNS (null, "stroke-width",""+nEdgeWid); 
      }
    }
  };

  this.sethighlighted = function(quadid,nodeid)
  {
    var graph = graphs[quadid];
    if (graph == null)
    {
      return;
    }
    this.currentHighlightedQuadId = quadid;
    this.currentnodeid = nodeid;

    this.currentHighlightedIndex = graph["idmap"][nodeid];
    if (this.currentHighlightedIndex == null)
    {
      return;
    }
    this.currentHighlightedId = this.currentHighlightedQuadId+"-node-"+graph["nodes"][this.currentHighlightedIndex].nodeid;
    this.currentHighlightedIdHighlighted = this.currentHighlightedId + "highlighted";
  };
  this.highlight = function()
  {
    if (this.currentHighlightedId != null)
    {
      var graph = graphs[this.currentHighlightedQuadId];
      if (graph == null)
      {
        return;
      }

      var node = graph["nodes"][this.currentHighlightedIndex];
      if (node == null)
      {
        return;
      }

      var range = nodeRange(node);
      var nEdgeWid = nodeEdgeWidth(range)*nodeEdgeRadiusScale;

      var circle = document.getElementById(this.currentHighlightedId);
      if (circle)
      {
        circle.setAttributeNS (null, "stroke-width",""+5*nEdgeWid); 
      }

      circle = document.getElementById(this.currentHighlightedIdHighlighted);
      if (circle)
      {
        circle.setAttributeNS (null, "stroke-width",""+5*nEdgeWid); 
      }
    }
  };
  return this;
}


var GetMoreOnNode = function(nodeid)
{
  return "";
}

function MFRInfoNodes()
{
  this.mainauthor = null;
  this.list = [];
  this.nrpages = 0;
  this.currentpage = 0;

  this.showLength = 12;
  this.showNrPages = 5;

  this.clear = function()
  {
    this.mainauthor = null;
    this.list = [];
    this.nrpages = 0;
    this.currentpage = 0;


    var mfrinfomainauthor = document.getElementById('mfrinfomainauthor');
    mfrinfomainauthor.innerHTML = "";

    var mfrinfocoauthors = document.getElementById('mfrinfocoauthors');
    mfrinfocoauthors.innerHTML = "";

    var mfrinfonodepages = document.getElementById('mfrinfonodepages');
    mfrinfonodepages.innerHTML = "";

    var mfrinfoedgeinfo = document.getElementById('mfrinfoedgeinfo');
    mfrinfoedgeinfo.innerHTML = "";

    var mfrinfo = document.getElementById('mfrinfo');
    mfrinfo.style.display = "none";


  };

  this.setmainauthor = function(quadid,nodeid)
  {
    this.mainauthor = [quadid,nodeid];
    var graph = graphs[quadid];
    if (graph != null)
    {
      var index = graph["idmap"][nodeid];
      var name=graph["nodes"][index].name;
      
      var moreOnNode = GetMoreOnNode(nodeid);

      var mfrinfomainauthor = document.getElementById('mfrinfomainauthor');
      mfrinfomainauthor.innerHTML = "<span class=\"coauthor\" id=\"author-"+nodeid+"\" onmouseover='javascript:hoverIn(\""+quadid+"\", \""+nodeid+"\")' onclick='javascript:changehighlightTo(\""+quadid+"\", \""+nodeid+"\")' >"+name+"</span> "+nodeid+"<br>" + moreOnNode + "<hr>";

    var mfrinfo = document.getElementById('mfrinfo');
    mfrinfo.style.display = "inherit";

    }
  };

  this.appendCoAuthor = function(quadid,nodeid)
  {
    this.list.push([quadid,nodeid]);
    if (this.list.length < this.showLength+1)
    {
      this.shownodes();
    }
    else;
    {
      this.nrpages = Math.floor((this.list.length+this.showLength-1)/this.showLength);
      if (this.nrpages <= this.showNrPages)
      {
        this.showpages();
      }
    }

  };




  this.switchtopage = function(page)
  {
    if (page != this.currentpage)
    {
      this.currentpage = page;
      this.shownodes();
      this.showpages();
    }
  };

  this.shownodes = function()
  {
    var i;
    var startindex = this.currentpage*this.showLength;
    var endindex = (this.currentpage+1)*this.showLength;
    if (endindex>this.list.length)
    {
      endindex = this.list.length;
    }
    var innerhtml = "";
    for (i=startindex;i<endindex;i++)
    {
      var quadid = this.list[i][0];
      var nodeid = this.list[i][1];
      var graph = graphs[quadid];
      if (graph == null)
      {
        continue;
      }
      var index = graph["idmap"][nodeid];
      var name=graph["nodes"][index].name;

      innerhtml += "<span class=\"coauthor\" id=\"author-"+nodeid+"\" onmouseover='javascript:hoverIn(\""+quadid+"\", \""+nodeid+"\")' onclick='javascript:changehighlightTo(\""+quadid+"\", \""+nodeid+"\")' >"+name+"</span><br>";
    }
    var mfrinfocoauthors = document.getElementById('mfrinfocoauthors');
    mfrinfocoauthors.innerHTML = innerhtml;

  }


  this.showpages = function()
  {
    var innerhtml = "";
    if (this.nrpages > 1)
    {
      var i;
      var startindex = this.currentpage-Math.floor(this.showNrPages/2);
      if (startindex < 0)
      {
        startindex = 0;
      }

      var endindex = startindex + this.showNrPages;
      if (endindex>this.nrpages)
      {
        endindex = this.nrpages;
      }

      for (i=startindex;i<endindex;i++)
      {
        if (i == this.currentpage)
        {
          innerhtml += "["+i+"] ";
        }
        else
        {
          innerhtml += "<a href=\"javascript:switchtopage("+i+")\">["+i+"]</a> ";
        }
      }
    }
    var mfrinfonodepages = document.getElementById('mfrinfonodepages');
    mfrinfonodepages.innerHTML = innerhtml;
  };

  this.bringIntoView = function(quadid,nodeid)
  {
    var i;
    for (i=0;i<this.list.length;i++)
    {
      if (this.list[i][0] == quadid && this.list[i][1] == nodeid)
      {
        this.switchtopage(Math.floor(i/this.showLength));
	return;
      }
    }
  };


  return this;
}


var theInfoData = new MFRInfoNodes();

function switchtopage(page)
{
  theInfoData.switchtopage(page);
}


function mfrinfoClear()
{
  theInfoData.clear();
  clearNodeNames();
}

function mfrinfoAppendAuthor(quadid, nodeid)
{
  theInfoData.setmainauthor(quadid, nodeid);
}

function mfrinfoAppendCoAuthor(quadid, nodeid)
{
  theInfoData.appendCoAuthor(quadid, nodeid);
}

function changehighlightTo(quadid, nodeid)
{
  showInfoAbout(quadid, nodeid);

  var graph = graphs[quadid];
  if (graph)
  {
    var index = graph["idmap"][nodeid];
    var node=graph["nodes"][index];

    var rect = containerWorldRect();
    if (node.x < rect[0] || 
        node.y < rect[1] ||
	node.x > rect[2] ||
	node.y > rect[3])
    {

      currentTranslateX = -node.x;
      currentTranslateY = -node.y;
      setSvgTransforms();
      findQuadsToRemove();
      findQuadsToDraw();
    }
  }
}




var currentHighlightedNode = new HighlightedNode();







function async_showmfrinfo(quadid, nodeid)
{
  this.quadid = quadid;
  this.nodeid = nodeid;
  this.j = 0;

  this.call = function()
  {
    var ghighlightedlines = document.getElementById("highlightedlinescontainer");
    var ghighlightednodes = document.getElementById("highlightednodescontainer");

    if (ghighlightedlines == null)
    {
      return true;
    }
    if (ghighlightednodes == null)
    {
      return true;
    }

    var graph = graphs[this.quadid];

    if (graph == null)
    {
      return true;
    }

    var node1 = null;
    var nodeIndex;
  
    nodeIndex = graph["idmap"][this.nodeid];
    node1 = graph["nodes"][nodeIndex];

    if (ghighlightednodes != null && node1 != null)
    {
      var circle = MakeNodeElement(this.quadid,node1,nodemodeCentered);
      ghighlightednodes.appendChild(circle);

      showNodeName(this.quadid,node1);
    }

    var i;
    for (i=0;i<100;i++)
    {
      var node2 = null;
      if (this.j >= graph["relations"].length)
      {
        return true;
      }

      var quadid2 = quadid;

      if (graph["relations"][this.j].nodeidA == nodeid)
      {
        quadid2 = graph["relations"][this.j].quadB;
        var graphB = graphs[quadid2];
        if (graphB)
        {
          nodeIndex = graphB["idmap"][graph["relations"][this.j].nodeidB];
          node2 = graphB["nodes"][nodeIndex];
          mfrinfoAppendCoAuthor(quadid2, node2.nodeid ); // graph["relations"][this.j].nodeidB
        }
      }
      else if (graph["relations"][this.j].nodeidB == nodeid)
      {
        quadid2 = graph["relations"][this.j].quadA;
        var graphA = graphs[quadid2];
        if (graphA)
        {
          nodeIndex = graphA["idmap"][graph["relations"][this.j].nodeidA];
          node2 = graphA["nodes"][nodeIndex];
          mfrinfoAppendCoAuthor(quadid2, node2.nodeid  ); // graph["relations"][this.j].nodeidA 
        }
      }

      if (node1 != null && node2 != null)
      {
        var x1 = node1.x;
        var y1 = node1.y;

        var x2 = node2.x;
        var y2 = node2.y;
        var edgeOpacity = 0.5;

        var line = makeLineElenent(x1,y1,x2,y2);

        line.style.stroke=""+edgeHighlightColor(node1,node2);
        line.setAttributeNS (null, "stroke-opacity", "1");

        line.setAttributeNS (null, "vector-effect", "non-scaling-stroke");
        line.setAttributeNS (null, "stroke-width","2px"); 
        line.setAttributeNS (null, "stroke-linecap","round");
        ghighlightedlines.appendChild(line);

        if (ghighlightednodes != null && node2 != null)
	{
          var circle = MakeNodeElement(quadid2,node2,nodemodeHighlighted);
          ghighlightednodes.appendChild(circle);
	}

      }
      this.j = this.j + 1;

    }
  };
  return this;
}







var last_async_showmfrinfo = null;

function showmfrinfo(quadid, nodeid)
{

  if (last_async_showmfrinfo != null)
  {
    last_async_showmfrinfo.j = 1000000;
  }
  mfrinfoClear();
  mfrinfoAppendAuthor(quadid, nodeid);

  last_async_showmfrinfo = new async_showmfrinfo(quadid, nodeid);
  highlightscheduler.addTask(last_async_showmfrinfo);
}

function removeInfoAbout()
{

  var glines = document.getElementById("linescontainer");
  var gnodes = document.getElementById("nodescontainer");

  glines.setAttributeNS (null, "opacity", "1");
  gnodes.setAttributeNS (null, "opacity", "1");

  currentHighlightedNode.unhighlight();

  var highlightedlinescontainer = document.getElementById('highlightedlinescontainer');
  while (highlightedlinescontainer.firstChild) 
  {
    highlightedlinescontainer.removeChild(highlightedlinescontainer.firstChild);
  }

  var highlightednodescontainer = document.getElementById('highlightednodescontainer');
  while (highlightednodescontainer.firstChild) 
  {
    highlightednodescontainer.removeChild(highlightednodescontainer.firstChild);
  }

  mfrinfoClear();
}



function showInfoAbout(quadid, nodeid)
{
  removeInfoAbout();

  var glines = document.getElementById("linescontainer");
  var gnodes = document.getElementById("nodescontainer");
  glines.setAttributeNS (null, "opacity", "0.5");
  gnodes.setAttributeNS (null, "opacity", "0.5");
  
  currentHighlightedNode.highlight();
  showmfrinfo(quadid, nodeid);
}

var higlightedLine = null;


function hoverIn(quadid,nodeid)
{
  theInfoData.bringIntoView(quadid,nodeid)

  currentHighlightedNode.unhighlight();
  currentHighlightedNode.sethighlighted(quadid,nodeid);
  currentHighlightedNode.highlight();

  if (higlightedLine)
  {
    var element = document.getElementById(higlightedLine);
    {
      if (element)
      {
        element.style.color ="#007398";
      }
    }
    higlightedLine = null;
  }
  higlightedLine = "author-"+nodeid;
  var element = document.getElementById(higlightedLine);
  {
    if (element)
    {
      element.style.color ="#e9711c";
    }
  }

}

function hoverOut()
{

  if (higlightedLine)
  {
    var element = document.getElementById(higlightedLine);
    {
      if (element)
      {
        element.style.color ="#007398";
      }
    }
    higlightedLine = null;
  }

  currentHighlightedNode.unhighlight();
}




var prevOnLoad_graph = window.onload;
window.onload=onLoad_graph;
function onLoad_graph()
{
  if (prevOnLoad_graph != null)
  {
    prevOnLoad_graph();
  }

  var shinglecontainer = document.getElementById("shinglecontainer");

  var set_nodefield = shinglecontainer.getAttribute("data-nodefield");
  if (set_nodefield != null)
  {
    nodefield = set_nodefield;
  }
//alert("nodefield = "+nodefield);

  var set_debugQuads = shinglecontainer.getAttribute("data-debug-quads");
  if (set_debugQuads != null)
  {
    if (set_debugQuads == "true")
    {
      debugQuads = set_debugQuads;
    }
  }

  graphPath = shinglecontainer.getAttribute("data-graph-path");
  if (graphPath == null)
  {
    graphPath = "";
  }

  if (shinglecontainer != null)
  {
    var mfrmap = document.createElement("div");
    mfrmap.setAttribute("class", "unselectable");
    mfrmap.setAttribute("id", "mfrmap");
    shinglecontainer.appendChild(mfrmap);

    var zoom =  document.createElement("input");
    zoom.setAttribute("id", "zoom");
    zoom.setAttribute("type", "range");
    zoom.setAttribute("name", "zoom");
    zoom.setAttribute("value", ""+startZoomControlValue);
    zoom.setAttribute("min", "0");
    zoom.setAttribute("max", "100");
    zoom.setAttribute("onchange", "doscaleFinish(this.value)");
    zoom.setAttribute("oninput", "doscale(this.value)");
    shinglecontainer.appendChild(zoom);

    var mfrinfo =  document.createElement("div");
    mfrinfo.setAttribute("id", "mfrinfo");
    mfrinfo.style.display = "none";
    shinglecontainer.appendChild(mfrinfo);
    
    var mfrinfomainauthor =  document.createElement("div");
    mfrinfomainauthor.setAttribute("id", "mfrinfomainauthor");
    mfrinfo.appendChild(mfrinfomainauthor);

    var mfrinfocoauthors =  document.createElement("div");
    mfrinfocoauthors.setAttribute("id", "mfrinfocoauthors");
    mfrinfo.appendChild(mfrinfocoauthors);

    var mfrinfonodepages =  document.createElement("div");
    mfrinfonodepages.setAttribute("id", "mfrinfonodepages");
    mfrinfo.appendChild(mfrinfonodepages);

    var mfrinfoedgeinfo =  document.createElement("div");
    mfrinfoedgeinfo.setAttribute("id", "mfrinfoedgeinfo");
    mfrinfo.appendChild(mfrinfoedgeinfo);


    var debug =  document.createElement("div");
    debug.setAttribute("id", "debug");
    shinglecontainer.appendChild(debug);

    attachMouseEvents();

    var nodeid = null;
    if (document.location.search)
    {
      var i;
      var request = new Array();
      var vals=document.location.search.substr(1).split("&");
      for (i in vals) 
      {
        vals[i] = vals[i].replace(/\+/g, " ").split("=");
        request[unescape(vals[i][0])] = unescape(vals[i][1]);
      }
      if (request[nodefield] != null)
      {
        nodeid = request[nodefield];
        var hashed = getHash( nodeid );
      }
      if (request["debugquads"] != null)
      {
        debugQuads = true;
      }
      
    }

    if (nodeid)
    {
      findPosition(nodeid);
    }
    else
    {
      loadMapInfo();
    }
  }
}
