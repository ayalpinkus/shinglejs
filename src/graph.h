
#ifndef __GRAPH_H__
#define __GRAPH_H__



#define MAX_NODE_NAME_LENGTH 128
#define MAX_SCOPUS_ID_LENGTH 32


class QuadNode;

struct MFRNode
{
  inline MFRNode() : x(0), y(0), size(0), community(0), quadNode(NULL) {name[0] = 0; nodeid[0] = 0;}
  char name[MAX_NODE_NAME_LENGTH];
  char nodeid[MAX_SCOPUS_ID_LENGTH];
  double x;
  double y;
  double size;
  long community;
  QuadNode* quadNode;
};

struct MFREdge
{
  inline MFREdge() : nodeA(NULL), nodeB(NULL) {nodeidA[0] = 0; nodeidB[0] = 0;}
  char nodeidA[MAX_SCOPUS_ID_LENGTH];
  char nodeidB[MAX_SCOPUS_ID_LENGTH];
  MFRNode* nodeA;
  MFRNode* nodeB;
};

class MFRNodeArray
{
public:
  MFRNodeArray(const char* fname);
  ~MFRNodeArray();
  void Sort();
  MFRNode* LookUp(const char* nodeid);

  void debug_show_if_sorted(int nr);

public:
  MFRNode* nodes;
  int nrnodes;
};

class MFREdgeArray
{
public:
  MFREdgeArray(const char* fname);
  ~MFREdgeArray();
public:
  MFREdge* edges;
  int nredges;
};


#endif // __GRAPH_H__

