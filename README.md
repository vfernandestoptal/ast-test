# Generating API specification from TypeScript types

Objectives:
-----------
- generate documentation to lookup API operations
- generate client code for calling the API

Context:
--------
The OpenAPI Initiative - formerly Swagger - provides a specification and a set of tools to achive these goals and is thus a good candidate for it.

To be able to generate the API specification, we need to gather information about the API endpoints and the expected parameters/responses.

Typescript itself provides a compiler API that allows us to load and process the AST for a project.

Proof of concept:
-----------------
The TypeScript compiler API is very low-level, providing detailed information for each of the language syntax elements, so it is not an easy task to extract the kind of information we need directly from it.

After considering some alternatives, like [`tsquery`](https://github.com/phenomnomnominal/tsquery) and [`ts-simple-ast`](https://github.com/dsherret/ts-simple-ast), I went with [`ts-json-schema-generator`](https://github.com/vega/ts-json-schema-generator), a module used to generate JSON Schemas for object validation.

One of the steps it does is to process the TypeScript AST to extract the information needed to generate the JSON Schemas. Taking advantage of this, we can use it to gather the information we need.

There are some limitations in terms of what language constructs it currently supports. To work arround this, I created a custom version of the parser (`CustomTypeMetadataParser`) that adds the possibility of registering additional node parsers to handle the special cases.

When run with `make start`, this project generates an `api.swagger.json` file in the project root folder containing the output for a sample api specification.

The generated API specification file can be viewed at https://editor.swagger.io/


Running this sample:
---------------
To run this project, clone the repository and then execute:
```sh
$ yarn --pure-lockfile
$ make start
```


Main challenges:
----------------
- No response information available from the rest API types for each endpoint operation - OpenAPI spec needs at least one success response to be included.
- Handle AST for types/keywords not currently supported by `ts-json-schema-generator`:
	- `void`
	- `never`
	- `ReturnType<>`
	- `Omit<>`
	- Computed property names
- OpenAPI uses a syntax based on JSON Schema to describe operation payloads and responses, but there are some differences
- OpenAPI has no support for generic types (`A<B>`)
- OpenAPI 3.x supports more schema options than 2.x, so it is preferable to use that if possible
- `$ref` types cannot be used in OpenAPI for path/query parameters
- `$ref` type names need to be RFC3986 escaped

