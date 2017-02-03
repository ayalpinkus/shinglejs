#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "graph.h"
#include "MFRUtils.h"


MFRNode::~MFRNode()
{
  SetName(NULL);
  SetNodeId(NULL);
}



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
  return strcmp(node1->nodeidp, node2->nodeidp);
}

void MFRNodeArray::Sort()
{
  qsort(nodes, nrnodes, sizeof(MFRNode), nodeCompare);
}

MFRNode* MFRNodeArray::LookUp(const char* nodeid)
{
  MFRNode test;
  test.SetNodeId(nodeid);
  return (MFRNode*)bsearch(&test, nodes,
                     nrnodes, sizeof(MFRNode),
                     nodeCompare);
}

void MFRNodeArray::CleanNames()
{
  int i;
  for (i=0;i<nrnodes;i++)
  {
    char* ptr;

int debug=0;
if ( (ptr = strpbrk(nodes[i].namep, "\\\"%%")) != NULL)
{
  debug=1;
}
if (debug)
{
  fprintf(stderr,"Name to be cleaned: \"%s\"\n", nodes[i].namep);fflush(stderr);
}

    while ( (ptr = strpbrk(nodes[i].namep, "\\\"%%")) != NULL)
    {
      *ptr = ' ';
    }

if (debug)
{
  fprintf(stderr,"\tcleaned to: \"%s\"\n", nodes[i].namep);fflush(stderr);
}


  }
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
    fprintf(stderr, "\t%s\n",nodes[i].nodeidp);
  }
}


MFREdgeArray::MFREdgeArray(const char* fname, MFRNodeArray& nodes)
{
  FILE* fin = MFRUtils::OpenFile(fname, "r");

  setvbuf(fin,NULL, _IOFBF, 240000000);

  fseek(fin,0,SEEK_END);
  long end = ftell(fin);
  int nredges_saved=end/sizeof(MFREdgeExt);

  nredges = 0;

  edges=(MFREdgeInt*)malloc(nredges_saved*sizeof(MFREdgeInt));

  fseek(fin,0,SEEK_SET);

  MFREdgeExt extEdge;

  int i;
  for (i=0;i<nredges_saved;i++)
  {
    fread(&extEdge,sizeof(MFREdgeExt),1,fin);
    edges[nredges].nodeA = nodes.LookUp(extEdge.nodeidA);
    edges[nredges].nodeB = nodes.LookUp(extEdge.nodeidB);
    
    if (edges[nredges].nodeA == NULL)
    {
      fprintf(stderr,"Warning: edge %d: id %s for edge not found.\n", i, extEdge.nodeidA);
      continue;
    }
    if (edges[nredges].nodeB == NULL)
    {
      fprintf(stderr,"Warning: edge %d: id %s for edge not found.\n",i, extEdge.nodeidB);
      continue;
    }
    nredges++;
  }
  fclose(fin);

  fprintf(stderr, "%d edges read, %d remaining.\n",nredges_saved, nredges);


/*TODO remove?
fprintf(stderr,"@@@@@@@@@@@@@@\n");
fprintf(stderr,"@@@@@@@@@@@@@@\n");
fprintf(stderr,"@@@@@@@@@@@@@@\n");
int diff = &nodes.nodes[1] - &nodes.nodes[0];
fprintf(stderr,"\t diff = %d\n",diff);

fprintf(stderr,"@@@@@@@@@@@@@@\n");
fprintf(stderr,"@@@@@@@@@@@@@@\n");
fprintf(stderr,"@@@@@@@@@@@@@@\n");
*/

/*TODO remove?
  int i;
  for (i=0;i<nredges;i++)
  {
    edges[i].nodeA = nodes.LookUp(edges[i].nodeidA);
    edges[i].nodeB = nodes.LookUp(edges[i].nodeidB);
  }
*/
}

MFREdgeArray::~MFREdgeArray()
{
  free(edges);
}
