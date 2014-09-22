fs = require('fs')
_ = require("underscore")
sdt = require("simple-diffable-types")

type_index = ->
  this.fix = (v) ->
    throw "type missing" unless v.type?
    # hash:	hash	index
    # skiplist:	skiplist	index
    # fulltext:	fulltext	index
    # bitarray:	bitarray	index
    # geo1:	geo	index,	with	one	attribute
    # geo2:	geo	index,	with	two	attributes
    # cap:	cap	constraint

  this.diff = sdt.diff_deep
  this.clean = _.id

type_collection = new sdt.type_object_with_known_keys
  known_keys:
    indexes:
      type: sdt.type_array_of type_index

type_database = new sdt.type_object_with_known_keys
  known_keys:
    collections:
      type: new sdt.type_object_with_known_values(
        type: type_collection
      )

diff_to_actions = (diff) ->
  diff_c = diff.collections
  actions = []
  # drop collections
  for k of diff_c.lefts
    actions.push
      'drop-collection': k

  # create collections
  for k, col of diff_c.rights
    actions.push
      'create-collection': k

    # create indexes
    for index in col.indexes
      actions.push
        'create-index-on-collection': k
        options: index

  # modify collections
  for k, col_diff of diff_c.both
    for drop in col_diff.indexes.lefts
      actions.push
        'drop-index-on-collection': k
        options: drop

    for add in col_diff.indexes.rights
      actions.push
        'create-index-on-collection': k
        options: add
  actions

realise_actions_sync = (actions, cont) ->
  throw "not implemented yet"

realise_actions_async = (actions, cont) ->
  # 'drop-collection': name
  # 'create-collection': name
  # 'create-index-on-collection': name, options: index-options
  # 'drop-index-on-collection': name, options; index-options
  # 'rename-collection': (from: old name, to: new name)


upgrade_file_contents_sync = (actions, review_message) ->
  """
    module.exports = function(realise_actions){
      #{ "cont(#{JSON.stringify(review_message)})" if review_message?  }
      var actions = [];
    #{_.map(actions, (a) ->
      "  actions.push(#{JSON.stringify(a)})\n"
      ).join("")
      }
      realise_actions(actions);
    }
  """

upgrade_file_contents_async = (actions, review_message) ->
  """
    module.exports = function(realise_actions, cont){
      #{ "cont(#{JSON.stringify(review_message)})" if review_message?  }
      var actions = [];
    #{_.map(actions, (a) ->
      "  actions.push(#{JSON.stringify(a)})\n"
      ).join("")
      }
      realise_actions(actions, cont);
    }
  """

#### TODO: refactor - there are more use cases than this
Migration = (migration_dir, current_version) ->

  this.migration_dir = migration_dir

  file = (n, ext) -> migration_dir + '/'+n+'.'+ext

  this.latest_on_disk = ->
    if !this.latest?
      latest = 1
      while !fs.existsSync(file latest '.json')
        latest += 1
      this.latest = latest -1
    this.latest

  this.write_migration_file = (database) ->
    new_db_cleaned = type_database.clean database
    last_db = if this.latest_on_disk() == 1
      empty = {}
      type_database.fix empty
      empty
    else
      JSON.parse(fs.readFileSync(file latest_on_disk() '.json'))

    if (_.isEqual(cleaned, last_db))
    else
      next = latest_on_disk()+1
      actions = diff_to_actions(type_database.diff(last_db, new_db_cleaned))
      fs.writeFileSync(file next '.json', JSON.stringify(new_db_cleaned))
      js_file = file next '.js'
      fs.writeFileSync(js_file, upgrade_file_contents_async(actions: actions))

  this.upgrade = (realise_actions, db_version, cont) =>
    if (this.latest_on_disk() == db_version)
      cont(undefined, db_version)

    if (this.latest_on_disk() < db_version)
      cont("error: db_version "+db_version+" > version known to me from "+this.migration_dir)

    if (this.latest_on_disk() > db_version)
      db_version += 1
      require(file db_version '.js')(realise_action, (err) ->
        cont(err) if err
        this.upgrade(realise_actions, db_version)
      )

migrate = (migration_dir, database, cont) ->

module.exports =
  type_collection: type_collection
  type_database: type_database
  diff_databases: type_database.diff
  diff_to_actions: diff_to_actions
  migrate: migrate
  upgrade_file_contents_async: upgrade_file_contents_async
  upgrade_file_contents_sync: upgrade_file_contents_async

  realise_actions_async: realise_actions_async
  realise_actions_sync: realise_actions_sync
