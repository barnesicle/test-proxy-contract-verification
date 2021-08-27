
### Add mock routes to your project in a "proxy-data" directory. See examples of this file.

docker build -t barnesicle/test-proxy .
docker push barnesicle/test-proxy

cd to project
docker run --name test-proxy -v /$(PWD)/proxy-data:/usr/src/app/proxy-data -e PROXY_URL="https://api.digitalriver.com" -p 3000:3000 test-proxy