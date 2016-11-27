#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

#include <set>
#include <map>
#include <string>

#include "graph.h"
#include "MFRUtils.h"
#include "quadtree.h"
#include "hashtable.h"


#define SEPARATE_CLICKABLE_EDGES

#ifdef SEPARATE_CLICKABLE_EDGES
#define EDGECOUNT_LIMIT 100
#endif // SEPARATE_CLICKABLE_EDGES

static int quadLevels=1;


static int FormatVersionNumber()
{
  if (quadLevels)
  {
    return 1;
  }
  return 0;
}


static void write_root(FILE* mapinfo_json_file, QuadNode* root)
{

  fprintf(mapinfo_json_file,"{\n");

  fprintf(mapinfo_json_file,"    \"xmin\": %f,\n", root->xmin);
  fprintf(mapinfo_json_file,"    \"xmax\": %f,\n", root->xmax);
  fprintf(mapinfo_json_file,"    \"ymin\": %f,\n", root->ymin);
  fprintf(mapinfo_json_file,"    \"ymax\": %f,\n", root->ymax);

  switch (root->splitType)
  {
    case QuadNode::SplitX:
    case QuadNode::SplitY:
      if (root->splitType == QuadNode::SplitX)
      {
        fprintf(mapinfo_json_file," \"type\" : \"SplitX\", \n");
      }
      else
      {
        fprintf(mapinfo_json_file," \"type\" : \"SplitY\", \n");
      }
      fprintf(mapinfo_json_file,"    \"splitValue\": %f,\n", root->splitValue);

      fprintf(mapinfo_json_file," \"left\" : \n");
      write_root(mapinfo_json_file, root->left);

      fprintf(mapinfo_json_file,",\n");

      fprintf(mapinfo_json_file," \"right\" : \n");
      write_root(mapinfo_json_file, root->right);
      break;
    case QuadNode::Leaf:
      fprintf(mapinfo_json_file," \"type\" : \"Leaf\" \n");
      break;
    default:
      fprintf(stderr,"ERROR: unrecognized quad node type %d\n",root->splitType);
      exit(-1);
  }

  fprintf(mapinfo_json_file,"}\n");

}



int nrquadnodeswritten = 0;

static void WriteLeafJSON(char* rootname, MFRNodeArray &nodes, MFREdgeArray &edges, MFRQuadTree &quadTree, QuadNode* root)
{
  FILE* json_out_file = MFRUtils::OpenFile(rootname, "w");
  int nredges = edges.nredges;
  int first;

  fprintf(json_out_file,"{\n");

  fprintf(json_out_file,"  \"idmap\": {\n");

  first = 1;
  {
    int i;
    for (i=root->lowindex;i<root->highindex;i++)
    {
      int index = quadTree.index[i];
      if (!first)
      {
        fprintf(json_out_file,"    ,");
      }
      first = 0;
      fprintf(json_out_file,"  \"%s\": %d\n", nodes.nodes[index].nodeid,i-root->lowindex);
    }
  }
  fprintf(json_out_file,"  },\n");

  fprintf(json_out_file,"  \"referenced\": [\n");

  std::set<std::string> quadsreferenced;
  first = 1;


  int ecount = 0;

  LinkedEdges* edgelist = root->edges;
  while (edgelist)
  {
    MFRNode *nodeA = edgelist->edge->nodeA;
    MFRNode *nodeB = edgelist->edge->nodeB;

    if (nodeB->quadNode == root && nodeA->quadNode != root)
    {
      if (quadsreferenced.find(nodeA->quadNode->quadid) == quadsreferenced.end())
      {
        quadsreferenced.insert(nodeA->quadNode->quadid);
        if (!first)
        {
          fprintf(json_out_file,"    ,");
        }
        first = 0;
        fprintf(json_out_file," \"%s\"\n", nodeA->quadNode->quadid);
      }
    }
    if (nodeA->quadNode == root && nodeB->quadNode != root)
    {
      if (quadsreferenced.find(nodeB->quadNode->quadid) == quadsreferenced.end())
      {
        quadsreferenced.insert(nodeB->quadNode->quadid);
        if (!first)
        {
          fprintf(json_out_file,"    ,");
        }
	first = 0;
        fprintf(json_out_file," \"%s\"\n", nodeB->quadNode->quadid);
      }
    }
    edgelist = edgelist->next;

#ifdef EDGECOUNT_LIMIT
    ecount++;
    if (ecount>EDGECOUNT_LIMIT)
    {
      break;
    }
#endif // EDGECOUNT_LIMIT
  }

  fprintf(json_out_file,"  ],\n");


  fprintf(json_out_file,"  \"header\": {\n");
  fprintf(json_out_file,"    \"xmin\": %f,\n", root->xmin);
  fprintf(json_out_file,"    \"xmax\": %f,\n", root->xmax);
  fprintf(json_out_file,"    \"ymin\": %f,\n", root->ymin);
  fprintf(json_out_file,"    \"ymax\": %f\n", root->ymax);

  fprintf(json_out_file,"  },\n");
  fprintf(json_out_file,"  \"nodes\": [\n");

  first = 1;

  {
    int i;
    for (i=root->lowindex;i<root->highindex;i++)
    {
      int index = quadTree.index[i];
      if (!first)
      {
        fprintf(json_out_file,"    ,");
      }
      first = 0;
      fprintf(json_out_file,"    {\n");
      fprintf(json_out_file,"      \"nodeid\": \"%s\",\n",nodes.nodes[index].nodeid);
      fprintf(json_out_file,"      \"name\": \"%s\",\n",nodes.nodes[index].name);
      fprintf(json_out_file,"      \"x\": %f,\n",nodes.nodes[index].x);
      fprintf(json_out_file,"      \"y\": %f,\n",nodes.nodes[index].y);
      fprintf(json_out_file,"      \"size\": %f,\n",nodes.nodes[index].size);
      fprintf(json_out_file,"      \"community\": %ld\n",nodes.nodes[index].community);
      fprintf(json_out_file,"    }\n");
    }
  }
  fprintf(json_out_file,"  ],\n");
  fprintf(json_out_file,"  \"relations\": [\n");


  nrquadnodeswritten += (root->highindex - root->lowindex);
  fprintf(stderr,"%d/%d\r",nrquadnodeswritten,nodes.nrnodes);

  first = 1;
  

  edgelist = root->edges;
  ecount=0;
  while (edgelist)
  {
    MFRNode *nodeA = edgelist->edge->nodeA;
    MFRNode *nodeB = edgelist->edge->nodeB;

    if (!first)
    {
      fprintf(json_out_file,"    ,");
    }
    first = 0;
    fprintf(json_out_file,"    {\n");

    fprintf(json_out_file,"      \"quadA\": \"%s\",\n", nodeA->quadNode->quadid);
    fprintf(json_out_file,"      \"nodeidA\": \"%s\",\n", nodeA->nodeid);
    fprintf(json_out_file,"      \"quadB\": \"%s\",\n", nodeB->quadNode->quadid);
    fprintf(json_out_file,"      \"nodeidB\": \"%s\"\n", nodeB->nodeid);
    fprintf(json_out_file,"    }\n");

    edgelist = edgelist->next;


#ifdef EDGECOUNT_LIMIT
    ecount++;
    if (ecount>EDGECOUNT_LIMIT)
    {
      break;
    }
#endif // EDGECOUNT_LIMIT
  }


  fprintf(json_out_file,"    ]\n");
  fprintf(json_out_file,"}\n");

  fclose(json_out_file);
}

static void WriteRootJSON(const char* fnamebuilder, MFRNodeArray &nodes, MFREdgeArray &edges, MFRQuadTree &quadTree, QuadNode *root)
{
  char rootname[1024];
  char leftname[1024];
  char rightname[1024];

  sprintf(rootname,"%s.json",fnamebuilder);
  sprintf(leftname,"%sl",fnamebuilder);
  sprintf(rightname,"%sr",fnamebuilder);

  switch (root->splitType)
  {
    case QuadNode::SplitX:
    case QuadNode::SplitY:
      if (quadLevels)
      {
        WriteLeafJSON(rootname, nodes, edges, quadTree, root);
      }
      WriteRootJSON(leftname, nodes, edges, quadTree, root->left);
      WriteRootJSON(rightname, nodes, edges, quadTree, root->right);
      break;
    case QuadNode::Leaf:
      WriteLeafJSON(rootname, nodes, edges, quadTree, root);
      break;
    default:
      fprintf(stderr,"ERROR: unrecognized quad node type %d\n",root->splitType);
      exit(-1);

  }
}

static void WriteMap(const char* map_out_path, MFRNodeArray &nodes, MFREdgeArray &edges, MFRQuadTree &quadTree)
{
  fprintf(stderr,"Writing mapinfo\n");fflush(stderr);
  {
    char mapinfo_json_fname[1024];
    sprintf(mapinfo_json_fname,"%smapinfo.json", map_out_path);
    FILE* mapinfo_json_file = MFRUtils::OpenFile(mapinfo_json_fname,"w");
    fprintf(mapinfo_json_file,"{\n");

    fprintf(mapinfo_json_file,"  \"minsize\" : %f,\n", quadTree.minsize);
    fprintf(mapinfo_json_file,"  \"maxsize\" : %f,\n", quadTree.maxsize);
    fprintf(mapinfo_json_file,"  \"data-format-version\" : %d,\n", FormatVersionNumber() );
    fprintf(mapinfo_json_file,"  \"maxNodesPerQuad\" : %d,\n",quadTree.maxNodesPerQuadUsed);
    fprintf(mapinfo_json_file,"  \"totalMapWidth\" : %f,\n",quadTree.totalMapWidth);
    fprintf(mapinfo_json_file,"  \"totalMapHeight\" : %f,\n",quadTree.totalMapHeight);
    fprintf(mapinfo_json_file,"  \"averageLineLength\" : %f,\n", quadTree.averageLineLength);
    fprintf(mapinfo_json_file,"  \"averageQuadWidth\" : %f,\n", quadTree.averageQuadWidth);
    fprintf(mapinfo_json_file,"  \"averageQuadHeight\" : %f,\n", quadTree.averageQuadHeight);

    fprintf(mapinfo_json_file,"  \"quadtree\" : \n");

    write_root(mapinfo_json_file, quadTree.root);

    fprintf(mapinfo_json_file,"}\n");

    fclose(mapinfo_json_file);
  }


  fprintf(stderr,"Writing rootjson\n");fflush(stderr);
  {
    char fnamebuilder[1024];
    sprintf(fnamebuilder,"%squad_",map_out_path);
    WriteRootJSON(fnamebuilder, nodes, edges, quadTree, quadTree.root);
  }
  fprintf(stderr,"Finished writing map\n");fflush(stderr);

}







static void WriteHashtable(const char* map_out_path, MFRNodeArray &nodes, MFREdgeArray &edges, MFRQuadTree &quadTree)
{
  HashTable hashtable(map_out_path);

  int i;
  for (i=0;i<nodes.nrnodes;i++)
  {
    int bin = hashtable.Hash(nodes.nodes[i].nodeid);
    if (!hashtable.first[bin])
    {
      fprintf(hashtable.buckets[bin],",\n");
    }
    hashtable.first[bin] = 0;
    fprintf(hashtable.buckets[bin],"\"%s\" : [%f, %f ]\n",nodes.nodes[i].nodeid, nodes.nodes[i].x, nodes.nodes[i].y);
  }
}


int main(int argc, char** argv)
{
  if (argc<4)
  {
    fprintf(stderr,"%s node_in_file edge_in_file map_out_path",argv[0]);
    exit(-1);
  }
  const char* node_in_fname = argv[1];
  const char* edge_in_fname = argv[2];
  const char* map_out_path = argv[3];
  MFRNodeArray nodes(node_in_fname);
  MFREdgeArray edges(edge_in_fname);

//  nodes.debug_show_if_sorted(12);
  
  MFRQuadTree quadTree(nodes, quadLevels);
  
#define MAX_NODES_PER_QUAD 50  
  
  quadTree.BuildTree(MAX_NODES_PER_QUAD);
  quadTree.AssignQuadIds();
  quadTree.DetermineStats(edges);

  fprintf(stderr,"Writing nodeid lookup table\n");fflush(stderr);
  WriteHashtable(map_out_path, nodes, edges, quadTree);

  fprintf(stderr,"Writing out quadtree\n");fflush(stderr);

  nrquadnodeswritten = 0;

  int nredges = edges.nredges;
  int i;
  for (i=0;i<nredges;i++)
  {
    edges.edges[i].nodeA = nodes.LookUp(edges.edges[i].nodeidA);
    edges.edges[i].nodeB = nodes.LookUp(edges.edges[i].nodeidB);
    edges.edges[i].nodeA->quadNode->edges = new LinkedEdges(&edges.edges[i], edges.edges[i].nodeA->quadNode->edges);
    if (edges.edges[i].nodeA->quadNode != edges.edges[i].nodeB->quadNode)
    {
      edges.edges[i].nodeB->quadNode->edges = new LinkedEdges(&edges.edges[i], edges.edges[i].nodeB->quadNode->edges);
    }
  }
  fprintf(stderr, "Done assigning edges to quads\n");fflush(stderr);

  WriteMap(map_out_path, nodes, edges, quadTree);
  fprintf(stderr,"Finisned\n");fflush(stderr);
  return 0;
}


