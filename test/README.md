# SauromJs example

#### Clone project and dependencies
    git clone https://github.com/nhuanhoangduc/sauromjs
    cd ./sauromjs/test/
    npm install
    
#### Start mongodb and rabbitmq
    docker-compose up -d
    
#### Run UserRepository.js
    node UserRepository.js
    
#### Run ApiGateway.js
    node ApiGateway.js
    
#### Test api
    curl http://localhost:3000/users/create
    curl http://localhost:3000/users
    