(function() {
  var Migration, diff_to_actions, fs, migrate, realise_actions, sdt, type_collection, type_database, type_index, upgrade_file_contents_async, _;

  fs = require('fs');

  _ = require("underscore");

  sdt = require("simple-diffable-types");

  type_index = function() {
    this.fix = function(v) {
      if (v.type == null) {
        throw "type missing";
      }
    };
    this.diff = sdt.diff_deep;
    return this.clean = _.id;
  };

  type_collection = new sdt.type_object_with_known_keys({
    known_keys: {
      indexes: {
        type: sdt.type_array_of(type_index)
      }
    }
  });

  type_database = new sdt.type_object_with_known_keys({
    known_keys: {
      collections: {
        type: new sdt.type_object_with_known_values({
          type: type_collection
        })
      }
    }
  });

  diff_to_actions = function(diff) {
    var actions, add, col, col_diff, diff_c, drop, index, k, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4;
    diff_c = diff.collections;
    actions = [];
    for (k in diff_c.lefts) {
      actions.push({
        'drop-collection': k
      });
    }
    _ref = diff_c.rights;
    for (k in _ref) {
      col = _ref[k];
      actions.push({
        'create-collection': k
      });
      _ref1 = col.indexes;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        index = _ref1[_i];
        actions.push({
          'create-index-on-collection': k,
          options: index
        });
      }
    }
    _ref2 = diff_c.both;
    for (k in _ref2) {
      col_diff = _ref2[k];
      _ref3 = col_diff.indexes.lefts;
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        drop = _ref3[_j];
        actions.push({
          'drop-index-on-collection': k,
          options: drop
        });
      }
      _ref4 = col_diff.indexes.rights;
      for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
        add = _ref4[_k];
        actions.push({
          'create-index-on-collection': k,
          options: add
        });
      }
    }
    return actions;
  };

  realise_actions = function(actions, cont) {};

  upgrade_file_contents_async = function(actions, review_message) {
    return "module.exports = function(realise_actions, cont){\n  " + (review_message != null ? "cont(" + (JSON.stringify(review_message)) + ")" : void 0) + "\n  var actions = [];\n" + (_.map(actions, function(a) {
      return "  actions.push(" + (JSON.stringify(a)) + ")\n";
    }).join("")) + "\n  realise_actions(actions);\n}";
  };

  Migration = function(migration_dir, current_version) {
    var file;
    this.migration_dir = migration_dir;
    file = function(n, ext) {
      return migration_dir + '/' + n + '.' + ext;
    };
    this.latest_on_disk = function() {
      var latest;
      if (this.latest == null) {
        latest = 1;
        while (!fs.existsSync(file(latest('.json')))) {
          latest += 1;
        }
        this.latest = latest(-1);
      }
      return this.latest;
    };
    this.write_migration_file = function(database) {
      var actions, empty, js_file, last_db, new_db_cleaned, next;
      new_db_cleaned = type_database.clean(database);
      last_db = this.latest_on_disk() === 1 ? (empty = {}, type_database.fix(empty), empty) : JSON.parse(fs.readFileSync(file(latest_on_disk()('.json'))));
      if (_.isEqual(cleaned, last_db)) {

      } else {
        next = latest_on_disk() + 1;
        actions = diff_to_actions(type_database.diff(last_db, new_db_cleaned));
        fs.writeFileSync(file(next('.json', JSON.stringify(new_db_cleaned))));
        js_file = file(next('.js'));
        return fs.writeFileSync(js_file, upgrade_file_contents_async({
          actions: actions
        }));
      }
    };
    return this.upgrade = (function(_this) {
      return function(realise_actions, db_version, cont) {
        if (_this.latest_on_disk() === db_version) {
          cont(void 0, db_version);
        }
        if (_this.latest_on_disk() < db_version) {
          cont("error: db_version " + db_version + " > version known to me from " + _this.migration_dir);
        }
        if (_this.latest_on_disk() > db_version) {
          db_version += 1;
          return require(file(db_version('.js')))(realise_action, function(err) {
            if (err) {
              cont(err);
            }
            return this.upgrade(realise_actions, db_version);
          });
        }
      };
    })(this);
  };

  migrate = function(migration_dir, database, cont) {};

  module.exports = {
    type_collection: type_collection,
    type_database: type_database,
    diff_databases: type_database.diff,
    diff_to_actions: diff_to_actions,
    migrate: migrate,
    upgrade_file_contents_async: upgrade_file_contents_async
  };

}).call(this);

/*
//@ sourceMappingURL=index.js.map
*/