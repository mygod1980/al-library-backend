/**
 * Created by eugenia on 31.12.16.
 */

module.exports = (seed) => {
  return {
    name: `serviceName${seed}`,
    serviceKey: `fakeService${seed}`,
    serviceSecret: `serviceSecret${seed}`,
    clientSecret: `clientSecret${seed}`,
    securityKey: `securityKey${seed}`
  };
};