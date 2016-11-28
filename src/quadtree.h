
#ifndef __QUADTREE_H__
#define __QUADTREE_H__


class LinkedEdges
{
  public:
    LinkedEdges(MFREdgeInt* e, LinkedEdges* n) : edge(e), next(n) {}
    MFREdgeInt* edge;
    LinkedEdges* next;
};

class QuadNode
{
public:
  QuadNode() : splitType(Leaf), splitValue(0), left(NULL), right(NULL), edges(NULL) {quadid[0] = 0;}
  ~QuadNode();

  int Contains(double x, double y);

public:
  enum {
    SplitX,
    SplitY, 
    Leaf
  };
  int splitType;
  double splitValue;
  QuadNode *left;
  QuadNode *right;
  int lowindex;
  int highindex;
  double xmin;
  double xmax;
  double ymin;
  double ymax;
#define MAX_QUADID_LEN 32
  char quadid[MAX_QUADID_LEN];
  LinkedEdges* edges;
};

class MFRNodeArray;

class MFRQuadTree
{
public:
  MFRQuadTree(MFRNodeArray &nds, int aQuadLevels);
  ~MFRQuadTree();
  void BuildTree(int maxNodesPerQuad);
  void BuildTree(QuadNode* r, int maxNodesPerQuad);
  void CalcRect(QuadNode* root);
  int quadContainsNode(QuadNode* root,MFRNode* node);
  void debug_show_sorted(char* name, QuadNode* r);

  void AssignQuadIds();
  void AssignQuadIds(QuadNode *r, char* namebuilder);

  void DetermineStats(MFREdgeArray &edges);
  void FindQuadSizes(QuadNode* r, double& w, double &h, int& n);

public:
  QuadNode *root;
  MFRNodeArray &nodes;
  long* index;
//stats
  int maxNodesPerQuadUsed;
  int buildcount;
  double totalMapWidth;
  double totalMapHeight;
  double averageLineLength; 
  double averageQuadWidth; 
  double averageQuadHeight;

  double minsize;
  double maxsize;
  int quadLevels;
};

#endif // __QUADTREE_H__
