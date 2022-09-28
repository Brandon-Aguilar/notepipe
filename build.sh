#!/bin/sh
networkName=handwriting
socketImage=socketserver
webImage=pythonwebserver

# Change this to something like 8080 or 8081 if port 80 is taken
webPort=80


echo "\n\nCreating Network"
docker network inspect $networkName >/dev/null 2>&1 || docker network create --driver bridge $networkName

echo "\n\nBuilding Fresh Images"
docker build --no-cache -t $webImage -f ./docker/web.Dockerfile .    
docker build --no-cache -t $socketImage -f ./docker/socket.Dockerfile . 

echo "\n\nCleaning containers"
docker kill $(docker ps -q)

echo "\n\nStarting containers"
docker run --rm -d -it --name "$webImage-container" -p $webPort:7000 --network $networkName $webImage
docker run --rm -d -it --name "$socketImage-container" -p 8001:8001 --network $networkName $socketImage

echo "\n\nDeleting Dangling Images. Say 'N' if you have dangling images you want to keep. Otherwise say y to remove dangling images."
docker image prune


echo "\n\nBuild Complete, running on localhost:$webPort"





