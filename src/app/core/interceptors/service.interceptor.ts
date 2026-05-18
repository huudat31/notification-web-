import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

export const serviceInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse && typeof event.body === 'string') {
        // Unescape HTML response logic
        const unescaped = event.body
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        return event.clone({ body: JSON.parse(unescaped) });
      }
      return event;
    })
  );
};
