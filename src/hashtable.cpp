#include <stdlib.h>
#include <string.h>
#include "MFRUtils.h"
#include "hashtable.h"


static inline void HashByte(unsigned long& h, unsigned char c)
{
  h=(h<<4)+c;
/*
  unsigned long g = h&0xf0000000L;
  if (g)
  {
printf("() ");
    h=h^(g>>24);
    h=h^g;
  }
*/
  h = h & 0xffffff;

}

int HashTable::Hash( const char *s )
//
// Simple hash function
//
{
  const unsigned char *p;
  unsigned long h=0;

//printf("%ld ",h);
  for (p=(const unsigned char*)s;*p!='\0';p++)
  {
    HashByte( h, *p);

//printf("%ld ",h);
  }

//printf("\n");

  return HASHBIN(h);
}


void HashTable::CloseBucket()
{
  if (bucket)
  {
    fclose(bucket);
    bucket = NULL;
  }
}

FILE* HashTable::Bucket(int bin)
{
  CloseBucket();

  char fname[512];
  sprintf(fname,"%stable%d.json", the_map_out_path, bin);
  bucket = MFRUtils::OpenFile(fname,"a");
  return bucket;
}

HashTable::HashTable(const char* map_out_path, int tablesize)
{
  symbolTableSize = tablesize;
  strcpy(the_map_out_path, map_out_path);

  bucket = NULL;
  
//TODO remove?  buckets = (FILE**)malloc(tablesize*sizeof(FILE*));
  first = (int *)malloc(tablesize*sizeof(int));

  int i;
  for (i=0;i<symbolTableSize;i++)
  {
    char fname[512];
    sprintf(fname,"%stable%d.json", map_out_path, i);
    first[i] = 1;
    bucket = MFRUtils::OpenFile(fname,"w");
    fprintf(bucket,"{\n");
    CloseBucket();
  }
}

HashTable::~HashTable()
{
  int i;
  for (i=0;i<symbolTableSize;i++)
  {
    fprintf(Bucket(i),"}\n");
//TODO remove?    fclose(buckets[i]);
  }


  CloseBucket();

//TODO remove?  free(buckets);
  free(first);
}
