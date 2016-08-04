
#ifndef __HASHTABLE_H__
#define __HASHTABLE_H__

#include "stdio.h"

#define KSymTableSize 211
#define HASHBIN(_h)    (int)((_h)%KSymTableSize)


class HashTable
{
public:
  HashTable(const char* map_out_path);
  ~HashTable();
  int Hash( const char *s );
  FILE* buckets[KSymTableSize];
  int first[KSymTableSize];
};


#endif // __HASHTABLE_H__
