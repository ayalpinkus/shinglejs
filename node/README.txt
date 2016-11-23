The nodejs mapServer.js can be used to increase performance when using very large graphs.

You can run mapServer.js in a directory of choice (or the preinstalled dir), but preferably outside the public www directory.

Use of this requires the expressjs module, see http://expressjs.com
to install use npm install express

To run mapServer.js for a graph:
- create a config file for the graph (see the example mapConfigRandomGraph500000.js config file)
- start using node mapServer <mapConfigFile> (no need to supply .js extensions)

To run in the background you can use the & and optionally the nohup to keep it running
- nohup node mapServer <mapConfigFile> &

Or install like you would install any other deamon process.

Don't forget: in your frontend, use the host:port/uri sepcified in the config file.
