/**
 * Created by eugenia on 08.01.17.
 */
module.exports = (seed) => {
  return {
    title: `Fake Publication ${seed}`,
    publishedAt: new Date().getFullYear(),
    description: `fake description ${seed}`,
    imageUrl: `fake-url${seed}fake.com`
  };
};