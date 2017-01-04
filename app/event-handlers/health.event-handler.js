/**
 * Created by eugenia on 05/06/16.
 */
'use strict';

let healthService = require('app/lib/services/health.service');

module.exports = (eventBus) => {
  eventBus.on(eventBus.EVENTS.UPDATE_HEALTH, function (event) {
    healthService.updateData(event.key, event.status, event.value);
  });
};
