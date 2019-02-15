const Saurom = require('sauromjs');
const UserModel = require('./UserModel');


const Service = new Saurom.Service({
    instanceId: 'ServiceInstanceID', // default: auto generate an uniq id
    repository: 'UserRepository', // required
    mqUrl: 'amqp://localhost', // default 'amqp://localhost'
});


Service.connect()
    .then(() => {
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
