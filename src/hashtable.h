
#ifndef __HASHTABLE_H__
#define __HASHTABLE_H__

#include "stdio.h"


/* Some symbol table sizes, prime numbers */
#define KSymTableSizeSmall  211
#define KSymTableSizeMedium 2111
#define KSymTableSizeLarge  21107
#define KSymTableSizeHuge   211073


#define HASHBIN(_h)    (int)((_h)%symbolTableSize)


class HashTable
{
public:
  HashTable(const char* map_out_path, int tablesize);
  ~HashTable();
  int Hash( const char *s );
  int symbolTableSize;

//  FILE** buckets;

  FILE* Bucket(int bin);
  int *first;
private:
  void CloseBucket();
  char the_map_out_path[1024];
  FILE* bucket;
};


#endif // __HASHTABLE_H__
