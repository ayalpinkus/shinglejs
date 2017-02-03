#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "graph.h"
#include "MFRUtils.h"
#include "jsontokenizer.h"

/************************************************

Started 2016 Ayal Pinkus

Read in json arrays and dump as binary files for
faster processing later on.

************************************************/



static FILE* json_in_file = NULL;
static FILE* node_out_file = NULL;
static FILE* edge_out_file = NULL;

static void processFile(const char* fname)
{
  JSONTokenizer tokenizer(fname);

  //
  // Read nodes
  //
  tokenizer.Match("{");
  tokenizer.Match("nodes");
  tokenizer.Match(":");
  tokenizer.Match("[");

  while (!strcmp(tokenizer.nextToken, "{"))
  {
    MFRNode node;
    tokenizer.Match("{");

    while (strcmp(tokenizer.nextToken, "}"))
    {
      if (!strcmp(tokenizer.nextToken, "nodeid"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.SetNodeId(tokenizer.nextToken);
      }
      else if (!strcmp(tokenizer.nextToken, "name"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.SetName(tokenizer.nextToken);
      }
      else if (!strcmp(tokenizer.nextToken, "x"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.x = atof(tokenizer.nextToken);
      }
      else if (!strcmp(tokenizer.nextToken, "y"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.y = atof(tokenizer.nextToken);
      }
      else if (!strcmp(tokenizer.nextToken, "size"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.size = node.level = atof(tokenizer.nextToken);
      }
      else if (!strcmp(tokenizer.nextToken, "community"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.community = atol(tokenizer.nextToken);
      }
      else
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
      }
      tokenizer.LookAhead();
      if (!strcmp(tokenizer.nextToken, ","))
      {
        tokenizer.Match(",");
      }
    }
    tokenizer.Match("}");
    fwrite(&node,sizeof(MFRNode),1,node_out_file);
    if (!strcmp(tokenizer.nextToken, ","))
    {
      tokenizer.Match(",");
    }
  }
  tokenizer.Match("]");
  tokenizer.Match(",");
  tokenizer.Match("relations");
  tokenizer.Match(":");
  tokenizer.Match("[");




  while (!strcmp(tokenizer.nextToken, "{"))
  {
    MFREdgeExt edge;
    tokenizer.Match("{");

    while (strcmp(tokenizer.nextToken, "}"))
    {
      if (!strcmp(tokenizer.nextToken, "nodeidA"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        edge.SetNodeIdA(tokenizer.nextToken);
      }
      else if (!strcmp(tokenizer.nextToken, "nodeidB"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        edge.SetNodeIdB(tokenizer.nextToken);
      }
      else
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
      }
      tokenizer.LookAhead();
      if (!strcmp(tokenizer.nextToken, ","))
      {
        tokenizer.Match(",");
      }
    }
    tokenizer.Match("}");
    fwrite(&edge,sizeof(MFREdgeExt),1,edge_out_file);
    if (!strcmp(tokenizer.nextToken, ","))
    {
      tokenizer.Match(",");
    }
  }


  tokenizer.Match("]");
  tokenizer.Match("}");
}


int main(int argc, char** argv)
{
  if (argc<4)
  {
    fprintf(stderr,"%s json_in_file node_out_file edge_out_file",argv[0]);
    exit(-1);
  }
  const char* json_in_fname = argv[1];
  const char* node_out_fname = argv[2];
  const char* edge_out_fname = argv[3];
  node_out_file = MFRUtils::OpenFile(node_out_fname,"w");
  edge_out_file = MFRUtils::OpenFile(edge_out_fname,"w");

  processFile(json_in_fname);

  fclose(node_out_file);
  fclose(edge_out_file);
  
  MFRNodeArray nodes(node_out_fname);
  nodes.Sort();
  node_out_file = MFRUtils::OpenFile(node_out_fname,"w");
  fwrite(nodes.nodes,nodes.nrnodes*sizeof(MFRNode),1,node_out_file);
  fclose(node_out_file);
  
  return 0;
}
