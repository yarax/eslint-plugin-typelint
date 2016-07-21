# TypeLint

TypeLint is an [ESlint](http://eslint.org) plugin for optional typing in JavaScript, based on [JSDoc](http://usejsdoc.org/).

Every application manages data, which is usually described in some way.

For example:

* Swagger definitions
* JSON based database schemas (MongoDB, RethinkDB, CouchDB etc)
* Redux store (folded reducers)
* GraphQL schemas

Mission of TypeLint is to provide complex type checking, based on **already described data structures** of your app.

# Demo

<img src="http://yarax.ru/images/demo.gif" width="600"/>

# Installation

```
npm i eslint && npm i eslint-plugin-typelint
```

`If you use eslint globally, you should install typelint globally as well.`

Put typelint to eslint plugins array and add needed rules:

* `typelint/composite` - checks composite types, based on models
* `typelint/primitive` - checks access to JavaScript primitive types properties

For example, your .eslintrc can look as following:
```js
{
  "env": {
    "node": true,
    "es6": true
  },
  "rules": {
    "no-console": 0,
    "no-param-reassign": 2,
    "typelint/composite": 2,
    "typelint/primitive": 2
  },
  "settings": {
      "typelint": {
          "models": {
              "json": {
                  "dir": "./models"
              }
          }
      }
  }
}
```

# Usage



Extend your JSDoc comments with TypeLint notations `<typeName>`:

```js
/**
 * @param movieObject <movie>
 */
function getDirector(movieObject) {

```
Now TypeLint knows, that `movieObject` parameter has type of `movie`

Run ESLint from terminal
```
./node_modules/.bin/eslint .
```

or enable ESLint tools in your IDE, e.g WebStorm:

<img src="http://yarax.ru/images/wslint.png" width="600"/>

# Features

## Redux state

Redux is a popular state container for React apps.

It describes the state shape as a composition of reducers with theirs initial values.

Dealing with a big and deeply nested store it's easily to make a mistake with access to a wrong property.

Typelint constructs the Redux schema, based on initial values of reducers, detecting types of end values.

To use it, just add the redux option to settings.typelint.models section of .eslintrc with path to your root reducer:

```
"settings": {
  "typelint": {
    "models": {
      "redux": {
        "reducerPath": "./src/client/redux/reducer.js"
      }
    },
    "useCache":  true
  }
}
```

After that you can use a new typelint type <ReduxState> in JSDoc comments.

## API/Swagger

TypeLint supports JSON Schema for describing data interfaces.

[JSON Schema](http://json-schema.org/) is advanced, popular and well documented format for describing JSON data.


For example if you use [Swagger](http://swagger.io/) for API, you already have JSON Schema definitions, that you can use.

To bind your models to TypeLint, put the json option to settings.typelint.models section of your .eslintrc:

```js
  "settings": {
    "typelint": {
      "models": {
        "json": {
          "dir": "./models",
          "exclude": ["wrong_dir"]
        },
      }
    }
  }
```

Models are expected as files, where each of them contains one definition.

Name of the file is a name of the model.

Supported formats:
* JSON
* YAML
* JS files as common.js modules (export object is a schema)

Adapters can be used for transforming schemas from one format to another. For example:
```
"json": {
  "dir": "./models",
  "exclude": ["wrong_dir"],
  "adapters": ["./node_modules/eslint-plugin-typelint/adapters/to-camel-case"]
},
```
There are two already existed adapters: to-camel-case and to-snake-case. They appropriately convert fields of schema.
You can write your own adapters, using the same interface.

# What it is and what it is not

TypeLint is a helper, but not a full-fledged typed system for js.

If you want to make your code 100% typed, please use any of existing static typed languages, which can be transpiled to JavaScript (TypeScript, Flow etc)

The goal of TypeLint is to help developer avoid `undefined` errors, but optionally and staying all the speed and flexibility of pure JavaScript developement.

`BTW` TypeLint was written with help of TypeLint 😊️

# All .eslinrc typelint settings options

* models.json.dir - {String} path to your models dir. Every file is a separate model
* models.json.exclude - {Array} array of paths, that models finder should ignore while loading models
* models.json.adapters - {Array} array of paths to modules, which exports functions :: yourSchema -> JSONSchema.
* models.redux.reducerPath - {String} Path to the root Redux reducer
* useCache - {Boolean} caches all models (will work faster, but changes in models will not affect). `Default`: false

See also [settings schema](https://github.com/yarax/typelint/blob/master/models/settings.yml), that TypeLint is using for typing check itself.

# Planned features

* Support GraphQL schemas
* Possibility to use /*@var*/ definitions everywhere
* Handle passing typed variables (partially including)
* Detect when variable was reassigned 
* Other types of models bindings

# License

MIT.
