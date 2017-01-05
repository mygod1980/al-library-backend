/**
 * Created by eugenia on 20/02/15.
 */
'use strict';

const _ = require('lodash');
const Bb = require('bluebird');
const EventEmitter = require('events').EventEmitter;

class EventBus {

  constructor() {
    this.spaces = {};
    this.bus = new EventEmitter();
    this.errorHandler = console.log;
  }

  register(space, events) {
    if (this.spaces[space]) {
      throw new Error('This space is already registered');
    }
    this.spaces[space] = _.invert(events);
    return this;
  }

  setDefaultSpace(space) {
    this.defaultSpace = space;
    return this;
  }

  emitDeferred(space, event, data) {
    process.nextTick(this.emit.bind(this, space, event, data));
  }

  emit(space, event, data) {
    if (!data) {
      data = event;
      event = space;
      space = this.defaultSpace;
    }
    const key = this._getKey(space, event);

    return this.bus.emit(key, data);
  }

  on(space, event, handler) {
    if (!handler) {
      handler = event;
      event = space;
      space = this.defaultSpace;
    }

    const key = this._getKey(space, event);

    const wrapper = (event) => {
      return Bb
        .try(() => {
          return handler(event);
        })
        .catch(this.errorHandler);
    };

    return this.bus.on(key, wrapper);
  }

  onError(handler) {
    this.errorHandler = handler || console.log;
    return this.bus.on('error', handler);
  }

  _getKey(space, event) {
    const spaceEvents = this.spaces[space];
    if (!spaceEvents) {
      throw new Error(`Unregistered space: ${space}`);
    }
    const eventVal = spaceEvents[event];
    if (!eventVal) {
      throw new Error(`Unregistered event: ${event} in space: ${space}`);
    }

    return `${space}.${event}`;
  }
}



module.exports = new EventBus();
