import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private readonly handlers = new Map<string, { handle: DetachedRouteHandle; timestamp: number }>();
  private readonly REUSE_TTL_MS = 15 * 60 * 1000; // 15 Minutes TTL

  /**
   * Only detach and store the 'campaigns' route (Campaign List Screen)
   */
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.path === 'campaigns';
  }

  /**
   * Store the detached route handle and record the current timestamp
   */
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const path = route.routeConfig?.path;
    if (!path || path !== 'campaigns') return;

    this.evictExpired();

    if (handle) {
      // Ensure we limit active cache handles count to 1 (evict older ones if any other routes were detached)
      if (this.handlers.size >= 1 && !this.handlers.has(path)) {
        const oldestKey = this.handlers.keys().next().value;
        if (oldestKey) {
          this.handlers.delete(oldestKey);
        }
      }

      this.handlers.set(path, {
        handle,
        timestamp: Date.now()
      });
      console.log(`[RouteReuse] Stored detached route handle for path: ${path}`);
    } else {
      this.handlers.delete(path);
    }
  }

  /**
   * Allow attachment if we have a stored handle for this route and it's not expired
   */
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path;
    if (!path || path !== 'campaigns') return false;

    this.evictExpired();

    return this.handlers.has(path);
  }

  /**
   * Retrieve the stored route handle
   */
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const path = route.routeConfig?.path;
    if (!path || path !== 'campaigns') return null;

    this.evictExpired();

    const cached = this.handlers.get(path);
    if (!cached) return null;

    // Refresh the timestamp upon successful retrieval
    cached.timestamp = Date.now();
    console.log(`[RouteReuse] Retrieved stored route handle for path: ${path}`);
    return cached.handle;
  }

  /**
   * Reuses the route if configuration is exactly the same
   */
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  /**
   * Evict any stored handles that have been inactive for more than the TTL
   */
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.handlers.entries()) {
      if (now - cached.timestamp > this.REUSE_TTL_MS) {
        console.log(`[RouteReuse] Evicting expired detached route handle for path: ${key}`);
        this.handlers.delete(key);
      }
    }
  }
}
