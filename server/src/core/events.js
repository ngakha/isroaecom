const EventEmitter = require('events');

/**
 * Global event bus for real-time notifications.
 * Services emit events here, SSE endpoints listen and push to admin clients.
 */
const eventBus = new EventEmitter();
eventBus.setMaxListeners(50);

module.exports = eventBus;
