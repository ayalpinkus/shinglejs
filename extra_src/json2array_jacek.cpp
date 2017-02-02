#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include "graph.h"
#include "MFRUtils.h"
#include "jsontokenizer.h"

#include <set>
#include <map>
#include <string>

/************************************************

Started 2016 Ayal Pinkus

Read in json arrays and dump as binary files for
faster processing later on.

************************************************/



struct EdgeIds
{
  EdgeIds(long long nodeIdA, long long nodeIdB)
  {
    if (nodeIdA < nodeIdB)
    {
      low  = nodeIdA;
      high = nodeIdB;
    }
    else
    {
      low  = nodeIdB;
      high = nodeIdA;
    }
  };

  EdgeIds(const EdgeIds& other)
  {
    low=other.low;
    high=other.high;
  };

  long long low;
  long long high;
};

bool operator< (const EdgeIds& lhs, const EdgeIds& rhs)
{
  if (lhs.high < rhs.high)
  {
    return true;
  }
  else if (lhs.high > rhs.high)
  {
    return false;
  }
  else
  {
    if (lhs.low < rhs.low)
    {
      return true;
    }
    else 
    {
      return false;
    }
  }
}  


std::set<EdgeIds> edgeids;


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
      if (!strcasecmp(tokenizer.nextToken, "eid"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.SetNodeId(tokenizer.nextToken);
      }
      else if (!strcasecmp(tokenizer.nextToken, "name"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.SetName(tokenizer.nextToken);
      }
      else if (!strcasecmp(tokenizer.nextToken, "author_name"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.SetName(tokenizer.nextToken);
      }
      else if (!strcasecmp(tokenizer.nextToken, "x"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.x = atof(tokenizer.nextToken);
      }
      else if (!strcasecmp(tokenizer.nextToken, "y"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        node.y = atof(tokenizer.nextToken);
      }
      else if (!strcasecmp(tokenizer.nextToken, "community"))
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

{
  static int nodecount=0;
  if ((nodecount & 1023) == 0)
  {
    fprintf(stderr,"\rNode %d",nodecount);
  }
  nodecount++;
}


    if (!strcmp(tokenizer.nextToken, ","))
    {
      tokenizer.Match(",");
    }
  }
  tokenizer.Match("]");
  tokenizer.Match(",");
  tokenizer.Match("edges");
  tokenizer.Match(":");
  tokenizer.Match("[");

  while (!strcmp(tokenizer.nextToken, "["))
  {
    MFREdgeExt edge;
    tokenizer.Match("[");

    edge.SetNodeIdA(tokenizer.nextToken);
    tokenizer.LookAhead();
    tokenizer.Match(",");
    edge.SetNodeIdB(tokenizer.nextToken);
    tokenizer.LookAhead();
    tokenizer.Match("]");
    if (!strcmp(tokenizer.nextToken, ","))
    {
      tokenizer.Match(",");
    }


    EdgeIds thisedge(atoll(edge.nodeidA), atoll(edge.nodeidB));
	
    std::set<EdgeIds>::iterator eentry = edgeids.find(thisedge); 
    if (eentry == edgeids.end())
    {
      edgeids.insert(thisedge);
      fwrite(&edge,sizeof(MFREdgeExt),1,edge_out_file);

{
  static int edgecount=0;
  if ((edgecount & 1023) == 0)
  {
    fprintf(stderr, "\rEdge %d",edgecount);
  }
  edgecount++;
}

    }
  }

  tokenizer.Match("]");
  tokenizer.Match("}");
}



static void processMetaNodeFile(MFRNodeArray& nodes, const char* fname)
{
  JSONTokenizer tokenizer(fname);


  tokenizer.Match("{");
  tokenizer.Match("nodes");
  tokenizer.Match(":");
  tokenizer.Match("[");

  while (!strcmp(tokenizer.nextToken, "{"))
  {
    char nodeid[256];
    int hindex;
    int asjc;
    tokenizer.Match("{");

    while (strcmp(tokenizer.nextToken, "}"))
    {
      if (!strcasecmp(tokenizer.nextToken, "eid"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        strcpy(nodeid,tokenizer.nextToken);
      }
      else if (!strcasecmp(tokenizer.nextToken, "hindex"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        hindex = atoi(tokenizer.nextToken);
      }
      else if (!strcasecmp(tokenizer.nextToken, "asjc"))
      {
        tokenizer.LookAhead();
        tokenizer.Match(":");
        asjc = atoi(tokenizer.nextToken);
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


    MFRNode* node = nodes.LookUp(nodeid);

    if (node == NULL)
    {
      fprintf(stderr,"WARNING: meta data for non-existing node with id %s.\n", nodeid);
    }
    else
    {
      // I don't want to have to handle -1 in shingle.js. asjc 1000 is "general"
      if (asjc<0)
      {
        asjc = 10;
      }
      node->size = hindex;
      node->community = asjc;
    }

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
printf("sizeof(long long)=%lud\n",sizeof(long long));
  if (argc<4)
  {
    fprintf(stderr,"%s data_path node_out_file edge_out_file",argv[0]);
    exit(-1);
  }
  const char* data_path = argv[1];
  const char* node_out_fname = argv[2];
  const char* edge_out_fname = argv[3];
  node_out_file = MFRUtils::OpenFile(node_out_fname,"w");
  edge_out_file = MFRUtils::OpenFile(edge_out_fname,"w");

  char json_in_fname[1024];
  sprintf(json_in_fname,"%snode.json",data_path);

  processFile(json_in_fname);

  fclose(node_out_file);
  fclose(edge_out_file);

  MFRNodeArray nodes(node_out_fname);
  nodes.Sort();

  char json_meta_in_fname[1024];
  sprintf(json_meta_in_fname,"%smeta.json",data_path);
  processMetaNodeFile(nodes, json_meta_in_fname);

  node_out_file = MFRUtils::OpenFile(node_out_fname,"w");
  fwrite(nodes.nodes,nodes.nrnodes*sizeof(MFRNode),1,node_out_file);
  fclose(node_out_file);
  
  return 0;
}
