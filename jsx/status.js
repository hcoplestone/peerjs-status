/** @jsx React.DOM */
var TestChart = React.createClass({
  getInitialState: function() {
    return {
      results: [],
      clientBrowsers: [],
      hostBrowsers: [],
      selectedClient: null,
      selectedHost: null
    };
  },
  componentWillMount: function() {
    this.loadTestResults();
  },
  loadTestResults: function() {
    var component = this;
    $.ajax({
      url: this.props.url,
      dataType: 'json'
    }).success(function(data) {
      component.setStateFromServerData(data);
    }).error(function(xhr, status, err) {
      console.error(component.props.url, status, err.toString());
    });
  },

  setStateFromServerData: function(data) {
    // Results, keyed on host.
    var resultsByHost = {};
    data.map(function(result) {
      var name = browserName(result.host.browser);
      resultsByHost[name] = resultsByHost[name] || [];
      resultsByHost[name].push(result);
    });
    // Results, keyed on client.
    var resultsByClient = {};
    data.map(function(result) {
      var name = browserName(result.client.browser);
      resultsByClient[name] = resultsByClient[name] || [];
      resultsByClient[name].push(result);
    });

    var hostBrowsers = Object.keys(resultsByHost);
    var clientBrowsers = Object.keys(resultsByClient);
    var clientBrowserOrder = {};

    for (var i = 0, numBrowsers = clientBrowsers.length; i < numBrowsers; i += 1) {
      clientBrowserOrder[clientBrowsers[i]] = i;
    }

    function clientBrowserSort(a, b) {
      return clientBrowserOrder[browserName(a.client.browser)] < clientBrowserOrder[browserName(b.client.browser)]
    }

    // First level: host, second nested level: client.
    var results = [];
    // Order matters here, so let's be explicit.
    for (var i = 0, numBrowsers = hostBrowsers.length; i < numBrowsers; i += 1) {
      var browser = hostBrowsers[i];
      results[i] = resultsByHost[browser].sort(clientBrowserSort);
    }
    this.setState({results: results, hostBrowsers: hostBrowsers, clientBrowsers: clientBrowsers});
  },

  selectClient: function(i) {
    this.setState({selectedClient: this.state.clientBrowsers[i]});
  },
  selectHost: function(i) {
    this.setState({selectedHost: this.state.hostBrowsers[i]});
  },
  selectHostAndClientFromResult: function(i, j) {
    var selectedResult = this.state.results[i][j];
    this.setState({
      selectedClient: browserName(selectedResult.client.browser),
      selectedHost: browserName(selectedResult.host.browser)
    });
  },

  isSelected: function(host, client) {
    return this.state.selectedClient === client || this.state.selectedHost === host
  },

  render: function() {
    var results = this.state.results.map(function(hostResults, i) {
      var host = browserName(hostResults[0].host.browser);
      hostResults = hostResults.map(function(result, j) {
        if (host !== browserName(result.host.browser)) {
          console.error('Hosts don\'t match in the same column!!');
        }
        var client = browserName(result.client.browser);
        var classes = (this.isSelected(host, client) ? 'selected ' : '') +
          'result ' + browserClassName(client);
        return (
          <div className={classes} onMouseEnter={this.selectHostAndClientFromResult.bind(this, i, j)}>
            Pass!
          </div>
        );
      }, this);

      var classes = 'results ' + browserClassName(host);
      return (
        <div className={classes}>
          {hostResults}
        </div>
      );
    }, this);

    var hostBrowsers = this.state.hostBrowsers.map(function(browser, i) {
      var classes = 'browser ' + browserClassName(browser) +
        (this.state.selectedHost === browser ? ' selected' : '');
      return (
        <div className={classes} onMouseEnter={this.selectHost.bind(this, i)}>
          {browser}
        </div>
      );
    }, this);
    var clientBrowsers = this.state.clientBrowsers.map(function(browser, i) {
      var classes = 'browser ' + browserClassName(browser) +
        (this.state.selectedClient === browser ? ' selected' : '');
      return (
        <div className={classes} onMouseEnter={this.selectClient.bind(this, i)}>
          {browser}
        </div>
      );
    }, this);

    return (
      <div className="chart">
        Test results will go here!
        <div className="client browsers">
          {clientBrowsers}
        </div>
        <div className="host browsers">
          {hostBrowsers}
        </div>
        {results}
      </div>
    );
  }
});

React.renderComponent(
  // TODO: <TestChart url='/ajax/status' />,
  <TestChart url='dummy.json' />,
  document.getElementById('content')
);


// Helpers
function browserName(browserHash) {
  return browserHash.name + ' (' + browserHash.majorVersion + ')';
}

function browserClassNameFromHash(browserHash) {
  return browserHash.name.toLowerCase() + '' + browserHash.majorVersion;
}

function browserClassName(browserString) {
  return browserString.replace(/[\s\(\)]/g, '').toLowerCase();
}