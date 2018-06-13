# TypeLint

TypeLint is an [ESlint](http://eslint.org) plugin for static type checking in JavaScript, based on [JSDoc](http://usejsdoc.org/).

Every application manages data, which is usually described in some way.

For example:

* Swagger definitions
* Redux store (folded reducers)
* JSON based database schemas (MongoDB, RethinkDB, CouchDB etc)
* GraphQL schemas

Mission of TypeLint is to provide complex type checking, based on **already described data structures** of your app.

# Demo

<img src="https://image.ibb.co/f2bsWQ/typelint.gif" width="600"/>

See also [Typelint example project](https://github.com/yarax/typelint-example)

# Installation

```
npm i eslint eslint-plugin-typelint
```

`If you use eslint globally, you should install typelint globally as well.`

Put typelint to eslint plugins array and add rule `typelint/typelint`

# Supported types declarations

All types are compatible with JSDoc and Closure Compiler. See [http://eslint.org/doctrine/demo/](http://eslint.org/doctrine/demo/) for examples

* `@param {TypeName} varName` Where TypeName is previously defined type. See type definition section below.
* `@param {[TypeName]} varName` Array of type TypeName
* `@param {{a: String, b: {c: [Number]}}}` Nested record types
* `@param {TypeName1|TypeName2}` Union types

# Type definitions

## Redux state

Redux is a popular store for React apps.

It describes the state shape as a composition of reducers.

Dealing with a big and deeply nested store it's easy to make mistakes with access to a wrong property.

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

When mentioned "dir" option, models are expected as files, where each of them contains one definition.
Name of the file is a name of the model.
When "swagger" option is used instead of "dir", the particular path is expected as a Swagger schema with "definitions" section.
See [Swagger docs](http://swagger.io/specification/#definitionsObject) for more information.

Supported formats:
* JSON
* YAML
* JS files as common.js modules (export object is a schema)

# Additional features

### Adapters

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

### Autocomplete

If you use WebStorm/PHPStorm 2016, all TypeLint types are available for autocomplete. Just run in your working directory:
```
cp node_modules/eslint-plugin-typelint/jsonSchemas.xml .idea/
```

# What it is and what it is not

TypeLint is a helper, but not a full-fledged typed system for js.

If you want to make your code 100% typed, please use any of existing static typed languages, which can be transpiled to JavaScript (TypeScript, Flow etc)

The purpose of TypeLint is to help developer avoid `undefined` errors, but optionally and staying all the speed and flexibility of pure JavaScript developement.

`BTW` TypeLint was written with help of TypeLint 😊️

# All .eslinrc typelint settings options

* models.json.dir - {String} path to your models dir. Every file is a separate model
* models.json.swagger - {String} path to your swagger schema file
* models.json.exclude - {Array} array of paths, that models finder should ignore while loading models
* models.json.adapters - {Array} array of paths to modules, which exports functions :: yourSchema -> JSONSchema.
* models.redux.reducerPath - {String} Path to the root Redux reducer
* useCache - {Boolean} caches all models (will work faster, but changes in models will not affect). `Default`: false

# Planned features

* Handle passing typed variables throw
* Detect when variable was reassigned
* Improve caching and performance
* Support GraphQL schemas
* Adapters for Mongoose and Thinky
* Other types of models bindings

[Changelog](https://github.com/yarax/typelint/blob/master/CHANGELOG.md)

[Article "Optional typing in JavaScript without transpilers"](https://medium.com/@raxwunter/optional-typing-in-javascript-without-transpilers-1f819d622a3a)

[Type features comparison: Haskell, TypeScript, Flow, JSDoc, JSON Schema](https://github.com/yarax/typescript-flow-haskell-types-comparison)

# License

MIT.

[![Build Status](https://travis-ci.org/yarax/eslint-plugin-typelint.svg?branch=master)](https://travis-ci.org/yarax/eslint-plugin-typelint)
