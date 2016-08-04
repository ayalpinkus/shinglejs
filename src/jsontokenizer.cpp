#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#include "MFRUtils.h"
#include "jsontokenizer.h"

JSONTokenizer::JSONTokenizer(const char* name)
{
  line = 1;
  nextToken[0] = 0;
  nextChar = ' ';
  symbols = "{}:;,[]";
  tokenLetters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_#.";
  inFileName = name;
  in = MFRUtils::OpenFile(inFileName, "r");
  LookAhead();
}


JSONTokenizer::~JSONTokenizer()
{
  fclose(in);
}



void JSONTokenizer::getNextChar()
{
  nextChar = fgetc(in);
  if (nextChar == '\n')
  {
    line++;
  }
}

void JSONTokenizer::Match(const char* token)
{
  if (strcmp(nextToken, token))
  {
    fprintf(stderr,"Error on line %d in file %s: did not recognize token %s\n", line, inFileName, nextToken);
    exit(-1);
  }
  LookAhead();
}

void JSONTokenizer::LookAhead()
{
  if (nextChar == -1) { strcpy(nextToken, ""); return; }
    
  int redoWhitespace = 1;

  // Skip whitespaces and comments
  while (redoWhitespace)
  {
    redoWhitespace = 0;
    while (isspace(nextChar))
    {
      getNextChar();
      if (nextChar == EOF) { strcpy(nextToken, ""); return; }
    }
    
    if (nextChar == ';') // Remarks that start with ; and continue to the end of the line
    {
      getNextChar();
      while (nextChar != '\n')
      {
        getNextChar();
      }
      redoWhitespace = 1;
    }
    else if (nextChar == '/') // Remarks that start with // or / *
    {
      getNextChar();
      if (nextChar == '/')
      {
        while (nextChar != '\n')
        {
          getNextChar();
        }
      }
      else if (nextChar == '*')
      {
        int startLine = line;
        //@@@TODO Optimize
        while (1)
        {
          getNextChar();
          if (nextChar == '*')
          {
            while (nextChar == '*')
            {
              getNextChar();
            }
            if (nextChar == '/')
            {
              getNextChar();
              break;
            }
          }
          if (nextChar == -1)
          {
            fprintf(stderr,"Error on line %d in file %s: comment block not ended, started on line %d\n", line, inFileName, startLine);
            exit(-1);
          }
        }
      }
      else
      {
        fprintf(stderr,"Error on line %d in file %s: comment start / but not // or /* .", line, inFileName);
        exit(-1);
      }
      redoWhitespace = 1;
    }
  }
  if (strchr(symbols, nextChar))
  {
    nextToken[0] = ((char)nextChar);
    nextToken[1] = 0;
    getNextChar();
    return;
  }
  else if (strchr(tokenLetters, nextChar))
  {
    //@@@TODO Optimize
    nextToken[0] = 0;
    while (strchr(tokenLetters, nextChar))
    {
      nextToken[strlen(nextToken)+1] = 0;
      nextToken[strlen(nextToken)  ] = ((char)nextChar);
      getNextChar();
    }
    return;
  }
  else if (nextChar == '\"')
  {
    int startLine = line;
    //@@@TODO Optimize
    nextToken[0] = 0;
    getNextChar();
    while (nextChar != '\"')
    {
      if (nextChar == -1)
      {
        fprintf(stderr,"Error on line %d in file %s: unmatched quotes at end of file, started on line %d\n", line, inFileName, startLine);
        exit(-1);
      }
      if (nextChar == '\\')
      {
        getNextChar();
      }
      nextToken[strlen(nextToken)+1] = 0;
      nextToken[strlen(nextToken)  ] = ((char)nextChar);
      getNextChar();
    }
    getNextChar();
    return;
  }
  else
  {
    fprintf(stderr,"Error on line %d in file %s: did not recognize start of token %s (%c)", line, inFileName, nextToken, ((char)nextChar));
    exit(-1);
  }
}
