/**
 * RequestOrchestrator
 * Handles high-concurrency request logic, collapsing duplicate requests,
 * and managing exponential backoff for a resilient frontend under heavy load.
 */

type RequestIdentifier = string;

class RequestOrchestrator {
  private activeRequests: Map<RequestIdentifier, Promise<unknown>> = new Map();
  private maxRetries = 3;

  /**
   * Collapses multiple identical requests into one if they are fired simultaneously.
   * This prevents "Request Storms" when 1000s of users trigger the same load logic.
   */
  async collapse<T>(id: RequestIdentifier, requestFn: () => Promise<T>): Promise<T> {
    if (this.activeRequests.has(id)) {
      if (import.meta.env.DEV) {
        console.debug(`[Scaling] Collapsing duplicate request: ${id}`);
      }
      return this.activeRequests.get(id) as Promise<T>;
    }

    const requestPromise = this.retry(requestFn);
    this.activeRequests.set(id, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.activeRequests.delete(id);
    }
  }

  /**
   * Resilient retry logic with jittered exponential backoff.
   */
  private async retry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= this.maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      if (import.meta.env.DEV) {
        console.warn(`[Scaling] Request failed. Retrying in ${delay.toFixed(0)}ms... (Attempt ${attempt + 1})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retry(fn, attempt + 1);
    }
  }
}

export const requestOrchestrator = new RequestOrchestrator();
