
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





HashTable::HashTable(const char* map_out_path)
{
  int i;
  for (i=0;i<KSymTableSize;i++)
  {
    char fname[512];
    sprintf(fname,"%stable%d.json", map_out_path, i);
    first[i] = 1;
    buckets[i] = MFRUtils::OpenFile(fname,"w");
    fprintf(buckets[i],"{\n");
  }
}

HashTable::~HashTable()
{
  int i;
  for (i=0;i<KSymTableSize;i++)
  {
    fprintf(buckets[i],"}\n");
    fclose(buckets[i]);
  }
}
