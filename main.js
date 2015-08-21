(function() {
  // debug at john's pro
  var MANIFEST_URL = 'app://f7fd3427-a9a1-764e-ac74-1940de353c1e/manifest.webapp';
  // online version
  // var MANIFEST_URL = 'https://shinglyu.github.io/fxos_addon_hackathon/manifest.webapp';

  function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1);
  }

  function HackathonAddon(addon) {
    this.inited = false;
    console.log('wait for init');
    this.waitForApp().then(() => {
      console.log('init');
      this.init();
    }).catch((e) => {
      console.error(e);
    });
    // this.downloadList().then((list) => {
    //   this.appList = list;
    //   if (this.inited) {
    //     this.initAddonList();
    //   }
    // });
  }

  HackathonAddon.TEMPLATE = `{$TEMPLATE}`;

  HackathonAddon.prototype.init = function() {
    if (this.inited) {
      // We don't know the state of first installation. It should be 'uninited',
      // but it isn't always.
      // To prevent multiple initialization, I use this variable to pretect it.
      return;
    }
    this.tabs = document.querySelector('gaia-tabs');
    this.tab = document.createElement('a');
    this.tab.textContent = 'Hackathon';
    this.tabs.appendChild(this.tab);
    this.tabs.addEventListener('change', this);
    // this.tabs.setupMarker();
    console.log('inited', this.tabs, this.tabs.nodeName);
    // this.createList();
    this.inited = true;
    if (this.appList) {
      // this.initAddonList();
    }
  };

  HackathonAddon.prototype.createList = function() {
    this.list = document.createElement('gaia-list');
    this.list.className = 'hackathon-list';

    document.body.appendChild(this.list);
  };

  HackathonAddon.prototype.uninit = function() {
    this.tabs.removeEventListener('change', this);
    this.tabs.removeChild(this.tab);
    this.tab = null;
    this.tabs = null;
    this.inited = false;
  };

  HackathonAddon.prototype.listItemTemplate = function({ name, author, icon }) {
    var string = `
      <img class="icon" src="${icon}"/>
      <div flex class="description">
        <p class="name">${capitalize(name)}</p>
        <p class="author">${author}</p>
      </div>
      <span class="install-info">Installed</span>
      <gaia-button class="install-button">Loading...</gaia-button>`;
    return string;
  }

  HackathonAddon.prototype.createListItem = function(data) {
    var item = document.createElement('li');
    item.classList.add('item', data.type);
    item.innerHTML = this.listItemTemplate(data);
    this.list.appendChild(item);

    item.addEventListener('click', function(manifestURL, evt) {
      if (evt.target.classList.contains('install-button')) {
        return;
      }
      this.detailsHandlers.forEach(handler => {
        handler(manifestURL);
      });
    }.bind(this, data.manifestURL));

    item.querySelector('.install-button').addEventListener('click',
      function(data) {
        this.installHandlers.forEach(handler => {
          handler(data);
        });
      }.bind(this, data));

    return item;
  };

  HackathonAddon.prototype.waitForApp = function() {
    return new Promise((resolve, reject) => {
      var check = () => {
        if (document.getElementsByTagName('gaia-tabs').length > 0 &&
            !!document.getElementById('app-list') &&
            !!document.getElementById('addon-list')) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  HackathonAddon.prototype.downloadList = function (url) {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest({ mozSystem: true, mozAnon: true });
      xhr.open('GET', url, true);
      xhr.responseType = 'json';
      xhr.onload = () => {
        var apps = {};
        if (xhr.status === 200) {
          apps = xhr.response;
        } else {
          console.log('Error fetching app list', xhr.status);
        }
        resolve(apps);
      };
      xhr.onerror = (e) => {
        console.log('Error fetching app list', e);
        resolve({});
      };
      xhr.send();
    });
  }

  HackathonAddon.prototype.handleEvent = function(e) {
    console.log('handleEvent: ', e.type, this.tabs, this.tabs.selected);
    switch(e.type) {
      case 'change':
        if (this.tabs.selected === 2) {
          this.tabs.setupMarker();
          this.tabs.setMarkerPosition(2);
        }
        break;
    }
  };

  function HackathonAddonMgmt() {
    // if (document.documentElement.dataset.hackathonAddon) {
    //   console.log('hackathon addon is already injected');
    //   return;
    // }
    this.hackathon = new HackathonAddon();

    navigator.mozApps.mgmt.addEventListener('enabledstatechange', this);
    navigator.mozApps.mgmt.addEventListener('uninstall', this);

    document.documentElement.dataset.hackathonAddon = true;
  }

  HackathonAddonMgmt.prototype.handleEvent = function(e) {
    if (e.application.manifestURL !== MANIFEST_URL) {
      return;
    }

    switch(e.type) {
      case 'enabledstatechange':
        if (e.application.enabled) {
          this.hackathon.init();
        } else {
          this.hackathon.uninit();
        }
        break;
      case 'uninstall':
        this.hackathon.uninit();
        navigator.mozApps.mgmt.removeEventListener('enabledstatechange', this);
        navigator.mozApps.mgmt.removeEventListener('uninstall', this);
        document.documentElement.removeAttribute('data-hackathon-addon');
        break;
    }
  };
  if (document.readyState !== 'loading') {
    new HackathonAddonMgmt();
  } else {
    document.addEventListener('readystatechange',
      function readyStateChange() {
        if (document.readyState === 'interactive') {
          document.removeEventListener('readystatechange',
            readyStateChange);
          console.log('create mgmt');
          new HackathonAddonMgmt();
        }
      });
  }
})();
