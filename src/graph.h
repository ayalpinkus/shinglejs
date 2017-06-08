
#ifndef __GRAPH_H__
#define __GRAPH_H__



#define MAX_NODE_NAME_LENGTH 128
#define MAX_SCOPUS_ID_LENGTH 32


#define SUPPORT_EDGE_STRENGTHS

#define STORE_TOTAL_EDGECOUNTS


#ifdef SUPPORT_EDGE_STRENGTHS
#define EDGE_STRENGTH_TYPE int
#endif // SUPPORT_EDGE_STRENGTHS



class QuadNode;

struct MFRNode
{



  inline MFRNode() : x(0), y(0), size(0), community(0), quadNode(NULL)
  { 
    SetName("");
    SetNodeId("");
#ifdef STORE_TOTAL_EDGECOUNTS
    totalnredges = 0;
#endif // STORE_TOTAL_EDGECOUNTS
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
  double level;
  long community;

#ifdef STORE_TOTAL_EDGECOUNTS
  int totalnredges;
#endif // STORE_TOTAL_EDGECOUNTS

  QuadNode* quadNode;
};

struct MFREdgeExt
{
  inline MFREdgeExt() 
  {
    nodeidA[0] = 0; nodeidB[0] = 0;
#ifdef SUPPORT_EDGE_STRENGTHS
    strength = 1;
#endif // SUPPORT_EDGE_STRENGTHS
  }
  inline void SetNodeIdA(const char* nodeid)
  {
    if (strlen(nodeid) > MAX_SCOPUS_ID_LENGTH-1)
    {
      fprintf(stderr,"WARNING: node id %s too long.\n", nodeid);
    }
    strncpy(nodeidA,nodeid,MAX_SCOPUS_ID_LENGTH);
    nodeidA[MAX_SCOPUS_ID_LENGTH-1] = 0;
  }
  inline void SetNodeIdB(const char* nodeid)
  {
    if (strlen(nodeid) > MAX_SCOPUS_ID_LENGTH-1)
    {
      fprintf(stderr,"WARNING: node id %s too long.\n", nodeid);
    }
    strncpy(nodeidB,nodeid,MAX_SCOPUS_ID_LENGTH);
    nodeidB[MAX_SCOPUS_ID_LENGTH-1] = 0;
  }

  char nodeidA[MAX_SCOPUS_ID_LENGTH];
  char nodeidB[MAX_SCOPUS_ID_LENGTH];

#ifdef SUPPORT_EDGE_STRENGTHS
  EDGE_STRENGTH_TYPE strength;
#endif // SUPPORT_EDGE_STRENGTHS
};


struct MFREdgeInt
{
  inline MFREdgeInt() : nodeA(NULL), nodeB(NULL)
#ifdef SUPPORT_EDGE_STRENGTHS
    , strength(1)
#endif // SUPPORT_EDGE_STRENGTHS
  { }
  MFRNode* nodeA;
  MFRNode* nodeB;
#ifdef SUPPORT_EDGE_STRENGTHS
  EDGE_STRENGTH_TYPE strength;
#endif // SUPPORT_EDGE_STRENGTHS
};

class MFRNodeArray
{
public:
  MFRNodeArray(const char* fname);
  ~MFRNodeArray();
  void Sort();
  MFRNode* LookUp(const char* nodeid);
  void CleanNames();

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

