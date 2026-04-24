type Job = () => Promise<void>;

class DeploymentQueue {
  private queue: Job[] = [];
  private processing = false;

  async add(job: Job) {
    this.queue.push(job);
    this.process();
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const job = this.queue.shift(); // remove the current job and return it

    if (job) {
      try {
        await job(); // process the job
      } catch (error) {
        console.error("Queue job failed:", error);
      }
    }

    this.processing = false;
    this.process(); // recursive call to process next job
  }

  get queueSize() {
    return this.queue.length; // return the number of jobs in the queue
  }

  get isIdle() {
    return !this.processing && this.queue.length === 0; // return return if the queue is idle, i.e: the queue length is 0 and processing is false
  }
}

export const deploymentQueue = new DeploymentQueue();
