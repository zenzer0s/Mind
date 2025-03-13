const Queue = require('bull');

const queue = new Queue('my-queue', {
    redis: {
        host: 'localhost',
        port: 6379
    }
});

// Process jobs in the queue
queue.process(async (job) => {
    // Job processing logic here
    console.log(`Processing job ${job.id} with data:`, job.data);
});

// Add a job to the queue
const addJob = async (data) => {
    const job = await queue.add(data);
    console.log(`Added job ${job.id} to the queue`);
};

// Export the queue and addJob function
module.exports = {
    queue,
    addJob
};