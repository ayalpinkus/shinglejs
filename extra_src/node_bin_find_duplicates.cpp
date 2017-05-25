/*
 * =====================================================================================
 *
 *       Filename:  longest-common-substring.c
 *
 *    Description: 	Find the longest string (or strings) that is a substring (or are substrings) of two strings.  
 *
 *        Version:  1.1	- keep only the last and current row of the DP table to save memory
 *					1.0	- dynamic programming solution without usage of optimal tricks
 *
 *        Created:  2013\u5e7403\u670825\u65e5 15\u65f621\u520635\u79d2
 *       Revision:  none
 *       Compiler:  gcc
 *
 *         Author:  Jac King (Zeng Jing), intactsnow@gmail.com
 *   Organization:  Fudan University
 *
 * =====================================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "graph.h"
#include "MFRUtils.h"


/*
 * Dynamic Programming
 * The following tricks can be used to reduce the memory usage of an implementation:
 * 1. (used)Keep only the last and current row of the DP table to save memory (O(min(m,n) instead of O(nm))
 * 2. Store only non-zero values in the rows. This can be done using hash tables instead of arrays. This is useful for large alphabets.
 */
int *lcsubstr_dp(char *s, char *t)
{
	int len_s = strlen(s);
	int len_t = strlen(t);
	int len = len_s < len_t ? len_s : len_t;
	int i, j, k;

	int longest = 0;
	int *L[2]; //  = (int **)malloc(2 * sizeof(int *));
        
	static int *ret;
	ret = (int *)calloc(len_s + 1, sizeof(int));
	for (i = 0; i < 2; i++)
		L[i] = (int *)calloc(len_t, sizeof(int));

	k = 0;
	for (i = 0; i < len_s; i++) {
		memcpy(L[0], L[1], len_t * sizeof(int));
		for (j = 0; j < len_t; j++) {
			if (s[i] == t[j]) {
				if (i == 0 || j == 0) {
					L[1][j] = 1;
				} else {
					L[1][j] = L[0][j-1] + 1;
				}
				if (L[1][j] > longest) {
					longest = L[1][j];
					k = 0;
					ret[k++] = longest;
				}
				if (L[1][j] == longest) {
					ret[k++] = i;
					ret[k] = -1;
				}
			} else {
				L[1][j] = 0;
			}
		}
	}
	 
	for (i = 0; i < 2; i++)
		free(L[i]);
/*
	free(L);
*/

	ret[0] = longest;
	return ret;
}




/* Returns length of longest common substring of X[0..m-1] 
   and Y[0..n-1] */
int max(int a, int b)
{   return (a > b)? a : b; }
int LCSubStr(char *X, char *Y, int m, int n)
{
    // Create a table to store lengths of longest common suffixes of
    // substrings.   Notethat LCSuff[i][j] contains length of longest
    // common suffix of X[0..i-1] and Y[0..j-1]. The first row and
    // first column entries have no logical meaning, they are used only
    // for simplicity of program
    int LCSuff[m+1][n+1];
    int result = 0;  // To store length of the longest common substring
 
    /* Following steps build LCSuff[m+1][n+1] in bottom up fashion. */
    for (int i=0; i<=m; i++)
    {
        for (int j=0; j<=n; j++)
        {
            if (i == 0 || j == 0)
                LCSuff[i][j] = 0;
 
            else if (!strncasecmp(&X[i-1], &Y[j-1], 1)) // (X[i-1] == Y[j-1])
            {
                LCSuff[i][j] = LCSuff[i-1][j-1] + 1;
                result = max(result, LCSuff[i][j]);
            }
            else LCSuff[i][j] = 0;
        }
    }
    return result;
}
 
int LCSubStr(char *X, char *Y)
{
  return LCSubStr(X, Y, strlen(X), strlen(Y));
}


int main(int argc, char *argv[])
{
  if (argc != 2)
  {
    printf("usage: %s nodes.bin\n", argv[0]);
    exit(1);
  }
  const char* nodes_bin_infilename = argv[1];
fprintf(stderr,"Loading\n");
  MFRNodeArray nodes(nodes_bin_infilename);

  long nrdoubles = 0;

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

    for (j=i+1;j<nodes.nrnodes;j++)
    {
      if (nodes.nodes[i].community != nodes.nodes[j].community)
      {
        continue;
      }

      if (!strcmp(nodes.nodes[j].namep,"ANON"))
      {
        continue;
      }

//printf("i=%ld,j=%ld, names: %s, %s\n",i,j,nodes.nodes[i].namep, nodes.nodes[j].namep);

      int longest = LCSubStr(nodes.nodes[i].namep, nodes.nodes[j].namep);

/*
      int *ret = lcsubstr_dp(nodes.nodes[i].namep, nodes.nodes[j].namep);
      int longest = ret[0];
*/
      if (longest != 0)
      {
        if (longest == strlen(nodes.nodes[i].namep) || longest == strlen(nodes.nodes[j].namep))
	{
	  printf("Node ids: %s, %s\n\tNames: [%s], [%s]\n",nodes.nodes[i].nodeidp, nodes.nodes[j].nodeidp, nodes.nodes[i].namep, nodes.nodes[j].namep);
nrdoubles++;
	}
      }
//      free(ret);
    }
  }


  printf("Finished\n");

  return 0;
}

/*

int main(int argc, char *argv[])
{
	int i, longest, *ret;

	if (argc != 3) {
		printf("usage: longest-common-substring s1 s2\n");
		exit(1);
	}

	ret = lcsubstr_dp(argv[1], argv[2]);
	if ((longest = ret[0]) == 0) {
		printf("NO common substrings!\n");
		exit(2);
	}

        printf("length1=%d, length2=%d, longest=%d\n",(int)strlen(argv[1]), (int)strlen(argv[2]), (int)longest);

	i = 0;
	while (ret[++i] != -1) {
		printf("%.*s\n", longest, &argv[1][ret[i]-longest+1]);
	}

	exit(0);
}

*/
