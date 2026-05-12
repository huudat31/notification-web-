import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-campaign',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="campaign-page">
  <!-- Page Header -->
  <div class="campaign-page__header">
    <button class="back-btn" (click)="goBack()">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <h1 class="campaign-page__title">Tạo Chiến Dịch Thông Báo</h1>
  </div>

  <div class="campaign-layout">
    <!-- Left: Form -->
    <div class="campaign-form-col">
      <form [formGroup]="campaignForm" (ngSubmit)="onSubmit()" class="campaign-card">
        <!-- Section 1 -->
        <div class="campaign-card__section">
          <div class="section-label">
            <div class="section-label__bar"></div>
            <span>1. Cấu hình thời gian &amp; đối tượng</span>
          </div>
          <div class="form-field">
            <label class="form-label">Tên chiến dịch <span class="required">*</span></label>
            <input class="form-input" type="text" formControlName="name" placeholder="Ví dụ: Khuyến mãi Hè 2026 - Flash Sale" [class.form-input--error]="isInvalid('name')" />
            <span *ngIf="isInvalid('name')" class="form-error">Vui lòng nhập tên chiến dịch</span>
          </div>
          <div class="form-grid-2">
            <div class="form-field">
              <label class="form-label">Thời gian bắt đầu <span class="required">*</span></label>
              <div class="input-icon-wrap">
                <input class="form-input" type="text" formControlName="startTime" placeholder="mm/dd/yyyy --:-- --" />
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Thời gian kết thúc <span class="form-optional">(Tùy chọn)</span></label>
              <div class="input-icon-wrap">
                <input class="form-input" type="text" formControlName="endTime" placeholder="mm/dd/yyyy --:-- --" />
                <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              </div>
              <p class="form-hint">Tự động ngừng gửi sau mốc thời gian này.</p>
            </div>
          </div>
          <div class="form-grid-3">
            <div class="form-field">
              <label class="form-label">Đối tượng <span class="required">*</span></label>
              <div class="select-wrap">
                <select class="form-select" formControlName="audience">
                  <option>Chỉ User Active</option>
                  <option>Tất cả User</option>
                  <option>Nhóm cụ thể</option>
                </select>
                <svg class="select-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Kênh gửi <span class="required">*</span></label>
              <div class="select-wrap">
                <select class="form-select" formControlName="channel">
                  <option>Gửi cả Email &amp; Push</option>
                  <option>Chỉ Email</option>
                  <option>Chỉ Push</option>
                </select>
                <svg class="select-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Tốc độ (Tin/Giờ) <span class="required">*</span></label>
              <input class="form-input" type="number" formControlName="speed" placeholder="1000" />
            </div>
          </div>
        </div>

        <!-- Section 2 -->
        <div class="campaign-card__section campaign-card__section--no-border">
          <div class="section-label">
            <div class="section-label__bar"></div>
            <span>2. Nội dung thông báo</span>
          </div>
          <div class="form-field">
            <label class="form-label">Template Name <span class="form-optional">(Nếu có)</span></label>
            <input class="form-input" type="text" formControlName="template" placeholder="Tìm kiếm template hoặc bỏ trống để soạn tin mới" />
          </div>
          <div class="form-field">
            <label class="form-label">Tiêu đề thông báo</label>
            <input class="form-input" type="text" formControlName="notifTitle" placeholder="Ví dụ: Ưu đãi 50% cho riêng bạn!" />
          </div>
          <div class="form-field">
            <div class="form-label-row">
              <label class="form-label">Nội dung tin nhắn</label>
              <span class="form-tag">Hỗ trợ Markdown</span>
            </div>
            <textarea class="form-textarea" formControlName="body" placeholder="Nhập nội dung chi tiết của thông báo..."></textarea>
          </div>
          <div class="form-field">
            <label class="form-label">Action URL</label>
            <div class="input-icon-wrap input-icon-wrap--left">
              <svg class="input-icon-left" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <input class="form-input form-input--pl" type="url" formControlName="actionUrl" placeholder="https://example.com/promotion" />
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="campaign-card__footer">
          <button type="button" class="btn-ghost" (click)="goBack()">Huỷ</button>
          <button type="submit" class="btn-submit" [disabled]="isSubmitting">
            <span *ngIf="!isSubmitting">Xác nhận tạo chiến dịch</span>
            <span *ngIf="isSubmitting" class="spinner"></span>
          </button>
        </div>
      </form>
    </div>

    <!-- Right: Preview + Reach -->
    <div class="campaign-sidebar-col">
      <!-- Preview Card -->
      <div class="preview-card">
        <div class="preview-tabs">
          <button class="preview-tab" [class.preview-tab--active]="previewTab === 'push'" (click)="previewTab = 'push'">Push Preview</button>
          <button class="preview-tab" [class.preview-tab--active]="previewTab === 'email'" (click)="previewTab = 'email'">Email Preview</button>
        </div>
        <div class="preview-screen">
          <!-- Push Notification Mockup -->
          <div class="phone-mock" *ngIf="previewTab === 'push'">
            <div class="phone-mock__bar">
              <span>9:41</span>
              <div class="phone-mock__icons">
                <div class="phone-icon-signal"></div>
                <div class="phone-icon-wifi"></div>
                <div class="phone-icon-battery"></div>
              </div>
            </div>
            <div class="phone-mock__wallpaper"></div>
            <div class="phone-mock__notif">
              <div class="phone-notif__header">
                <div class="phone-notif__app-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                </div>
                <span class="phone-notif__app">NotifyAdmin</span>
                <span class="phone-notif__time">Vừa xong</span>
              </div>
              <p class="phone-notif__title">{{ campaignForm.get('notifTitle')?.value || 'Tiêu đề thông báo' }}</p>
              <p class="phone-notif__body">{{ campaignForm.get('body')?.value || 'Nội dung thông báo sẽ hiển thị tại đây...' }}</p>
            </div>
            <div class="phone-mock__home-bar"></div>
          </div>

          <!-- Email Preview Mockup -->
          <div class="email-mock" *ngIf="previewTab === 'email'">
            <div class="email-mock__header">
              <div class="email-mock__from">
                <div class="email-avatar">N</div>
                <div class="email-meta">
                  <p class="email-sender">NotifyAdmin <span>&lt;no-reply&#64;notify.com&gt;</span></p>
                  <p class="email-to">Tới: <span>Người dùng của bạn</span></p>
                </div>
              </div>
              <div class="email-date">Hôm nay, 16:00</div>
            </div>
            <div class="email-mock__content">
              <h2 class="email-subject">{{ campaignForm.get('notifTitle')?.value || 'Tiêu đề email' }}</h2>
              <div class="email-body">
                {{ campaignForm.get('body')?.value || 'Nội dung email sẽ hiển thị tại đây...' }}
              </div>
              <div class="email-footer" *ngIf="campaignForm.get('actionUrl')?.value">
                <a [href]="campaignForm.get('actionUrl')?.value" target="_blank" class="email-btn">Xem chi tiết</a>
              </div>
            </div>
          </div>
        </div>
        <div class="preview-hint">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Xem trước có thể thay đổi tùy theo thiết bị người dùng.
        </div>
      </div>

      <!-- Reach Card -->
      <div class="reach-card">
        <div class="reach-card__icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#574eb1" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div>
          <h4 class="reach-card__label">Dự kiến tiếp cận</h4>
          <p class="reach-card__value">12,482 <span>người dùng</span></p>
          <div class="reach-card__trend">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            +12% so với tuần trước
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .campaign-page { padding: 32px; max-width: 1300px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
    .campaign-page__header { display: flex; align-items: center; gap: 16px; }
    .back-btn { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #574eb1; transition: background .15s; }
    .back-btn:hover { background: #e4dfff; }
    .campaign-page__title { font-size: 26px; font-weight: 800; color: #1c1b21; letter-spacing: -.5px; }
    .campaign-layout { display: grid; grid-template-columns: 1fr 480px; gap: 32px; align-items: start; }
    .campaign-card { background: #fff; border: 1px solid #c8c4d4; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(87,78,177,.04); }
    .campaign-card__section { padding: 28px; border-bottom: 1px solid rgba(200,196,212,.5); display: flex; flex-direction: column; gap: 18px; }
    .campaign-card__section--no-border { border-bottom: none; }
    .section-label { display: flex; align-items: center; gap: 10px; }
    .section-label__bar { width: 3px; height: 18px; background: #574eb1; border-radius: 2px; }
    .section-label span { font-size: 12px; font-weight: 800; color: #574eb1; text-transform: uppercase; letter-spacing: .08em; }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 13px; font-weight: 700; color: #1c1b21; }
    .form-optional { font-size: 12px; font-weight: 400; color: #787583; }
    .required { color: #ba1a1a; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: rgba(246,242,251,.3); padding: 14px; border-radius: 12px; border: 1px solid rgba(200,196,212,.3); }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
    .form-input { padding: 10px 14px; border: 1px solid #c8c4d4; border-radius: 8px; font-size: 13px; color: #1c1b21; outline: none; transition: border-color .2s, box-shadow .2s; font-family: inherit; width: 100%; }
    .form-input::placeholder { color: rgba(71,69,82,.4); }
    .form-input:focus { border-color: #574eb1; box-shadow: 0 0 0 3px rgba(87,78,177,.08); }
    .form-input--error { border-color: #ba1a1a !important; }
    .form-input--pl { padding-left: 38px; }
    .form-error { font-size: 12px; color: #ba1a1a; }
    .form-hint { font-size: 11px; color: #787583; font-style: italic; }
    .form-label-row { display: flex; align-items: center; justify-content: space-between; }
    .form-tag { font-size: 11px; font-weight: 600; color: #787583; }
    .form-textarea { padding: 10px 14px; border: 1px solid #c8c4d4; border-radius: 8px; font-size: 13px; color: #1c1b21; outline: none; transition: border-color .2s; font-family: inherit; width: 100%; resize: none; height: 110px; }
    .form-textarea:focus { border-color: #574eb1; box-shadow: 0 0 0 3px rgba(87,78,177,.08); }
    .form-textarea::placeholder { color: rgba(71,69,82,.4); }
    .input-icon-wrap { position: relative; }
    .input-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #787583; pointer-events: none; }
    .input-icon-left { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #787583; pointer-events: none; }
    .select-wrap { position: relative; }
    .form-select { width: 100%; padding: 10px 34px 10px 14px; border: 1px solid #c8c4d4; border-radius: 8px; font-size: 13px; color: #1c1b21; outline: none; appearance: none; background: #fff; transition: border-color .2s; font-family: inherit; cursor: pointer; }
    .form-select:focus { border-color: #574eb1; box-shadow: 0 0 0 3px rgba(87,78,177,.08); }
    .select-chevron { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #787583; pointer-events: none; }
    .campaign-card__footer { padding: 20px 28px; background: #f6f2fb; border-top: 1px solid rgba(200,196,212,.5); display: flex; justify-content: flex-end; gap: 12px; }
    .btn-ghost { padding: 10px 20px; border: 1px solid #c8c4d4; border-radius: 8px; font-size: 14px; font-weight: 600; color: #474552; transition: background .15s; }
    .btn-ghost:hover { background: #e5e1ea; }
    .btn-submit { padding: 12px 28px; background: #574eb1; color: #fff; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(87,78,177,.25); transition: background .15s, transform .1s; }
    .btn-submit:hover { background: #4139a0; }
    .btn-submit:active { transform: scale(.98); }
    .btn-submit:disabled { opacity: .7; cursor: not-allowed; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    /* Preview */
    .campaign-sidebar-col { display: flex; flex-direction: column; gap: 20px; position: sticky; top: 20px; }
    .preview-card { background: #fff; border: 1px solid #c8c4d4; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(87,78,177,.06); }
    .preview-tabs { display: flex; border-bottom: 1px solid #c8c4d4; background: rgba(246,242,251,.8); padding: 4px; gap: 4px; }
    .preview-tab { flex: 1; padding: 10px; font-size: 13px; font-weight: 700; color: #787583; border-radius: 12px; transition: all .2s; border: none; cursor: pointer; }
    .preview-tab--active { color: #574eb1; background: #fff; box-shadow: 0 2px 8px rgba(87,78,177,0.1); }
    .preview-screen { padding: 40px 24px; background: #f0edf5; display: flex; justify-content: center; min-height: 660px; align-items: center; position: relative; overflow: hidden; }
    .preview-screen::before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(#d1cbe0 1px, transparent 1px); background-size: 20px 20px; opacity: 0.4; }
    
    .phone-mock { width: 310px; height: 580px; background: #000; border-radius: 44px; border: 10px solid #1c1b21; box-shadow: 0 30px 60px rgba(0,0,0,.25); overflow: hidden; position: relative; display: flex; flex-direction: column; z-index: 1; }
    .phone-mock__bar { height: 32px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 2; position: relative; margin-top: 8px; }
    .phone-mock__bar span { font-size: 11px; color: #fff; font-weight: 700; }
    .phone-mock__icons { display: flex; gap: 5px; align-items: center; }
    .phone-icon-signal { width: 14px; height: 10px; background: currentColor; color: #fff; clip-path: polygon(0 100%, 25% 100%, 25% 70%, 35% 70%, 35% 100%, 60% 100%, 60% 40%, 70% 40%, 70% 100%, 95% 100%, 95% 10%, 100% 10%, 100% 100%); }
    .phone-icon-wifi { width: 14px; height: 10px; background: radial-gradient(circle at 50% 100%, transparent 20%, #fff 21%, #fff 40%, transparent 41%) center bottom/100% 60% no-repeat; }
    .phone-icon-battery { width: 18px; height: 9px; border: 1px solid rgba(255,255,255,0.5); border-radius: 2px; position: relative; }
    .phone-icon-battery::after { content: ''; position: absolute; left: 1px; top: 1px; bottom: 1px; width: 12px; background: #fff; border-radius: 1px; }

    .phone-mock__wallpaper { position: absolute; inset: 0; background: linear-gradient(160deg, #1a1a3e 0%, #4a3f8f 50%, #7b6cc7 100%); }
    .phone-mock__notif { position: relative; z-index: 1; margin: 20px 12px 0; background: rgba(255,255,255,.85); backdrop-filter: blur(20px); border-radius: 20px; padding: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.2); }
    .phone-notif__header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .phone-notif__app-icon { width: 20px; height: 20px; background: #574eb1; border-radius: 5px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .phone-notif__app { font-size: 11px; font-weight: 800; color: #1c1b21; text-transform: uppercase; letter-spacing: .05em; flex: 1; }
    .phone-notif__time { font-size: 10px; color: #575c72; font-weight: 500; }
    .phone-notif__title { font-size: 14px; font-weight: 800; color: #1c1b21; line-height: 1.2; margin-bottom: 4px; }
    .phone-notif__body { font-size: 13px; color: #474552; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .phone-mock__home-bar { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 100px; height: 4px; background: rgba(255,255,255,.3); border-radius: 2px; }

    /* Email Mockup */
    .email-mock { width: 100%; background: #fff; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-direction: column; animation: slideUp 0.3s ease-out; z-index: 1; }
    @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .email-mock__header { padding: 20px; border-bottom: 1px solid #f0edf5; display: flex; justify-content: space-between; align-items: flex-start; }
    .email-mock__from { display: flex; gap: 12px; }
    .email-avatar { width: 40px; height: 40px; background: #e4dfff; color: #574eb1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; }
    .email-sender { font-size: 14px; font-weight: 700; color: #1c1b21; margin-bottom: 2px; }
    .email-sender span { font-weight: 400; color: #787583; font-size: 13px; }
    .email-to { font-size: 13px; color: #787583; }
    .email-to span { color: #1c1b21; }
    .email-date { font-size: 12px; color: #787583; }
    .email-mock__content { padding: 24px; }
    .email-subject { font-size: 20px; font-weight: 800; color: #1c1b21; margin-bottom: 20px; line-height: 1.3; }
    .email-body { font-size: 15px; color: #474552; line-height: 1.6; white-space: pre-wrap; margin-bottom: 30px; }
    .email-footer { padding-top: 20px; border-top: 1px solid #f0edf5; text-align: center; }
    .email-btn { display: inline-block; padding: 12px 32px; background: #574eb1; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }

    .preview-hint { display: flex; align-items: center; gap: 8px; padding: 14px 20px; background: #f6f2fb; border-top: 1px solid #c8c4d4; font-size: 12px; color: #787583; font-style: italic; }
    
    /* Reach */
    .reach-card { background: #d5e3fc; border: 1px solid #c8c4d4; border-radius: 20px; padding: 24px; display: flex; gap: 20px; align-items: center; }
    .reach-card__icon-wrap { width: 52px; height: 52px; background: #fff; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,.08); flex-shrink: 0; }
    .reach-card__label { font-size: 14px; font-weight: 700; color: #0d1c2e; margin-bottom: 2px; }
    .reach-card__value { font-size: 28px; font-weight: 800; color: #0d1c2e; margin: 0; }
    .reach-card__value span { font-size: 14px; font-weight: 400; opacity: 0.6; }
    .reach-card__trend { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: #065f46; margin-top: 4px; }
  `]
})
export class CreateCampaignComponent {
  previewTab: 'push' | 'email' = 'push';
  isSubmitting = false;
  campaignForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {
    this.campaignForm = this.fb.group({
      name: ['', Validators.required],
      startTime: [''],
      endTime: [''],
      audience: ['Chỉ User Active'],
      channel: ['Gửi cả Email & Push'],
      speed: [1000],
      template: [''],
      notifTitle: [''],
      body: [''],
      actionUrl: ['']
    });
  }

  isInvalid(f: string): boolean {
    const c = this.campaignForm.get(f);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  goBack(): void { this.router.navigate(['/dashboard']); }

  onSubmit(): void {
    if (this.campaignForm.invalid) { this.campaignForm.markAllAsTouched(); return; }
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      this.router.navigate(['/notifications']);
    }, 1500);
  }
}
