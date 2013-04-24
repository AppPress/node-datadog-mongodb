# node-datadog-mongodb

MongoDB query performance monitoring with DataDog

## Usage

```javascript
var mongoDb = require("mongodb");
require("datadog-mongodb")(mongoDb);
```

Or with `Mongoose`

```javascript
var mongoose = require("mongoose");
require("datadog-mongodb")(mongoose.mongo);
```

Or reusing `node-dogstatsd` client

```javascript
var mongoDb = require("mongodb");
require("datadog-mongodb")(mongoDb, {dogstatsd: statsD});
```

## Options

All options are optional.

* `dogstatsd`: `node-dogstatsd` client. `default = new require("node-dogstatsd").StatsD()`

## License

View the [LICENSE](https://github.com/AppPress/node-datadog-mongodb/blob/master/LICENSE) file.

