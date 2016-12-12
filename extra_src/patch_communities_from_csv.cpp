#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include <set>
#include <map>
#include <string>

#include "graph.h"
#include "MFRUtils.h"

#define MAX_COMMUNITY_ID_LENGTH 32
#define MAX_COMMUNITIES 1000000

struct Rgb
{
  inline Rgb() : r(0), g(0), b(0) {}
  inline Rgb(unsigned char ar, unsigned char ag, unsigned char ab) : r(ar), g(ag), b(ab) {}
  unsigned char r;
  unsigned char g;
  unsigned char b;
};

Rgb communityColors[MAX_COMMUNITIES];

struct Community
{
  char communityId[MAX_COMMUNITY_ID_LENGTH];
  int index;
};


bool operator< (const Community& lhs, const Community& rhs)
{
  return strcmp(lhs.communityId, rhs.communityId);
}  


Rgb ColorForDiscipline(int discipline)
{
  switch (discipline)
  {
  case 26:
    //Mathematics
    return Rgb(106,89,209);

  case 31:
    //Physics and Astronomy
    return Rgb(132,61,170);

  case 16:
    //Chemistry
    return Rgb(46,134,229);

  case 15:
    //Chemical Engineering
    return Rgb(0,174,240);

  case 25:
    //Materials Science
    return Rgb(52,191,181);

  case 22:
    //Engineering
    return Rgb(108,234,189);

  case 21:
    //Energy
    return Rgb(211,230,9);

  case 23:
    //Environmental Science
    return Rgb(183,209,86);

  case 19:
    //Earth and Planetary Sciences
    return Rgb(111,188,38);

  case 11:
    //Agricultural and Biological Sciences
    return Rgb(0,181,78);

  case 13:
    //Biochemistry, Genetics and Molecular Biology
    return Rgb(97,201,139);

  case 24:
    //Immunology and Microbiology
    return Rgb(191,80,165);

  case 34:
    //Veterinary
    return Rgb(237,0,140);

  case 27:
    //Medicine
    return Rgb(204,2,36);

  case 30:
    //Pharmacology, Toxicology and Pharmaceutics
    return Rgb(239,94,142);

  case 36:
    //Health Professions
    return Rgb(255,50,43);

  case 29:
    //Nursing
    return Rgb(248,137,146);

  case 35:
    //Dentistry
    return Rgb(245,93,49);

  case 28:
    //Neuroscience
    return Rgb(183,88,2);

  case 12:
    //Arts and Humanities
    return Rgb(255,166,36);

  case 32:
    //Psychology
    return Rgb(255,206,0);

  case 33:
    //Social Sciences
    return Rgb(255,242,0);

  case 14:
    //Business, Management and Accounting
    return Rgb(229,229,85);

  case 20:
    //Economics, Econometrics and Finance
    return Rgb(194,183,56);

  case 18:
    //Decision Sciences
    return Rgb(155,124,54);

  case 17:
    //Computer Science
    return Rgb(44,101,183);

/*
  case :
    //Multidisciplinary
    return Rgb(96,111,102);
*/
//  case :
  default:
    //Other
    return Rgb(145,168,154);
  }
}










int main(int argc, char** argv)
{
  if (argc<2)
  {
    fprintf(stderr,"Usage: %s x.csv [nodes_in.bin nodes_out.bin]\n",argv[0]);
    exit(-1);
  }
  const char* csv_filename = argv[1];
  const char* nodes_bin_infilename = NULL;
  const char* nodes_bin_outfilename = NULL;
  if (argc > 3)
  {
    nodes_bin_infilename = argv[2];
    nodes_bin_outfilename = argv[3];
  }
  
  FILE* fin = fopen(csv_filename,"r");
  if (!fin)
  {
    fprintf(stderr,"Could not open file %s.\n",csv_filename);
    exit(-1);
  }



  std::set<Community> communities;
  int nrcommunities = 0;


#define MAX_LINEBUFFER 2048
  char linebuffer[MAX_LINEBUFFER];

  fgets(linebuffer,MAX_LINEBUFFER,fin);
  while (fgets(linebuffer,MAX_LINEBUFFER,fin))
  {
    char* communityId = linebuffer;
    char* asjc_ptr = strchr(linebuffer,',');
    *asjc_ptr = 0;
    asjc_ptr++;
    
    int asjc = 0;
    asjc += *asjc_ptr;
    asjc -= '0';
    asjc *= 10;
    asjc_ptr++;
    asjc += *asjc_ptr;
    asjc -= '0';

/*
    {
      static int count = 0;
      if (count<10)
      {
        fprintf(stderr, "%s : %d\n",communityId,asjc);
      }
      count++;
    }
*/

    Community community;
    strcpy(community.communityId,communityId);
    community.index = nrcommunities;

    if (nrcommunities>=MAX_COMMUNITIES)
    {
      fprintf(stderr, "Raise MAX_COMMUNITIES.\n");
      exit(-1);
    }

    std::set<Community>::iterator eentry = communities.find(community); 
    if (eentry == communities.end())
    {
      communities.insert(community);
      communityColors[nrcommunities] = ColorForDiscipline(asjc);
      nrcommunities++;
    }
    else
    {
    }
  }

  fclose(fin);

  printf("[ ");
  {
    int i;
    for (i=0;i<nrcommunities;i++)
    {
      if (i)
      {
        printf(", ");
      }
      printf("[%d, %d, %d ]", communityColors[i].r, communityColors[i].g, communityColors[i].b);
    }
  }
  printf("]");


  if (nodes_bin_infilename)
  {
    MFRNodeArray nodes(nodes_bin_infilename);
    int i;
    for (i=0;i<nodes.nrnodes;i++)
    {

    Community community;
    sprintf(community.communityId,"%ld",nodes.nodes[i].community);
    std::set<Community>::iterator eentry = communities.find(community); 
    if (eentry == communities.end())
    {
      nodes.nodes[i].community = 0;
    }
    else
    {
      nodes.nodes[i].community = eentry->index;
    }


//      nodes.nodes[i].community = 0;
    }
    FILE* node_out_file = MFRUtils::OpenFile(nodes_bin_outfilename,"w");
    fwrite(nodes.nodes,nodes.nrnodes*sizeof(MFRNode),1,node_out_file);
    fclose(node_out_file);
  }

  return 0;
}
