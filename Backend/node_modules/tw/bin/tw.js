var PROG_NAME, URL, argv, displayTweet, fetch, http, matches, searchTweets, viewStatus, viewUserStatuses;

argv = require('optimist').argv;

http = require('http');

URL = require('url');

PROG_NAME = 'tw';

if (argv.h) {
  console.log("Usage: " + PROG_NAME + " <tweet url | tweet id>");
  console.log(" -h                          show help");
  console.log(" -u <nick>                   user's tweets");
  console.log(" -s <search term>            search tweets");
  console.log(" -i <status id | status url> show status\n");
  process.exit();
}

fetch = function(path, cb) {
  var options, req, show_error, url, _ref;
  show_error = function(obj) {
    return console.log("Error: " + (obj.message || obj.error));
  };
  if (path.match(/^http/) && (url = URL.parse(path))) {
    options = {
      host: url.hostname,
      post: (_ref = url.protocol === 'https') != null ? _ref : {
        443: 80
      },
      path: url.pathname + url.search
    };
  } else {
    options = {
      host: "api.twitter.com",
      post: 443,
      path: path
    };
  }
  req = http.get(options, function(res) {
    var buf;
    res.setEncoding("utf8");
    buf = "";
    res.on("data", function(chunk) {
      return buf += chunk;
    });
    return res.on("end", function() {
      var o;
      o = JSON.parse(buf);
      if (o.error) {
        return console.log("Error: " + o.error);
      } else {
        return cb(o);
      }
    });
  });
  return req.on("error", function(e) {
    return show_error(e);
  });
};

viewUserStatuses = function(screen_name) {
  var path;
  path = "/1/statuses/user_timeline.json?screen_name=" + screen_name;
  return fetch(path, function(tweets) {
    return tweets.map(function(e) {
      return displayTweet(e);
    });
  });
};

viewStatus = function(status_id) {
  var path;
  path = "/1/statuses/show/" + status_id + ".json";
  return fetch(path, function(tweet) {
    return displayTweet(tweet);
  });
};

searchTweets = function(query) {
  var uri;
  uri = 'https://search.twitter.com/search.json?q=' + query;
  return fetch(uri, function(response) {
    response.results || (response.results = []);
    return response.results.map(function(r) {
      return displayTweet({
        created_at: r.created_at,
        user: {
          screen_name: r.from_user
        },
        text: r.text
      });
    });
  });
};

displayTweet = function(tweet) {
  var d, date, date_str, time;
  d = new Date(tweet.created_at);
  date = ['Date', 'Month', 'FullYear'].map(function(n) {
    return d['getUTC' + n]();
  });
  time = ['Hours', 'Minutes', 'Seconds'].map(function(n) {
    return d['getUTC' + n]();
  });
  date_str = date.join('/') + ' ' + time.join(':') + ' UTC';
  return console.log(tweet.user.screen_name + " (" + date_str + "): " + tweet.text + "\n");
};

if (argv.u) viewUserStatuses(argv.u);

if (argv.s) searchTweets(argv.s);

if (argv.i) viewStatus(argv.i);

if (argv._.length === 1 && (matches = ("" + argv._[0]).match(/(status\/)?(\d+)\/?/))) {
  viewStatus(matches[2]);
}
