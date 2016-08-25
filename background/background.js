var fileList = [],
  configs = {
    extensions: [],
    domains: []
  }, staticSettings, methods;

methods = {
  init: function () {

    methods.loadSettings()
      .then(function () {
        console.log('binding url event')
        chrome.webRequest.onBeforeRequest.addListener(
          methods.processImageRequest,
          {
            urls: configs.domains
          });
      })
  },
  processImageRequest: function (info) {
    var pathParts = info.url.split('.'),
      fileExtension = pathParts[pathParts.length - 1],
      index;

    console.log("intercepted request: " + info.url, fileExtension);

    index = _.indexOf(configs.extensions, fileExtension);

    if (index > -1) {
      console.log('found image');
      methods.addImageToList(info.url);
    }

  },
  addImageToList: function (url) {
    try {
      if (fileList.indexOf(url) == -1) {
        console.log('image is new, adding to list');
        fileList.push(url);

        chrome.runtime.sendMessage({ imageUrl: url });
      }
    } catch (e) {
      console.error('failure while adding image to list', e);
    }

  },
  xhr: function (method, url, data) {
    var xhr = new XMLHttpRequest(),
      deferred = RSVP.defer();

    xhr.onload = function (response) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var response = xhr.responseText;
          deferred.resolve(response);
        } else {
          deferred.reject(xhr.statusText);
        }
      }

    };
    xhr.onerror = function (e) {
      console.error('failed xhr request', arguments);
      deferred.reject(e);
    }
    xhr.open(method, url, true);
    xhr.send(data);

    return deferred.promise;

  },
  saveSettings: function () {
    localStorage['settings'] = JSON.stringify(staticSettings);
    console.log('saved settings', staticSettings);
  },
  loadSettingsFromFile: function () {
    return methods.xhr('get', chrome.extension.getURL('settings.json')).then(function (settingsString) {
      staticSettings = JSON.parse(settingsString);

      console.info('Loaded settings', staticSettings);

      methods.createRuntimeConfig();

      console.info('final configs', configs);

      methods.saveSettings();
    })
  },
  createRuntimeConfig: function () {
    _.each(staticSettings.profiles, function (profile) {
      _.each(profile.fileExtensions, function (extension) {
        configs.extensions.push(extension);
      });
      _.each(profile.domains, function (domain) {
        configs.domains.push(domain);
      });
    });
  },
  loadSettings: function () {
    var deferred = RSVP.defer(),
      saveSettings = localStorage['settings'];

    if (saveSettings === undefined) {
      console.log('no settings found, loading defaults');

      methods.loadSettingsFromFile()
        .then(deferred.resolve)
        .catch(deferred.reject);

    } else {
      staticSettings = JSON.parse(saveSettings);
      methods.createRuntimeConfig();
      console.log('loaded settings from local storage', configs, staticSettings)

      deferred.resolve();
    }

    return deferred.promise;
  }

};

// Let the deps load before we startup
setTimeout(function () {
  methods.init();
}, 10)
