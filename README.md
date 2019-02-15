# Messaging communicator for NodeJs microservice

    npm install sauromjs
    
# Example

See example at: https://github.com/nhuanhoangduc/sauromjs/tree/master/test

### 1. ApiGateway.js - Make request to UserRepository microservice
```javascript
// --- Step 1: Import sauromjs package
const Saurom = require('sauromjs');
const express = require('express')
const app = express();

// --- Step 2: Create a Request object
const Request = new Saurom.Request({
    instanceId: 'ApiInstantceId', // default: auto generate an uniq id
    mqUrl: 'amqp://localhost', // default 'amqp://localhost'
    timeout: 2000, // Request timeout, default 5000
});


// --- Step 3: connect to message queue
Request.connect()
    .then(() => { // Connected
    
    
        /**
         * Step 4: Make request to repository with given service name and params
         * Request.call(repositoryName: string, serviceName: string, body: object)
         * Request.call return a promise
         */
         
         
        app.get('/users', async (req, res, next) => {
            try {
                const users = await Request.call(
                    'UserRepository', // Repository name
                    'getUsers', // Service name
                );
    
                res.send(users);
            } catch (error) {
                next(error);
            }
        });

        app.get('/users/create', async (req, res) => {
            try {
                const newUser = await Request.call(
                    'UserRepository', // Repository name
                    'createUser', // Service name
                    {
                        name: 'Nhuan',
                        email: 'nhuan.hoangduc@outlook.com',
                    }
                );
                res.send(newUser);
            } catch (error) {
                next(error);
            }
        });

        app.listen(3000, () => console.log(`Example app listening on port 3000`))
    })
    .catch();
```

### 2. UserRepository.js - Receive request message and send response message

```javascript
// --- Step 1: Import sauromjs package
const Saurom = require('sauromjs');
const UserModel = require('./UserModel');


// --- Step 2: Create a Service object
const Service = new Saurom.Service({
    instanceId: 'ServiceInstanceID', // default: auto generate an uniq id
    repository: 'UserRepository', // required
    
    // Queue url, using amqplib package to connect message queue. Please see http://www.squaremobius.net/amqp.node/channel_api.html#connect for detail
    mqUrl: 'amqp://localhost', // default 'amqp://localhost'
});


// --- Step 3: connect to message queue
Service.connect()
    .then(() => { // Connected
    
    
        /**
         * Step 4: Define services for repository UserRepository, defined above
         * Service's callback:
         *     - req: Object was sent by Request object
         *     - res: {
         *            success: function,
         *            error: function,
         *       }
         */
    
    
    
        // Get users service
        Service.register('getUsers', (req, res) => {
            UserModel.find({}, function (err, users) {
                if (err) {
                    console.log(err);
                    res.error(err);
                    return;
                }
                res.success(users);
            });
        });
        

        // Create new user service
        Service.register('createUser', (req, res) => {
            const { name, email } = req;

            UserModel.create({
                name: name,
                email: email
            }, function (err, user) {
                if (err) {
                    res.error(err);
                    return;
                }
                res.success(user);
            });
        });
    })
    .catch((err) => {
        console.log(err);
    });
```
