
Build instructions
==================
1. Download source code.

2. Edit the 'makeinclude' file: modify at least OUTPUT_PATH so that it points to a directory where the resulting output files can be stored.</li>

3. Type 'make'

That's it! The OUTPUT_PATH directory should now contain a directory 'random-graph_500000'. Open the file '_sample.html' inside that directory, and you should see the above map.



How it works
============

There are two executables in the bin/ directory inside the OUTPUT_PATH directory:
1. json2bin.a - converts a json file containing a graph into a binary form, preparing it for the next step
2. quadbuilder.a - splits up the graph into tiles



These commands are invoked as follows: to for example convert a graph in json_input.json and have the results stored in the directory graph_output_path/, invoke the commands:

  $(OUTPUT_PATH)bin/json2bin.a json_input.json nodes.bin edges.bin
  $(OUTPUT_PATH)bin/quadbuilder.a nodes.bin edges.bin graph_output_path/

In addition, the files shingle.js and shingle.css are needed.

A minimal html file that shows the graph:

<html>
  <head>
    <link rel="stylesheet" href="shingle.css">
    <script src="shingle.js" type="text/javascript"></script>
  </head>
  <body>
    <div id="shinglecontainer" data-width="100%" data-height="6in" data-graph-path="graph_output_path/" ></div>
  </body>
</html>

See '_sample.html' for an example of how to then display the graph.

The primary input file for the tool chain is a json file that contains an array of nodes and an array of edges between the nodes, in the following format:

{
  "nodes": 
  [
    {
      "nodeid": "0",
      "name": "Node number 0",
      "x": -4.69657,
      "y": -111.763,
      "size": 1,
      "community": 644
    },
    
    ...
    
    {
      "nodeid": "99999",
      "name": "Node number 99999",
      "x": -345.672,
      "y": -154.746,
      "size": 1,
      "community": 334
    }
  ],
  "relations": 
  [
    {
      "nodeidA": "0",
      "nodeidB": "489087",
      "strength": 1.000000
    },

    ...

    {
      "nodeidA": "499957",
      "nodeidB": "499964",
      "strength": 1.000000
    }
  ]
}

This distribution comes with one example graph, 'sampledata/random-graph_500000.json', which is the one you see in the banner above.

