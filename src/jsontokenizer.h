
#ifndef _JSONTOKENIZER_H__
#define _JSONTOKENIZER_H__

class JSONTokenizer
{
public:
  JSONTokenizer(const char* name);
  ~JSONTokenizer();
  void getNextChar();
  void Match(const char* token);
  void LookAhead();

  const char* inFileName;
  int line;
  char nextToken[65536];
  FILE* in;
  int nextChar;
  const char* symbols;
  const char* tokenLetters;
};

#endif // _JSONTOKENIZER_H__
