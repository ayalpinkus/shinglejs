#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "graph.h"
#include "MFRUtils.h"


MFRNodeArray::MFRNodeArray(const char* fname)
{
  FILE* fin = MFRUtils::OpenFile(fname, "r");
  fseek(fin,0,SEEK_END);
  long end = ftell(fin);

  nodes=(MFRNode*)malloc(end);
  nrnodes=end/sizeof(MFRNode);

  fseek(fin,0,SEEK_SET);
  fread(nodes,end,1,fin);
  fclose(fin);
}

MFRNodeArray::~MFRNodeArray()
{
  free(nodes);
}

static int nodeCompare(const void *a, const void *b)
{
  MFRNode* node1 = (MFRNode*)a;
  MFRNode* node2 = (MFRNode*)b;
  return strcmp(node1->nodeid, node2->nodeid);
}

void MFRNodeArray::Sort()
{
  qsort(nodes, nrnodes, sizeof(MFRNode), nodeCompare);
}

MFRNode* MFRNodeArray::LookUp(const char* nodeid)
{
  MFRNode test;
  strcpy(test.nodeid,nodeid);
  return (MFRNode*)bsearch(&test, nodes,
                     nrnodes, sizeof(MFRNode),
                     nodeCompare);
}


void MFRNodeArray::debug_show_if_sorted(int nr)
{
  int i;
  if (nr > nrnodes) 
  {
    nr = nrnodes;
  }
  fprintf(stderr, "Showing first %d nodes:\n",nr);
  for (i=0;i<nr;i++)
  {
    fprintf(stderr, "\t%s\n",nodes[i].nodeid);
  }
}


MFREdgeArray::MFREdgeArray(const char* fname)
{
  FILE* fin = MFRUtils::OpenFile(fname, "r");
  fseek(fin,0,SEEK_END);
  long end = ftell(fin);

  edges=(MFREdge*)malloc(end);
  nredges=end/sizeof(MFREdge);

  fseek(fin,0,SEEK_SET);
  fread(edges,end,1,fin);
  fclose(fin);
}

MFREdgeArray::~MFREdgeArray()
{
  free(edges);
}
