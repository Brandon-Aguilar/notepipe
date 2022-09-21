#!/bin/sh
networkName=handwriting
socketImage=socketserver
webImage=pythonwebserver
webPort=80

echo "Creating Network"
docker network inspect $networkName >/dev/null 2>&1 || docker network create --driver bridge $networkName

echo "Building Fresh Images"
docker build --no-cache -t $webImage -f ./docker/web.Dockerfile .    
docker build --no-cache -t $socketImage -f ./docker/socket.Dockerfile . 

echo "Cleaning containers"
docker kill $(docker ps -q)

echo "Starting containers"
docker run --rm -d -it --name "$webImage-container" -p $webPort:7000 --network $networkName $webImage
docker run --rm -d -it --name "$socketImage-container" -p 8001:8001 --network $networkName $socketImage

echo "Build Complete, running on localhost:$webPort"



