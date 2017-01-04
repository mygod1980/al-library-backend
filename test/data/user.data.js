/**
 * Created by eugenia on 08/07/16.
 */

module.exports = (seed, role = 'user') => {
  return {
    role,
    firstName: 'Fake',
    lastName: 'Fake',
    username: `fakeUsername${seed}`,
    password: `password${seed}`,
  };
};