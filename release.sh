#!/bin/bash

BUILD_FILE_PATH=~/Desktop/restream-chrome-extension.zip

# Remove existing zip file if present
if [ -f $BUILD_FILE_PATH ];  then
  rm $BUILD_FILE_PATH
fi

# Create build
zip -r $BUILD_FILE_PATH . --exclude release.sh .git/\* \*.DS_Store
