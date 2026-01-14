# inrush

A utility to run asynchronous processes with controlled concurrency and dynamic
adjustment based on average execution speed.

## Installation

```shell
npm install inrush
```

## Usage

```javascript
import Rush from 'inrush';

const rush = Rush({
    maxProcess: 5, // maximum concurrent processes allowed 
    slowestDuration: 3000, // in milliseconds
});

const tasks = [
    () => fetch('https://api.example.org/data1'),
    () => fetch('https://api.example.org/data2'),
    () => fetch('https://api.example.org/data3'),
    // more tasks...
]

rush.run( // can be awaited to wait for all tasks to complete
    tasks,
    (i, result) => {
        console.log(`Task ${i} completed with result:`, result);
    },
    (avg, processed, total) => {
        console.log(`Average duration: ${avg}ms, Processed: ${processed}/${total}`);
    }
)
```

# License
Licensed under the [MIT](./LICENSE).
