var Instapaper = require('instapaper')
  , _          = require('lodash')
  , q          = require('q')
  , apiUrl     = 'https://www.instapaper.com/api/1.1'
;

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var auth        = dexter.provider('instapaper').credentials() 
          , client      = Instapaper(auth.consumer_key, auth.consumer_secret, {apiUrl: apiUrl})
          , titles      = step.input('title')
          , self        = this
          , connections = []
          , folders     = []
        ;

        if(!titles.length) return this.fail('A title is required');

        client.setOAuthCredentials(auth.access_token, auth.access_token_secret);

        _.each(titles,function(title) {
            var deferred = q.defer();
            client.bookmarks.client.request('/folders/add', {title: title})
               .then(function(result) {
                   folders.push({
                       title : result.title
                       , id  : result.folder_id
                   });
                   deferred.resolve();
               }).catch(function(err) {
                   deferred.reject(err);
               });

            connections.push(deferred.promise);
        });

        q.all(connections)
           .then(this.complete.bind(this, folders))
           .fail(this.fail.bind(this));
    }
};
