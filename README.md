# Messaging communicator for NodeJs microservice

    npm install sauromjs
    
# API

### Import package
```javascript
    const Saurom = require('sauromjs');
```

### Request

Creating a request object
```javascript
    const request = new Saurom.Request({
        instanceId: 'id1',            // Default: auto generate an uniq id. Each nodejs instance must have an uniq instance id, 
        mqUrl: 'amqp://localhost',    // Default 'amqp://localhost'
        timeout: 2000,                // Default 5000. Request timeout
    });
```

Connect to message queue
```javascript
    request.connect()
        .then()
        .catch();
```

Call a repository's service
```javascript
    request.call(repositoryName: string, serviceName: string, body: Object);
```

Example
```javascript
    const request = new Saurom.Request();
    
    request
        .connect()
        .then(() => {
            request
                .call(
                    'MathRepository',
                    'sqrt',
                    {
                        number: 36,
                    }
                )
                .then((response) => {})
                .catch((error) => {});
        });
```


### Service

Creating a service object
```javascript
    const service = new Saurom.Service({
        repository: 'MathRepository',   // required
        instanceId: 'id2',              // default: auto generate an uniq id
        mqUrl: 'amqp://localhost',      // default 'amqp://localhost'. Queue url, using amqplib package to connect message queue. Please see http://www.squaremobius.net/amqp.node/channel_api.html#connect for detail           
    });
```

Connect to message queue
```javascript
    service.connect()
        .then()
        .catch();
```

Define service
```javascript
    service.register(serviceName: string, function(req, res) {
        // req: object - body was sent by request object
        // res: object
        //     - res.success(anyValue) : Send success response
        //     - res.error(Error object): Send error response
    });
```

Example
```javascript
    const service = new Saurom.Service({
        repository: 'MathRepository', // required
    });
    
    service.register('sqrt', (req, res) => {
        const { number } = req;

        if (typeof number !== 'number') {
            res.error(new Error('Not a number'));
            return;
        }

        res.success(Math.sqrt(number));
    });
            
    service.connect();
```


# Example

See more example at: https://github.com/nhuanhoangduc/sauromjs/tree/master/test

### 1. Request.js - Make request to UserRepository microservice
```javascript
// --- Step 1: Import sauromjs package
const Saurom = require('sauromjs');


// --- Step 2: Create a Request object
const Request = new Saurom.Request();


// --- Step 3: connect to message queue
Request.connect()
    .then(async () => { // Connected
    
        // --- Step 4: Make request to repository with given service name and params
         
        try {
            // Call service 'sqrt' of MathRepository
            const sqrt = await Request.call(
                'MathRepository',
                'sqrt',
                {
                    number: 36,
                }
            );

            // Call service 'pow' of MathRepository
            const pow = await Request.call(
                'MathRepository',
                'pow',
                {
                    baseNumber: 6,
                    exponent: 2
                }
            );

            console.log(sqrt); // 6
            console.log(pow); // 36
        } catch (error) {
            console.log(error);    
        }
    })
    .catch((err) => {
        console.log(err);
    });
```

### 2. MathRepository.js - Receive request message and send response message

```javascript
// --- Step 1: Import sauromjs package
const Saurom = require('sauromjs');


// --- Step 2: Create a Service object
const Service = new Saurom.Service({
    repository: 'MathRepository', // required
});


// --- Step 3: Define services for repository MathRepository
        
// Service 'sqrt' of repository MathRepository
Service.register('sqrt', (req, res) => {
    const { number } = req;

    if (typeof number !== 'number') {
        res.error(new Error('Not a number'));
        return;
    }

    res.success(Math.sqrt(number));
});

// Service 'pow' of repository MathRepository
Service.register('pow', (req, res) => {
    const { baseNumber, exponent } = req;

    if (typeof baseNumber !== 'number') {
        res.error(new Error('Not a number'));
        return;
    }


    res.success(Math.pow(baseNumber, exponent));
});


// --- Step 4: connect to message queue
Service.connect()
    .then(() => { // Connected
        
    })
    .catch((err) => {
        console.log(err);
    });
```
