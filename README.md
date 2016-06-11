# TypeLint

TypeLint is an ESlint rule for optional typing in JavaScript, based on JSDoc.
TypeLint provides optional typings to your code, not forcing you to write new definitions.
It helps to avoid access to missing properties of object and write more robust code.

# Demo

<img src="http://yarax.ru/images/demo.gif" width="600"/>

# Features

Currently TypeLint supports JSON Schema for describing data shapes.
JSON Schema is advanced, popular and well documented format for describing JSON data.
For example if you use Swagger for your API, you already have JSON Schema definitions, that you can use.
Also you can bind Mongoose schemas using TypeLint adapters.
To bind your models to TypeLint, put the following settings block to to root of your .eslintrc:

```js
  "settings": {
    "typelint" : {
      "modelsDir": "./swagger/models"
    }
  },
```

# Usage

```
npm i typelint
```

Put `typelint` rule to your .eslintrc with needed priority (2 is recommended)

Extend your JSDoc comments with TypeLint notations:

```js
/**
 * @param movieObject <movie>
 */
function getDirector(movieObject) {

```
Now TypeLint knows, that `movieObject` parameters has type of `movie`

Run 
```
eslint
```

or enable ESLint tools in your IDE, e.g WebStorm:

<img src="http://yarax.ru/images/wslint.gif" width="600"/>

# All eslinrc options

* lintNative - {Bolean} should TypeLint check native JS types, defined by ususal JSDoc notation
* modelsDir - {String} path to your models dir. Every file is a separate model
* excludeModelDirs - {Array} array of paths, that models finder should ignore while loading models
* adapters - {Array} array of adapters (functions in adapters dir) that would transform your models before comparing with real code cases.
* useCache - {Boolean} caches all models (will work faster, but changes in models will not affect)

# Planned features

* Support JSDoc typedef
* Support GraphQL schemas
* Possibility to use /*@var*/ definitions everywhere
* Handle passing typed variables (partially including)
* Detect when variable was reassigned 
* Other types of models bindings

# License

MIT.