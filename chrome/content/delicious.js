var DeliciousParser = {
  parse: function(xml) {
    var posts = xml.getElementsByTagName('post');

    var list = [];
    for (var i = 0, len = posts.length; i < len; i++) {
      var bookmark = {};
      var post = posts[i];

      bookmark.id = i;
      bookmark.url = post.getAttribute('href');
      bookmark.title = post.getAttribute('description');
      bookmark.info = post.getAttribute('extended') || '';
      bookmark.tags = post.getAttribute('tag') || '';
      if (bookmark.tags != '') bookmark.tags = '[' + bookmark.tags.replace(/ /g, '] [') + ']';
      bookmark.time = post.getAttribute('time');

      list.push(bookmark);
    }

    return list;
  },

  getUserId: function(xml) {
    return xml.evaluate('/posts/@user', xml, null, XPathResult.STRING_TYPE, null).stringValue;
  }
}


var DeliciousLoader = function(statusElement, loadingElement, database, callback) {
  this.init(statusElement, loadingElement, database, callback);
};

for (var prop in LoaderBase.prototype) {
  DeliciousLoader.prototype[prop] = LoaderBase.prototype[prop];
}

DeliciousLoader.prototype.url = 'https://api.delicious.com/v1/posts/all?results=10000000';

DeliciousLoader.prototype._load = function() {

  var self = this;
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      try {
        request.status
      } catch(e) {
        // error
        self.error('error :connect error :' + self.url);
      }

      if (request.status == 200) {
        // success

        var xml = request.responseXML;

        var userId = DeliciousParser.getUserId(xml);

        prefBranch.setCharPref('userId', userId);
        incsearch.userId = userId;

        var bookmarks = DeliciousParser.parse(xml);

        self.total = bookmarks.length;

        var generator = self.update(bookmarks);

        var executer = new Executer(
          generator,
          100,
          function(count) {
            self.dispLoading(count);
          },
          function() {
            self.dispEnd(bookmarks.length);
            self.callback();
          }
        );

        executer.run();
      } else {
        // error
        var errMsg = 'error: ' + request.status + ': ' + request.statusText + ': ' + self.url;
        self.error(errMsg);
      }
    }
  };
  request.open("POST", this.url, true);
  request.send(null);
};

IncSearch.prototype.createEditUrl = function(bookmark) {

  var editUrl = 'http://delicious.com/save?noui=1&jump=doclose&v=5&url=' + escape(bookmark.url);

  return editUrl;
};


var EXTENSION_NAME = 'delicious_incsearch';
var BookmarkLoader = DeliciousLoader;
