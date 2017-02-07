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

    switch (nodes.nodes[i].community)
    {
      //1000 Multidisciplinary
      case 10: 
	// gray, filter out for now
        continue;
	//r=96; g=111; b=102;
	//break;

      //1100 Agricultural and Biological Sciences
      case 11: r=41; g=183; b=98; break;

      //1200 Arts and Humanities
      case 12: r=255; g=166; b=36; break;

      //1300 Biochemistry, Genetics and Molecular Biology
      case 13: r=74; g=206; b=143; break;

      //1400 Business, Management and Accounting
      case 14: r=209; g=217; b=120; break;

      //1500 Chemical Engineering
      case 15: r=58; g=171; b=240; break;

      //1600 Chemistry
      case 16: r=41; g=107; b=180; break;

      //1700 Computer Science
      case 17: r=115; g=133; b=194; break;

      //1800 Decision Sciences
      case 18: r=155; g=124; b=54; break;

      //1900 Earth and Planetary Sciences
      case 19: r=111; g=188; b=38; break;

      //2000 Economics, Econometrics and Finance
      case 20: r=194; g=184; b=56; break;

      //2100 Energy
      case 21: r=214; g=234; b=8; break;

      //2200 Engineering
      case 22: r=0; g=189; b=196; break;

      //2300 Environmental Science
      case 23: r=168; g=209; b=86; break;

      //2400 Immunology and Microbiology
      case 24: r=179; g=31; b=104;
        break;

      //2500 Materials Science
      case 25: r=130; g=208; b=224; break;

      //2600 Mathematics
      case 26: r=102; g=87; b=163; break;

      //2700 Medicine
      case 27: r=204; g=0; b=54; break;

      //2800 Neuroscience
      case 28: r=175; g=84; b=0; break;

      //2900 Nursing
      case 29: r=233; g=156; b=144; break;

      //3000 Pharmacology, Toxicology and Pharmaceutics
      case 30: r=255; g=110; b=125; break;

      //3100 Physics and Astronomy
      case 31: r=132; g=61; b=170; break;

      //3200 Psychology
      case 32: r=255; g=206; b=0; break;

      //3300 Social Sciences
      case 33: r=251; g=248; b=0; break;

      //3400 Veterinary
      case 34: r=230; g=0; b=140; break;

      //3500 Dentistry
      case 35: r=221; g=94; b=38; break;

      //3600 Health Professions
      case 36: r=255; g=50; b=43; break;

      //0000 - 0900 Unused
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      default:
        // Unused classifications, filter out
        continue;
        //r=0; g=0; b=0;
	//break;
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
