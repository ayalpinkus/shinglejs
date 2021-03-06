include makeinclude

ALL_OBJS = $(OBJ_PATH)graph.o $(OBJ_PATH)quadtree.o $(OBJ_PATH)hashtable.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)jsontokenizer.o

SHINGLEJS_BIN = $(BIN_PATH)quadbuilder.a $(BIN_PATH)json2bin.a $(BIN_PATH)bin2json.a $(BIN_PATH)makebitmap.a

SHINGLE_OUTPUT_FOLDERS = $(OBJ_PATH)created.txt $(BIN_PATH)created.txt $(OUTPUT_PATH)created.txt

RELEASE_PATH = $(DATA_PATH)

all:  $(SHINGLE_OUTPUT_FOLDERS) $(ALL_OBJS) $(SHINGLEJS_BIN)  $(RELEASE_PATH)_sample.html

clean:
	-rm -rf $(OBJ_PATH)* $(BIN_PATH)* $(RELEASE_PATH)*

bin-clean:
	-rm -rf $(OBJ_PATH)* $(BIN_PATH)*

$(OBJ_PATH)created.txt:
	-mkdir -p $(OBJ_PATH)
	touch $(OBJ_PATH)created.txt

$(BIN_PATH)created.txt:
	-mkdir -p $(BIN_PATH)
	touch $(BIN_PATH)created.txt

$(OUTPUT_PATH)created.txt:
	-mkdir -p $(OUTPUT_PATH)
	touch $(OUTPUT_PATH)created.txt

build-sample-data: $(RELEASE_PATH)_sample.html

$(RELEASE_PATH)_sample.html:
	-mkdir $(RELEASE_PATH)
	-rm -rf $(RELEASE_PATH)*
	-mkdir $(RELEASE_PATH)random-graph_500000/
	cd sampledata/ ; tar zxvf random-graph_500000.json.tgz ; cd ..
	$(BIN_PATH)json2bin.a sampledata/random-graph_500000.json $(RELEASE_PATH)nodes.bin $(RELEASE_PATH)edges.bin
	$(BIN_PATH)makebitmap.a 2400 1 $(RELEASE_PATH)nodes.bin $(RELEASE_PATH)image_2400.pnm
	-pnmscale 0.5 $(RELEASE_PATH)image_2400.pnm > $(RELEASE_PATH)image_1200.pnm
	-cjpeg $(RELEASE_PATH)image_2400.pnm > $(RELEASE_PATH)random-graph_500000/image_2400.jpg
	-cjpeg $(RELEASE_PATH)image_1200.pnm > $(RELEASE_PATH)random-graph_500000/image_2400low.jpg
	-cjpeg $(RELEASE_PATH)image_1200.pnm > $(RELEASE_PATH)random-graph_500000/image_1200.jpg
	$(BIN_PATH)quadbuilder.a $(RELEASE_PATH)nodes.bin $(RELEASE_PATH)edges.bin $(RELEASE_PATH)random-graph_500000/
	echo "rm $(RELEASE_PATH)nodes.bin $(RELEASE_PATH)edges.bin"
	cp $(SHINGLE_PATH)html/*.css $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/*.js $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/_sample.html $(RELEASE_PATH)

$(OBJ_PATH)jsontokenizer.o: src/jsontokenizer.cpp
	g++ -c -o $(OBJ_PATH)jsontokenizer.o src/jsontokenizer.cpp

$(OBJ_PATH)graph.o: src/graph.cpp src/graph.h
	g++ -c -o $(OBJ_PATH)graph.o src/graph.cpp

$(OBJ_PATH)quadtree.o: src/quadtree.cpp src/quadtree.h
	g++ -c -o $(OBJ_PATH)quadtree.o src/quadtree.cpp

$(OBJ_PATH)hashtable.o: src/hashtable.cpp src/hashtable.h
	g++ -c -o $(OBJ_PATH)hashtable.o src/hashtable.cpp

$(OBJ_PATH)MFRUtils.o: src/MFRUtils.cpp src/MFRUtils.h
	g++ -c -o $(OBJ_PATH)MFRUtils.o src/MFRUtils.cpp

$(BIN_PATH)quadbuilder.a: src/quadbuilder.cpp $(OBJ_PATH)quadtree.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o src/MFRUtils.h src/graph.h $(OBJ_PATH)hashtable.o src/hashtable.h
	g++ -o $(BIN_PATH)quadbuilder.a src/quadbuilder.cpp $(OBJ_PATH)quadtree.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o $(OBJ_PATH)hashtable.o

$(BIN_PATH)makebitmap.a: src/makebitmap.cpp $(OBJ_PATH)quadtree.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o src/MFRUtils.h src/graph.h 
	g++ -o $(BIN_PATH)makebitmap.a src/makebitmap.cpp $(OBJ_PATH)quadtree.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o 

$(BIN_PATH)makebitmap_elsevier.a: extra_src/makebitmap_elsevier.cpp $(OBJ_PATH)quadtree.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o src/MFRUtils.h src/graph.h 
	g++ -I$(SHINGLE_INCLUDE) -o $(BIN_PATH)makebitmap_elsevier.a extra_src/makebitmap_elsevier.cpp $(OBJ_PATH)quadtree.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o 

$(BIN_PATH)json2bin.a: src/json2bin.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o src/MFRUtils.h src/jsontokenizer.h src/graph.h
	g++  -o $(BIN_PATH)json2bin.a src/json2bin.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o

$(BIN_PATH)bin2json.a: src/bin2json.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o src/MFRUtils.h src/jsontokenizer.h src/graph.h
	g++  -o $(BIN_PATH)bin2json.a src/bin2json.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o

extra_src: $(BIN_PATH)json2array_jacek.a $(BIN_PATH)patch_communities_from_csv.a $(BIN_PATH)igraph_community_fastgreedy.a $(BIN_PATH)makebitmap_elsevier.a $(BIN_PATH)node_bin_find_duplicates.a

$(BIN_PATH)node_bin_find_duplicates.a: extra_src/node_bin_find_duplicates.cpp $(OBJ_PATH)graph.o $(OBJ_PATH)MFRUtils.o $(SHINGLE_PATH)src/graph.h $(SHINGLE_PATH)src/MFRUtils.h 
	g++  -I$(SHINGLE_INCLUDE) -o $(BIN_PATH)node_bin_find_duplicates.a extra_src/node_bin_find_duplicates.cpp $(OBJ_PATH)graph.o $(OBJ_PATH)MFRUtils.o 

$(BIN_PATH)json2array_jacek.a: extra_src/json2array_jacek.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o $(SHINGLE_PATH)src/MFRUtils.h $(SHINGLE_PATH)src/jsontokenizer.h $(SHINGLE_PATH)src/graph.h
	g++  -I$(SHINGLE_INCLUDE) -o $(BIN_PATH)json2array_jacek.a extra_src/json2array_jacek.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o

$(BIN_PATH)patch_communities_from_csv.a: extra_src/patch_communities_from_csv.cpp $(OBJ_PATH)graph.o $(OBJ_PATH)MFRUtils.o $(SHINGLE_PATH)src/graph.h $(SHINGLE_PATH)src/MFRUtils.h 
	g++  -I$(SHINGLE_INCLUDE) -o $(BIN_PATH)patch_communities_from_csv.a extra_src/patch_communities_from_csv.cpp $(OBJ_PATH)graph.o $(OBJ_PATH)MFRUtils.o 

$(BIN_PATH)igraph_community_fastgreedy.a: extra_src/igraph_community_fastgreedy.cpp $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o 
	g++ -o $(BIN_PATH)igraph_community_fastgreedy.a extra_src/igraph_community_fastgreedy.cpp $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o -Isrc/ -I/home/ayalpinkus/graphs/igraph-0.7.1/include/ -L/usr/local/lib/ -ligraph

release-src:
	cp $(SHINGLE_PATH)html/*.css $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/*.js $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/*.html $(RELEASE_PATH)

release-website:
	cp $(SHINGLE_PATH)html/*.css $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/*.js $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/*.html $(RELEASE_PATH)
	cp APACHE_LICENSE-2.0.txt $(RELEASE_PATH)


