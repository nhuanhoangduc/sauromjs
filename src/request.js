const amqp = require('amqplib');
const hyperid = require('hyperid');
const ERRORS = require('./errors');

const generateId = hyperid();;


class Request {

    constructor(params = {}) {
        const {
            instanceId,
            mqUrl,
            timeout
        } = params;
    
        this.instanceId = instanceId || `${generateId()}`;
        this.mqUrl = mqUrl || 'amqp://localhost';
        this.timeout = timeout || 5000;

        this.connection = null;
        this.waitingRequestResponses = {};

        // Close connection
        process.on('exit', () => this.closeConnection());
        process.on('uncaughtException', () => this.closeConnection());
    }

    responseMessageHandler(msg) {
        try {
            const responseMessageObject = JSON.parse(msg.content.toString());
            const { requestId, ok, body } = responseMessageObject;

            const waitingRequest = this.waitingRequestResponses[requestId];

            if (!waitingRequest) {
                return;
            }

            clearTimeout(waitingRequest.requestTimeout);
            delete waitingRequest.requestTimeout;

            if (ok === 1) { // Success
                waitingRequest.resolve(body);
            } else { // Error
                waitingRequest.reject(new Error(body.message));
            }

            delete this.waitingRequestResponses[requestId];
        } catch (error) {
            
        }
    }

    async connect() {
        try {
            const responseQueueName = `${this.instanceId}_response`;

            // Connect to mq
            this.connection = await amqp.connect(this.mqUrl);

            // Create listener channel
            const listenerChannel = await this.connection.createChannel();

            // Create topic by using instanceId
            await listenerChannel.assertQueue(responseQueueName);

            // Listen response messages from queue
            listenerChannel.consume(responseQueueName, this.responseMessageHandler.bind(this), { ackAll: true });
        } catch (error) {
            throw error;
        }
    }

    call(repositoryName, serviceName, body) {
       return new Promise(async (resolve, reject) => {
            try {
                const messageObject = {
                    type: 'request',
                    requestId: generateId(),
                    instanceId: this.instanceId,
                    repository: repositoryName,
                    service: serviceName,
                    body: body,
                };
                const messageString = JSON.stringify(messageObject);
                
                // Request timeout
                const requestTimeout = setTimeout(() => {
                    const waitingRequest = this.waitingRequestResponses[messageObject.requestId];
                    
                    if (!waitingRequest) {
                        return;
                    }

                    waitingRequest.reject(new Error(ERRORS.REQUEST_TIMEOUT));
                    delete this.waitingRequestResponses[messageObject.requestId];
                }, this.timeout);

                // Push callback to waiting object
                this.waitingRequestResponses = {
                    [messageObject.requestId]: {
                        resolve: resolve,
                        reject: reject,
                        requestTimeout: requestTimeout,
                    },
                };
    
                // Create new sender channel
                const senderChannel = await this.connection.createChannel();
    
                // Send a request message to queue
                await senderChannel.sendToQueue(repositoryName, Buffer.from(messageString));
            } catch (error) {
                reject(error);
            }
       });
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


module.exports = Request;
