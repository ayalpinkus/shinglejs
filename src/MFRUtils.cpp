#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "MFRUtils.h"


FILE* MFRUtils::OpenFile(const char* fname, const char* mode)
{
  FILE*f=fopen(fname,mode);
  if (!f)
  {
    fprintf(stderr,"ERROR: could not open file %s in mode \"%s\"\n",fname,mode);
    exit(-1);
  }
  return f;
}
