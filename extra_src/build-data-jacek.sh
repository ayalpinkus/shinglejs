#!/bin/bash


DATASET=./

echo "dataset = $DATASET"

/home/ayalpinkus/Work/LowPriority/shinglejs/bin/json2array_jacek.a $DATASET testnodes.bin testedges.bin

#rm -rf ./datasets/elsevier-data

mkdir -p ./datasets/elsevier-data/


echo "Create bitmaps"

/home/ayalpinkus/Work/LowPriority/shinglejs/bin/makebitmap_elsevier.a 2400 0.33 testnodes.bin image_2400.pnm
pnmscale 0.5 image_2400.pnm > image_1200.pnm
pnmscale 0.4 image_2400.pnm > image_960.pnm
pnmscale 0.333333333333333333333 image_2400.pnm > image_800.pnm
pnmscale 0.25 image_2400.pnm > image_600.pnm

cjpeg image_2400.pnm > image_2400.jpg
cjpeg image_1200.pnm > image_1200.jpg
cjpeg image_960.pnm > image_960.jpg
cjpeg image_800.pnm > image_800.jpg
cjpeg image_600.pnm > image_600.jpg
cp image_1200.jpg image_2400low.jpg

cp *.jpg datasets/elsevier-data/


echo "Finished creating bitmaps"


/home/ayalpinkus/Work/LowPriority/shinglejs/bin/quadbuilder.a testnodes.bin testedges.bin ./datasets/elsevier-data/

cp /home/ayalpinkus/Work/MyWork/halftone/shinglejs/html/*.css ./datasets/
cp /home/ayalpinkus/Work/MyWork/halftone/shinglejs/html/*.js ./datasets/
cp /home/ayalpinkus/Work/MyWork/halftone/MapForResearch/html/_showgraph.html ./datasets/

