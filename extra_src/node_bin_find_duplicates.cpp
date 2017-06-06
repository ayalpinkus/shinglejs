
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#include "graph.h"
#include "MFRUtils.h"







int lengthEqual(char* s1, char* s2)
{
  int len = 0;
  while (*s1 && *s2)
  {
    if (strncasecmp(s1, s2, 1))
    {
      break;
    }
    s1++;
    s2++;
    len++;
  }
  return len;
}

static int nodeCompareNames(const void *a, const void *b)
{
  MFRNode* node1 = (MFRNode*)a;
  MFRNode* node2 = (MFRNode*)b;
  int result = strcmp(node1->namep, node2->namep);
  if (!result)
  {
    result = node1->community-node2->community;
  }
  return result;
}


int main(int argc, char *argv[])
{
  if (argc != 2)
  {
    printf("usage: %s nodes.bin\n", argv[0]);
    exit(1);
  }
  const char* nodes_bin_infilename = argv[1];
  fprintf(stderr,"Loading...\n");
  MFRNodeArray nodes(nodes_bin_infilename);



  fprintf(stderr,"Sorting...\n");
  qsort(nodes.nodes, nodes.nrnodes, sizeof(MFRNode), nodeCompareNames);

  fprintf(stderr,"Counting...\n");

  long nrdoubles = 0;


  long i=0;
  while (i<nodes.nrnodes-1)
  {
    if (!strcmp(nodes.nodes[i].namep,"ANON"))
    {
      i++;
      continue;
    }
    if (!strcmp(nodes.nodes[i].namep,"unknown"))
    {
      i++;
      continue;
    }
    long j=i+1;
    for (;;)
    {
      if (nodes.nodes[i].community != nodes.nodes[j].community)
      {
        break;
      }
      if (fabs(nodes.nodes[i].x-nodes.nodes[j].x) > 3)
      {
        break;
      }
      if (fabs(nodes.nodes[i].y-nodes.nodes[j].y) > 3)
      {
        break;
      }
      int longest = lengthEqual(nodes.nodes[i].namep, nodes.nodes[j].namep);

      if (longest < 4*strlen(nodes.nodes[i].namep)/5 && longest < 4*strlen(nodes.nodes[j].namep)/5)
      {
        break;
      }
      j++;
    }
    if (j>i+1)
    {
      printf("Node id: %s, [%s] matches %ld other\n",nodes.nodes[i].nodeidp, nodes.nodes[i].namep, (j-(i+1)));
      int k;
      for (k=1;k<=(j-(i+1));k++)
      {
        printf("         %s, [%s]\n",nodes.nodes[i+k].nodeidp, nodes.nodes[i+k].namep);
      }
      nrdoubles += (j-(i+1));
      i+=(j-i);
    }
    else
    {
      i++;
    }
  }
  

#if 0
  long i,j;
  for (i=0;i<nodes.nrnodes;i++)
  {
    if ((i&1023)==0)
    {
      fprintf(stderr,"%ld\r",i);fflush(stderr);
    }

    if (!strcmp(nodes.nodes[i].namep,"ANON"))
    {
      continue;
    }
    if (!strcmp(nodes.nodes[i].namep,"unknown"))
    {
      continue;
    }

    for (j=i+1;j<nodes.nrnodes;j++)
    {
      if (nodes.nodes[i].community != nodes.nodes[j].community)
      {
        continue;
      }

      if (fabs(nodes.nodes[i].x-nodes.nodes[j].x) > 3)
      {
        continue;
      }

      if (fabs(nodes.nodes[i].y-nodes.nodes[j].y) > 3)
      {
        continue;
      }
      
      if (!strcmp(nodes.nodes[j].namep,"ANON"))
      {
        continue;
      }
      if (!strcmp(nodes.nodes[j].namep,"unknown"))
      {
        continue;
      }

      int longest = lengthEqual(nodes.nodes[i].namep, nodes.nodes[j].namep);

      if (longest != 0)
      {
        if (longest == strlen(nodes.nodes[i].namep) || longest == strlen(nodes.nodes[j].namep))
	{
	  printf("Node ids: %s, %s\n\tNames: [%s], [%s]\n",nodes.nodes[i].nodeidp, nodes.nodes[j].nodeidp, nodes.nodes[i].namep, nodes.nodes[j].namep);
nrdoubles++;
	}
      }
    }
  }
#endif // 0

  printf("Finished. nrdoubles = %ld\n", nrdoubles);

  return 0;
}

