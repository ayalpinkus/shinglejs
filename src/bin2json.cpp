#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "graph.h"
#include "MFRUtils.h"
#include "jsontokenizer.h"

/************************************************

Started 2016 Ayal Pinkus

************************************************/





static void WriteJSONfile(FILE*f, MFRNodeArray &nodes, MFREdgeArray &edges)
{
  int i;

//  fprintf(f,"var graph = \n");
  fprintf(f,"{\n");
  fprintf(f,"  \"nodes\": [\n");
  for (i=0;i<nodes.nrnodes;i++)
  {
    fprintf(f,"    {\n");
    fprintf(f,"      \"nodeid\": \"%s\",\n", nodes.nodes[i].nodeidp);
    fprintf(f,"      \"name\": \"%s\",\n", nodes.nodes[i].namep);
    fprintf(f,"      \"x\": %g,\n", nodes.nodes[i].x);
    fprintf(f,"      \"y\": %g,\n", nodes.nodes[i].y);
    fprintf(f,"      \"size\": %g,\n", nodes.nodes[i].size);
    fprintf(f,"      \"community\": %ld\n", nodes.nodes[i].community);

    fprintf(f,"    }");
    if (i<nodes.nrnodes-1)
    {
      fprintf(f,",\n");
    }
    else
    {
      fprintf(f,"\n");
    }
  }
  fprintf(f,"  ],\n");
  fprintf(f,"  \"relations\": [\n");
  for (i=0;i<edges.nredges;i++)
  {

    fprintf(f,"    {\n");

    fprintf(f,"      \"nodeidA\": \"%s\",\n", edges.edges[i].nodeA->nodeidp /* edges.edges[i].nodeidA */ );
    fprintf(f,"      \"nodeidB\": \"%s\",\n", edges.edges[i].nodeB->nodeidp /* edges.edges[i].nodeidB */ );


    fprintf(f,"      \"strength\": %f\n", 1.0);
    fprintf(f,"    }\n");
    if (i<edges.nredges-1)
    {
      fprintf(f,",\n");
    }
    else
    {
      fprintf(f,"\n");
    }
  }
  fprintf(f,"    ]\n");
  fprintf(f,"}\n");
//  fprintf(f,";\n");

}




int main(int argc, char** argv)
{
  if (argc<4)
  {
    fprintf(stderr,"%s json_out_file node_in_file edge_in_file",argv[0]);
    exit(-1);
  }
  const char* json_out_fname = argv[1];
  const char* node_in_fname = argv[2];
  const char* edge_in_fname = argv[3];

 
  MFRNodeArray nodes(node_in_fname);
  MFREdgeArray edges(edge_in_fname, nodes);

  FILE* json_out_file = MFRUtils::OpenFile(json_out_fname,"w");
  WriteJSONfile(json_out_file, nodes, edges);
  fclose(json_out_file);
  
  return 0;
}
