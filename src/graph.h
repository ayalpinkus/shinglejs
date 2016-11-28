
#ifndef __GRAPH_H__
#define __GRAPH_H__



#define MAX_NODE_NAME_LENGTH 128
#define MAX_SCOPUS_ID_LENGTH 32



class QuadNode;

struct MFRNode
{



  inline MFRNode() : x(0), y(0), size(0), community(0), quadNode(NULL)
  { 
    SetName("");
    SetNodeId("");
  }

  inline void SetName(const char* aname)
  {
    namep[0]=0;
    if (aname)
    {
      strcpy(namep,aname);
    }
  }

  inline void SetNodeId(const char* anodeid)
  {
    nodeidp[0]=0;
    if (anodeid)
    {
      strcpy(nodeidp,anodeid);
    }
  }
  char namep[MAX_NODE_NAME_LENGTH];
  char nodeidp[MAX_SCOPUS_ID_LENGTH];


  ~MFRNode();

  double x;
  double y;
  double size;
  long community;
  QuadNode* quadNode;
};

struct MFREdgeExt
{
  inline MFREdgeExt() {nodeidA[0] = 0; nodeidB[0] = 0;}
  inline void SetNodeIdA(const char* nodeid)
  {
    if (strlen(nodeid) > MAX_SCOPUS_ID_LENGTH-1)
    {
      fprintf(stderr,"WARNING: node id %s too long.\n", nodeid);
    }
    strncpy(nodeidA,nodeid,MAX_NODE_NAME_LENGTH);
    nodeidA[MAX_NODE_NAME_LENGTH-1] = 0;
  }
  inline void SetNodeIdB(const char* nodeid)
  {
    if (strlen(nodeid) > MAX_SCOPUS_ID_LENGTH-1)
    {
      fprintf(stderr,"WARNING: node id %s too long.\n", nodeid);
    }
    strncpy(nodeidB,nodeid,MAX_NODE_NAME_LENGTH);
    nodeidB[MAX_NODE_NAME_LENGTH-1] = 0;
  }

//private:
  char nodeidA[MAX_SCOPUS_ID_LENGTH];
  char nodeidB[MAX_SCOPUS_ID_LENGTH];
//public:
//friend class MFREdgeArray;
};


struct MFREdgeInt
{
  inline MFREdgeInt() : nodeA(NULL), nodeB(NULL) { }
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
  MFREdgeArray(const char* fname, MFRNodeArray& nodes);
  ~MFREdgeArray();
public:
  MFREdgeInt* edges;
  int nredges;
};


#endif // __GRAPH_H__

