const Saurom = require('sauromjs');
const express = require('express')
const app = express();


const Request = new Saurom.Request({
    instanceId: 'ApiInstantceId', // default: auto generate an uniq id
    mqUrl: 'amqp://localhost', // default 'amqp://localhost'
    timeout: 2000, // Request timeout, default 5000
});

Request.connect()
    .then(() => {
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
