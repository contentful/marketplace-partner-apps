import PQueue from "p-queue";
/**
 * This is a simple promise based queue
 * that can be used to throttle incoming requests.
 */
export const queue = new PQueue({concurrency: 1});
