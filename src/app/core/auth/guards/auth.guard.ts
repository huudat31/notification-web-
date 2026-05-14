import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from '../store/auth.store';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authStore = inject(AuthStore);

  // Chỉ cần kiểm tra state trong AuthStore
  // Vì Silent Refresh đã chạy xong trước khi Router hoạt động
  if (authStore.isAuthenticated()) {
    return true;
  }

  // Nếu chưa đăng nhập, chuyển hướng về trang login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
