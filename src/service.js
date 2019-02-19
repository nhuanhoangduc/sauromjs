const amqp = require('amqplib');
const hyperid = require('hyperid');
const ERRORS = require('./errors');

const generateId = hyperid();

if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            var alt = {};
    
            Object.getOwnPropertyNames(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);
    
            return alt;
        },
        configurable: true,
        writable: true
    });
}


class Service {

    constructor(params = {}) {
        const {
            instanceId,
            repository,
            mqUrl
        } = params;

        if (!repository) {
            throw new Error(ERRORS.REPOSITORY_REQUIRED);
        }

        this.instanceId = instanceId || `${generateId()}`;
        this.repository = repository;
        this.mqUrl = mqUrl || 'amqp://localhost';

        this.connection = null;
        this.services = {};

        // Close connection
        process.on('exit', () => this.closeConnection());
        process.on('uncaughtException', () => this.closeConnection());
    }

    // Callback format: (request, response) => {}
    register(serviceName, callback) {
        this.services[serviceName] = callback;
    }

    async sendResponseMessage(responseMessageObject) {
        const { instanceId } = responseMessageObject;
        const responseMessageString = JSON.stringify(responseMessageObject);

        const responseQueueName = `${instanceId}_response`;

        // Create new sender channel
        const senderChannel = await this.connection.createChannel();
    
        // Send a request message to queue
        await senderChannel.sendToQueue(responseQueueName, Buffer.from(responseMessageString));
    }

    requestMessageHandler(msg) {
        const requestMessageObject = JSON.parse(msg.content.toString());
        const { requestId, instanceId, service, body } = requestMessageObject;
        const serviceCallback = this.services[service];

        if (!serviceCallback) {
            return;
        }

        // (request = body, response: { success, error }) => {}
        const requestObject = body;
        const responseObject = {
            success: (body) => {
                const responseMessageObject = {
                    ok: 1,
                    type: 'response',
                    requestId: requestId,
                    responseId: generateId(),
                    instanceId: instanceId,
                    responseInstanceId: this.instanceId,
                    repository: this.repository,
                    service: service,
                    body: body,
                };
                this.sendResponseMessage(responseMessageObject);
            },
            error: (err) => {
                const responseMessageObject = {
                    ok: 0,
                    type: 'response',
                    requestId: requestId,
                    responseId: generateId(),
                    instanceId: instanceId,
                    responseInstanceId: this.instanceId,
                    repository: this.repository,
                    service: service,
                    body: err.toJSON(),
                };
                this.sendResponseMessage(responseMessageObject);
            },
        };

        // Call service's callback
        serviceCallback(
            requestObject,
            responseObject
        );
    }

    async connect() {
        try {
            const requestQueueName = this.repository;

            // Connect to mq
            this.connection = await amqp.connect(this.mqUrl);

            // Create listener channel
            const listenerChannel = await this.connection.createChannel();

            // Create topic by using instanceId
            await listenerChannel.assertQueue(requestQueueName);

            // Listen response messages from queue
            listenerChannel.consume(requestQueueName, this.requestMessageHandler.bind(this), { noAck: true });
        } catch (error) {
            throw error;
        }
    }

    closeConnection() {
        if (!this.connection) {
            return;
        }
        
        try {
            this.connection.close();
        } catch (error) {
            
        }
    }
}


module.exports = Service;
