include makeinclude

ALL_OBJS = $(OBJ_PATH)graph.o $(OBJ_PATH)quadtree.o $(OBJ_PATH)hashtable.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)jsontokenizer.o

SHINGLEJS_BIN = $(BIN_PATH)quadbuilder.a $(BIN_PATH)json2bin.a $(BIN_PATH)bin2json.a 

SHINGLE_OUTPUT_FOLDERS = $(OBJ_PATH)created.txt $(BIN_PATH)created.txt $(OUTPUT_PATH)created.txt

RELEASE_PATH = $(DATA_PATH)

all:  $(SHINGLE_OUTPUT_FOLDERS) $(ALL_OBJS) $(SHINGLEJS_BIN)  $(RELEASE_PATH)_sample.html

clean:
	-rm -rf $(OBJ_PATH)* $(BIN_PATH)* $(RELEASE_PATH)*

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
	$(BIN_PATH)json2bin.a sampledata/random-graph_500000.json $(RELEASE_PATH)nodes.bin $(RELEASE_PATH)edges.bin
	$(BIN_PATH)quadbuilder.a $(RELEASE_PATH)nodes.bin $(RELEASE_PATH)edges.bin $(RELEASE_PATH)random-graph_500000/
	rm $(RELEASE_PATH)nodes.bin $(RELEASE_PATH)edges.bin
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

$(BIN_PATH)json2bin.a: src/json2bin.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o src/MFRUtils.h src/jsontokenizer.h src/graph.h
	g++  -o $(BIN_PATH)json2bin.a src/json2bin.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o

$(BIN_PATH)bin2json.a: src/bin2json.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o src/MFRUtils.h src/jsontokenizer.h src/graph.h
	g++  -o $(BIN_PATH)bin2json.a src/bin2json.cpp $(OBJ_PATH)jsontokenizer.o $(OBJ_PATH)MFRUtils.o $(OBJ_PATH)graph.o

release-src:
	cp $(SHINGLE_PATH)html/*.css $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/*.js $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/*.html $(RELEASE_PATH)

release-website:
	cp $(SHINGLE_PATH)html/*.css $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/*.js $(RELEASE_PATH)
	cp $(SHINGLE_PATH)html/*.html $(RELEASE_PATH)
	tar zcvf $(RELEASE_PATH)shinglejs.tgz *
	cp APACHE_LICENSE-2.0.txt $(RELEASE_PATH)


