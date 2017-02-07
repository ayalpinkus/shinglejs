#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "graph.h"
#include "MFRUtils.h"
#include "quadtree.h"

#define BACKGROUND_WHITE


int main(int argc, char** argv)
{
  if (argc<5)
  {
    fprintf(stderr, "Usage: %s bitmapwidth alpha nodes.bin outfilename.pnm\n",argv[0]);
    exit(-1);
  }
  unsigned long bitmapWidth = atoi(argv[1]);
  double alpha = atof(argv[2]);
  const char* nodes_fname = argv[3];
  const char* out_pnm_fname = argv[4];

  unsigned char* pixels = (unsigned char*)malloc(3*bitmapWidth*bitmapWidth);

#ifdef BACKGROUND_WHITE
  memset(pixels,255,3*bitmapWidth*bitmapWidth);
#else  // BACKGROUND_WHITE
  memset(pixels,0,3*bitmapWidth*bitmapWidth);
#endif // BACKGROUND_WHITE

  MFRNodeArray nodes(nodes_fname);
  MFRQuadTree quadTree(nodes, 1);

  double xmin = quadTree.root->xmin;
  double xmax = quadTree.root->xmax;
  double ymin = quadTree.root->ymin;
  double ymax = quadTree.root->ymax;

  int i;
  for (i=0;i<nodes.nrnodes;i++)
  {

if ((i&16383) == 0)
{
fprintf(stderr,"\r%d/%d",i,nodes.nrnodes);
}

    unsigned long x = (unsigned long)(bitmapWidth*(nodes.nodes[i].x-xmin)/(xmax-xmin));
    unsigned long y = (unsigned long)(bitmapWidth*(nodes.nodes[i].y-ymin)/(ymax-ymin));

if (x>bitmapWidth-1) x=bitmapWidth-1;
if (y>bitmapWidth-1) y=bitmapWidth-1;

    int r=0;
    int g=0;
    int b=0;

    //These colors are the same as specified in shingle.js (nodeColors:)
    switch (nodes.nodes[i].community % 10)
    {
    case 0: r=240; g=188; b=  0; break;
    case 1: r=178; g= 57; b=147; break;
    case 2: r=39;  g=204; b=122; break;
    case 3: r=21;  g=163; b=206; break;
    case 4: r=235; g= 84; b= 54; break;
    case 5: r=138; g=103; b= 52; break;
    case 6: r=255; g=116; b=116; break;
    case 7: r=120; g= 80; b=171; break;
    case 8: r=48;  g=179; b=179; break;
    case 9: r=211; g= 47; b= 91; break;
    }

    unsigned long offset = 3*(y*bitmapWidth+x);


    pixels[offset] = (1-alpha)*pixels[offset] + alpha*r;
    pixels[offset+1] = (1-alpha)*pixels[offset+1] + alpha*g;
    pixels[offset+2] = (1-alpha)*pixels[offset+2] + alpha*b;

  }




  FILE*fout=fopen(out_pnm_fname,"wb");
  fprintf(fout, "P%d\n%d %d\n%d\n", 6, (int)bitmapWidth, (int)bitmapWidth, 255);
  fwrite(pixels, bitmapWidth*bitmapWidth*3, sizeof(unsigned char), fout);
  fclose(fout);
  free(pixels);
  return 0;
}
