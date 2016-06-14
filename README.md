# TypeLint

TypeLint is an [ESlint](http://eslint.org) rule for optional typing in JavaScript, based on [JSDoc](http://usejsdoc.org/).

Every application manages data, which is usually described in some way.

For example:

* Swagger definitions
* Mongoose schemas
* Redux store (reducers folding only)
* GraphQL schemas

The mission of TypeLint is to provide complex type checking, based on already described data shapes of your app.

# Demo

<img src="http://yarax.ru/images/demo.gif" width="600"/>

# Features

Currently TypeLint supports JSON Schema for describing data interfaces.

[JSON Schema](http://json-schema.org/) is advanced, popular and well documented format for describing JSON data.


For example if you use [Swagger](http://swagger.io/) for your API, you already have JSON Schema definitions, that you can use.

Also you can bind [Mongoose](http://mongoosejs.com) schemas using TypeLint adapters.

To bind your models to TypeLint, put the following settings block to the root of your .eslintrc:

```js
  "settings": {
    "typelint" : {
      "modelsDir": "./swagger/models"
    }
  },
```

Models are expected as files, where each of them contains one definition.

Name of the file is a name of the model.

Supported formats:
* JSON
* YAML
* JS files as common.js modules (export object is a schema)

# Example

```
git clone https://github.com/yarax/typelint.git
cd typelint
npm i
./node_modules/.bin/eslint --rulesdir rules/ example/index.js
```

# Usage

```
npm i eslint && npm i typelint
```

Put `typelint` rule to your .eslintrc with needed priority (2 is recommended).

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
    "typelint": 2
  },
  "settings": {
    "typelint" : {
      "modelsDir": "./models/swagger"
    }
  }
}

```

Extend your JSDoc comments with TypeLint notations `<typeName>`:

```js
/**
 * @param movieObject <movie>
 */
function getDirector(movieObject) {

```
Now TypeLint knows, that `movieObject` parameters has type of `movie`

Run
```
./node_modules/.bin/eslint --rulesdir ./node_modules/typelint/rules .
```

or enable ESLint tools in your IDE, e.g WebStorm:

<img src="http://yarax.ru/images/wslint.png" width="600"/>

# What it is and what it is not

TypeLint is a helper, but not a full-fledged typed system for js.

If you want to make your code 100% typed, please use any of existing static typed languages, which can be transpiled to JavaScript (TypeScript, Flow etc)

The goal of TypeLint is to help developer avoid `undefined` errors, but optionally and staying all the speed and flexibility of JavaScript developement.

`BTW` TypeLint was written with help of TypeLint 😊️

# All .eslinrc typelint settings options

* lintNative - {Bolean} should TypeLint check native JS types, defined by ususal JSDoc notation. `Default`: false
* modelsDir - {String} path to your models dir. Every file is a separate model
* excludeModelDirs - {Array} array of paths, that models finder should ignore while loading models
* adapters - {Array} array of adapters (functions in adapters dir) that would transform your models before comparing with real code cases.
* useCache - {Boolean} caches all models (will work faster, but changes in models will not affect). `Default`: false

# Planned features

* Support JSDoc typedef
* Support GraphQL schemas
* Possibility to use /*@var*/ definitions everywhere
* Handle passing typed variables (partially including)
* Detect when variable was reassigned 
* Other types of models bindings

# License

MIT.