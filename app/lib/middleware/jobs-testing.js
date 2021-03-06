'use strict';

module.exports = function (app) {
  if (process.env.NODE_ENV !== 'production') {
    app.post('/jobs/:name', (req, res) => {
      const name = req.params.name;
      const jobDefinition = app.agenda._definitions[name];

      if (!jobDefinition) {
        return res.status(404).send({message: 'no such job'});
      }

      const job = app.agenda.create(name, req.body);

      jobDefinition.fn(job, (err) => {
        if (err) {
          return res.status(400).send({error: err.message});
        }
        res.status(200).send({status: true});
      })
    });
  }
};
