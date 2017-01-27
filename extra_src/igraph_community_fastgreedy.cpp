#include <ctype.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <set>
#include <map>
#include <string>
#include <igraph.h>
#include "graph.h"
#include "MFRUtils.h"

int my_progress_handler(const char *message, igraph_real_t percent,
				  void* data)
{
  fprintf(stderr,"%s (%f%%)\r",message, percent);fflush(stderr);
}

int main(int argc, char** argv) 
{
  int i;


  if (argc<3)
  {
    fprintf(stderr,"%s node_file edge_file",argv[0]);
    exit(-1);
  }
  const char* node_fname = argv[1];
  const char* edge_fname = argv[2];

  fprintf(stderr,"Reading datasets.\n");
  MFRNodeArray nodes(node_fname);
  MFREdgeArray edges(edge_fname, nodes);
  fprintf(stderr,"Finished reading data\n");fflush(stdout);

  igraph_set_progress_handler(my_progress_handler);

  igraph_t big;
  igraph_matrix_t big_coords;
  igraph_arpack_options_t arpack_opts;

  /* To make things reproducible */
  igraph_rng_seed(igraph_rng_default(), 42);


  igraph_vector_t igraph_edges;
  igraph_real_t *data = (igraph_real_t*)malloc(edges.nredges*2*sizeof(igraph_real_t));
  {
    for (i=0;i<edges.nredges;i++)
    {
      data[2*i  ] = (igraph_real_t)(edges.edges[i].nodeA-nodes.nodes);
      data[2*i+1] = (igraph_real_t)(edges.edges[i].nodeB-nodes.nodes);
    }
  }

  igraph_vector_init_copy(&igraph_edges, data, 2*edges.nredges);
  igraph_create(&big, &igraph_edges, 0, IGRAPH_UNDIRECTED);  

  igraph_arpack_options_init(&arpack_opts);
  igraph_matrix_init(&big_coords, 0, 0);

  igraph_vector_t weights;
  igraph_vector_init(&weights, edges.nredges);
  for (i=0;i<edges.nredges;i++)
  {
    VECTOR(weights)[i] = 1; // (ledges[i].strength);
  }

  igraph_vector_t modularity;
  igraph_vector_t membership;
  igraph_matrix_t merges;
  igraph_vector_init(&modularity,0);
  igraph_vector_init(&membership,0);
  igraph_matrix_init(&merges,0,0);
  igraph_community_fastgreedy(&big, &weights, &merges, &modularity, &membership);
  for (i=0; i<igraph_vector_size(&membership); i++) 
  {
//    fprintf(stderr,"%li ", (long int)VECTOR(membership)[i]);
    nodes.nodes[i].community = (long int)VECTOR(membership)[i];
  }

  free(data);
  igraph_matrix_destroy(&big_coords);
  igraph_destroy(&big);


  FILE* node_out_file = MFRUtils::OpenFile(node_fname,"w");
  fwrite(nodes.nodes,nodes.nrnodes*sizeof(MFRNode),1,node_out_file);
  fclose(node_out_file);

  return 0;
}
