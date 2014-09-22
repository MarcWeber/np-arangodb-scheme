(function() {
  var chai, diff_and_a, expect, s, s0, s1, s2, s_diff, s_fix, ss, _;

  chai = require('chai');

  chai.config.showDiff = true;

  chai.config.includeStack = true;

  chai.config.truncateThreshold = 0;

  expect = chai.expect;

  _ = require('underscore');

  s = require('arangodb-scheme');

  s_fix = s.type_database.fix;

  s_diff = s.type_database.diff;

  s0 = {
    collections: {}
  };

  ss = {
    collections: {
      c1: {
        indexes: [
          {
            type: 'hash',
            unique: true,
            fields: ['firstname', 'lastname']
          }
        ]
      }
    }
  };

  s1 = {
    collections: {
      c0: {},
      c1: {
        indexes: [
          {
            type: 'hash',
            unique: true,
            fields: ['firstname', 'lastname']
          }
        ]
      }
    }
  };

  s2 = {
    collections: {
      c1: {
        indexes: [
          {
            type: 'hash',
            unique: true,
            fields: ['firstname']
          }
        ]
      }
    }
  };

  s_fix(s0);

  s_fix(ss);

  s_fix(s1);

  s_fix(s2);

  console.log(JSON.stringify(s1, void 0, 4));

  diff_and_a = function(sa, sb) {
    var diff;
    diff = s_diff(sa, sb);
    return {
      diff: diff,
      actions: s.diff_to_actions(diff)
    };
  };

  describe("arangodb-scheme module", function() {
    return it("schould create correct migration actions form scheme diffs", function() {
      var diff_0_1, diff_1_0, diff_1_2, e;
      diff_0_1 = diff_and_a(s0, s1);
      diff_1_0 = diff_and_a(s1, s0);
      diff_1_2 = diff_and_a(s1, s2);
      e = expect(diff_0_1.actions).deep.eq([
        {
          'create-collection': "c0"
        }, {
          'create-collection': "c1"
        }, {
          'create-index-on-collection': "c1",
          options: {
            type: 'hash',
            unique: true,
            fields: ['firstname', 'lastname']
          }
        }
      ]);
      expect(diff_1_0.actions).deep.eq([
        {
          'drop-collection': "c0"
        }, {
          'drop-collection': "c1"
        }
      ]);
      expect(diff_1_2.actions).deep.eq([
        {
          'drop-collection': "c0"
        }, {
          'drop-index-on-collection': "c1",
          options: {
            type: 'hash',
            unique: true,
            fields: ['firstname', 'lastname']
          }
        }, {
          'create-index-on-collection': "c1",
          options: {
            type: 'hash',
            unique: true,
            fields: ['firstname']
          }
        }
      ]);
      return console.log(s.upgrade_file_contents_async(diff_1_2.actions));
    });
  });

}).call(this);

/*
//@ sourceMappingURL=test-test.js.map
*/