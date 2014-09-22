chai = require('chai')
chai.config.showDiff = true
chai.config.includeStack = true
chai.config.truncateThreshold = 0
expect = chai.expect
_ = require('underscore')

s = require('arangodb-scheme')
s_fix = s.type_database.fix
s_diff = s.type_database.diff


# sample schemes

s0 =
  collections: {}

ss =
  collections:
    c1:
      indexes: [
        type: 'hash'
        unique: true
        fields: ['firstname','lastname']
      ]

# add a simple collections c0, c1, c1 having index
s1 =
  collections:
    c0: {}

    c1:
      indexes: [
        type: 'hash'
        unique: true
        fields: ['firstname','lastname']
      ]

s2 =
  collections:
    c1:
      indexes: [
        type: 'hash'
        unique: true
        fields: ['firstname']
      ]

# adding default values, sanity check:
s_fix s0
s_fix ss
s_fix s1
s_fix s2

console.log( JSON.stringify(s1, undefined, 4))

diff_and_a = (sa, sb) ->
 diff = s_diff(sa, sb)
 diff: diff
 actions: s.diff_to_actions(diff)


describe "arangodb-scheme module", ->
  it "schould create correct migration actions form scheme diffs", ->
    diff_0_1 = diff_and_a(s0, s1)
    diff_1_0 = diff_and_a(s1, s0)
    diff_1_2 = diff_and_a(s1, s2)

    e = 
    # test creating empty collection, create collection with key
    expect(diff_0_1.actions).deep.eq(
      [
            'create-collection': "c0"
          ,
            'create-collection': "c1"
          ,
            'create-index-on-collection': "c1"
            options:
              type: 'hash'
              unique: true
              fields: ['firstname', 'lastname']
      ])

    # drop both collections (keys will be dropped automatically)
    expect(diff_1_0.actions).deep.eq(
      [
        'drop-collection': "c0"
      ,
        'drop-collection': "c1"
      ])

    # change index (drop and add), drop col0
    expect(diff_1_2.actions).deep.eq(
      [
        'drop-collection': "c0"
      ,
        'drop-index-on-collection': "c1"
        options:
          type: 'hash'
          unique: true
          fields: ['firstname', 'lastname']
      ,
        'create-index-on-collection': "c1"
        options:
          type: 'hash'
          unique: true,
          fields: ['firstname']
      ])

    console.log(s.upgrade_file_contents_async(diff_1_2.actions) )

    # console.log( JSON.stringify(diff_1_0.diff , undefined, 4))
    # console.log( JSON.stringify(diff_1_2.diff , undefined, 4))
