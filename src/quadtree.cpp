#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

#include "graph.h"
#include "quadtree.h"




QuadNode::~QuadNode()
{
  if (left) delete left;
  if (right) delete right;

  while (edges)
  {
    LinkedEdges* next = edges->next;
    delete edges;
    edges = next;
  }

}

int QuadNode::Contains(double x, double y)
{
  if (x<xmin) return 0;
  if (x>xmax) return 0;
  if (y<ymin) return 0;
  if (y>ymax) return 0;
  return 1;
}



void MFRQuadTree::CalcRect(QuadNode* root)
{
  long i;
  root->xmin=1000000;
  root->xmax=-1000000;
  root->ymin=1000000;
  root->ymax=-1000000;

  for (i=root->lowindex;i<root->highindex;i++)
  {
    double x=nodes.nodes[index[i]].x;
    double y=nodes.nodes[index[i]].y;

    if (x < root->xmin) root->xmin=x;
    if (x > root->xmax) root->xmax=x;
    if (y < root->ymin) root->ymin=y;
    if (y > root->ymax) root->ymax=y;
  }
}


MFRQuadTree::MFRQuadTree(MFRNodeArray &nds, int aQuadLevels) : nodes(nds), quadLevels(aQuadLevels)
{
  index = (long*)malloc(nodes.nrnodes*sizeof(long));
  maxNodesPerQuadUsed = 1;

  root = new QuadNode();
  root->splitType = QuadNode::Leaf;

  root->lowindex=0;
  root->highindex=nodes.nrnodes;
  minsize = 100;
  maxsize = -100;

  long i;
  for (i=0;i<nodes.nrnodes;i++)
  {
    double size=nodes.nodes[i].size;
    if (size<minsize) minsize=size;
    if (size>maxsize) maxsize=size;
    index[i] = i;
  }
  CalcRect(root);
}

MFRQuadTree::~MFRQuadTree()
{
  free(index);
  if (root)
  {
    delete root;
  }
}




MFRNodeArray *global_mfr_node_array = NULL;

int xcompare(const void *a, const void *b)
{
  long indexa = *(long*)a;
  long indexb = *(long*)b;
  MFRNodeArray *nds = (MFRNodeArray *)global_mfr_node_array;
  double diff = (nds->nodes[indexb].x - nds->nodes[indexa].x);
  if (diff>0) return 1;
  else if (diff<0) return -1;
  else return 0;
}


int ycompare(const void *a, const void *b)
{
  long indexa = *(long*)a;
  long indexb = *(long*)b;
  MFRNodeArray *nds = (MFRNodeArray *)global_mfr_node_array;
  double diff = (nds->nodes[indexb].y - nds->nodes[indexa].y);
  if (diff>0) return 1;
  else if (diff<0) return -1;
  else return 0;
}


int sizecompare(const void *a, const void *b)
{
  long indexa = *(long*)a;
  long indexb = *(long*)b;
  MFRNodeArray *nds = (MFRNodeArray *)global_mfr_node_array;
  double diff = (nds->nodes[indexb].size - nds->nodes[indexa].size);
  if (diff>0) return 1;
  else if (diff<0) return -1;
  else return 0;
}

void MFRQuadTree::BuildTree(int maxNodesPerQuad)
{
  maxNodesPerQuadUsed = maxNodesPerQuad;

  buildcount = 0;
fprintf(stderr,"Start building\n");fflush(stderr);
  BuildTree(root, maxNodesPerQuad);
fprintf(stderr,"\nFinish building\n");fflush(stderr);
}

void MFRQuadTree::debug_show_sorted(char* name, QuadNode* r)
{
  int i;
  printf("SORTED: %s\n", name);
  for (i=r->lowindex;i<r->highindex;i++)
  {
    int ind = index[i];
    printf("\t%f %f\n",nodes.nodes[ind].x, nodes.nodes[ind].y);
  }
  printf("\n\n\n");
}


void MFRQuadTree::BuildTree(QuadNode* r, int maxNodesPerQuad)
{


  /* just to make sure there are enough nodes to split after assigning
   * maxNodesPerQuad to this node.
   */
  int realMax = maxNodesPerQuad;
  if (quadLevels)
  {
    realMax = (realMax*3)/2;
  }

  if ((r->highindex - r->lowindex) > realMax)
  {
    int thislow=0, thishigh=0;

    if (quadLevels)
    {
      global_mfr_node_array = &nodes;
      qsort(&index[r->lowindex], r->highindex-r->lowindex, sizeof(long),sizecompare);
      thislow = r->lowindex;
      thishigh = thislow + maxNodesPerQuad;
      r->lowindex = thishigh;
    }

    if (r->xmax-r->xmin > r->ymax-r->ymin)
    {
      global_mfr_node_array = &nodes;
      qsort(&index[r->lowindex], r->highindex-r->lowindex, sizeof(long),xcompare);

//debug_show_sorted("Sorted X", r);

      r->splitType = QuadNode::SplitX;
      long midindex = r->lowindex + (r->highindex-r->lowindex)/2;
      r->splitValue = nodes.nodes[index[midindex]].x;

      r->left = new QuadNode();
      r->left->lowindex = r->lowindex;
      r->left->highindex = midindex;
      CalcRect(r->left);

      r->right = new QuadNode();
      r->right->lowindex = midindex;;
      r->right->highindex = r->highindex;
      CalcRect(r->right);

      BuildTree(r->left, maxNodesPerQuad);
      BuildTree(r->right, maxNodesPerQuad);
    }
    else
    {
      global_mfr_node_array = &nodes;
      qsort(&index[r->lowindex], r->highindex-r->lowindex, sizeof(long),ycompare);


//debug_show_sorted("Sorted Y", r);

      r->splitType = QuadNode::SplitY;
      long midindex = r->lowindex + (r->highindex-r->lowindex)/2;
      r->splitValue = nodes.nodes[index[midindex]].y;

      r->left = new QuadNode();
      r->left->lowindex = r->lowindex;
      r->left->highindex = midindex;
      CalcRect(r->left);

      r->right = new QuadNode();
      r->right->lowindex = midindex;;
      r->right->highindex = r->highindex;
      CalcRect(r->right);

      BuildTree(r->left, maxNodesPerQuad);
      BuildTree(r->right, maxNodesPerQuad);
    }
    if (quadLevels)
    {
      r->lowindex = thislow;
      r->highindex = thishigh;
    }
  }
  else
  {
    buildcount += r->highindex - r->lowindex;
   fprintf(stderr,"%d/%d\r",buildcount,nodes.nrnodes);fflush(stderr);
  }
}


int MFRQuadTree::quadContainsNode(QuadNode* root,MFRNode* node)
{
  int i;
  for (i=root->lowindex;i<root->highindex;i++)
  {
    int ind = index[i];
    if (!strcmp(nodes.nodes[ind].nodeidp,node->nodeidp))
    {
      return 1;
    }
  }
  return 0;
}



void MFRQuadTree::FindQuadSizes(QuadNode* r, double& w, double &h, int& n)
{
  switch (r->splitType)
  {
    case QuadNode::SplitX:
    case QuadNode::SplitY:
      /* if (r->left) */  FindQuadSizes(r->left, w, h, n);
      /* if (r->right) */ FindQuadSizes(r->right, w, h, n);
      break;
    case QuadNode::Leaf:
      w += (r->xmax-r->xmin);
      h += (r->ymax-r->ymin);
      n++;
      break;
  }
}



void MFRQuadTree::DetermineStats(MFREdgeArray &edges)
{
  int i;

  int nrlens=0;
  double totalsum=0;
  for (i=0;i<edges.nredges;i++)
  {
    MFRNode* nodeA = edges.edges[i].nodeA; // nodes.LookUp(edges.edges[i].nodeidA);
    MFRNode* nodeB = edges.edges[i].nodeB; // nodes.LookUp(edges.edges[i].nodeidB);
    if (nodeA == NULL || nodeB == NULL)
    {
      if (nodeA == NULL)
      {
        fprintf(stderr, "WARNING: node missing from node list: %s\n", "@@@" /* edges.edges[i].nodeidA */ );
      }
      if (nodeB == NULL)
      {
        fprintf(stderr, "WARNING: node missing from node list: %s\n","@@@" /* edges.edges[i].nodeidB */);
      }
    }
    else
    {
      double dx = nodeB->x-nodeA->x;
      double dy = nodeB->y-nodeA->y;
      double length = sqrt(dx*dx+dy*dy);
      totalsum+=length;
      nrlens++;
    }
  }

  double w=0;
  double h=0;
  int n=0;

  FindQuadSizes(root, w, h, n);

  totalMapWidth = root->xmax - root->xmin;
  totalMapHeight = root->ymax - root->ymin;
  averageLineLength = totalsum/nrlens;
  averageQuadWidth = w/n;
  averageQuadHeight = h/n;

  fprintf(stderr,"Nr nodes = %d\n",nodes.nrnodes);
  fprintf(stderr,"Nr edges = %d\n",edges.nredges);

  fprintf(stderr,"Max nodes per quad = %d\n",maxNodesPerQuadUsed);
  fprintf(stderr,"Total map width = %f\n",totalMapWidth);
  fprintf(stderr,"Total map height = %f\n",totalMapHeight);
  fprintf(stderr,"Average line length = %f\n", averageLineLength);
  fprintf(stderr,"Average quad width = %f\n", averageQuadWidth);
  fprintf(stderr,"Average quad height = %f\n", averageQuadHeight);
}


void MFRQuadTree::AssignQuadIds()
{
  char namebuilder[MAX_QUADID_LEN];
  strcpy(namebuilder,"quad_");
  AssignQuadIds(root, namebuilder);
}

void MFRQuadTree::AssignQuadIds(QuadNode *r, char* namebuilder)
{
  char leftname[MAX_QUADID_LEN];
  char rightname[MAX_QUADID_LEN];
  sprintf(leftname,"%sl",namebuilder);
  sprintf(rightname,"%sr",namebuilder);

  switch (r->splitType)
  {
    case QuadNode::SplitX:
    case QuadNode::SplitY:
      if (quadLevels)
      {
        strcpy(r->quadid,namebuilder);
        {
          int i;
          for (i=r->lowindex;i<r->highindex;i++)
	  {
	    nodes.nodes[index[i]].quadNode = r;
          }
        }
      }
      AssignQuadIds(r->left, leftname);
      AssignQuadIds(r->right, rightname);
      break;
    case QuadNode::Leaf:
      strcpy(r->quadid,namebuilder);
      {
        int i;
        for (i=r->lowindex;i<r->highindex;i++)
	{
	  nodes.nodes[index[i]].quadNode = r;
	}
      }
      break;
  }
}
