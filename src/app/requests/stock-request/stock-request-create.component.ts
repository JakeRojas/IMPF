// // src/app/stock-request/stock-request-create.component.ts
// import { Component } from '@angular/core';
// import { Router } from '@angular/router';
// import { StockRequestService } from '@app/_services/stock-request.service';
// import { AlertService, AccountService } from '@app/_services';
// import { first } from 'rxjs/operators';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// @Component({ templateUrl: './stock-request-create.component.html' })
// export class StockRequestCreateComponent {
//   form: FormGroup;
//   submitting = false;
//   account: any;

//   constructor(
//     private fb: FormBuilder,
//     private sr: StockRequestService,
//     private alert: AlertService,
//     private router: Router,
//     private accountService: AccountService
//   ) {
//     this.account = this.accountService.accountValue;
//     this.form = this.fb.group({
//       requesterRoomId: [null],
//       itemType: ['apparel', Validators.required],
//       itemId: [null],
//       quantity: [1, [Validators.required, Validators.min(1)]],
//       note: ['']
//     });
//   }

//   submit() {
//     if (this.form.invalid) return;
//     this.submitting = true;
//     const payload = { ...this.form.value, acccountId: this.account?.accountId || this.account?.id || null };
//     this.sr.create(payload).pipe(first()).subscribe({
//       next: () => {
//         this.alert.success('Request created', { keepAfterRouteChange: true });
//         this.router.navigate(['/req-stock']);
//       },
//       error: e => { this.alert.error(e); this.submitting = false; }
//     });
//   }
// }



// src/app/stock-request/stock-request-create.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StockRequestService } from '@app/_services/stock-request.service';
import { AlertService, AccountService } from '@app/_services';
import { first } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({ templateUrl: './stock-request-create.component.html' })
export class StockRequestCreateComponent {
  form: FormGroup;
  submitting = false;
  account: any;

  // allowed backend item types (exact)
  private readonly VALID_ITEM_TYPES = ['apparel', 'supply', 'genItem'];

  constructor(
    private fb: FormBuilder,
    private sr: StockRequestService,
    private alert: AlertService,
    private router: Router,
    private accountService: AccountService
  ) {
    this.account = this.accountService.accountValue;
    this.form = this.fb.group({
      requesterRoomId: [null],
      itemType: ['apparel', Validators.required],
      itemId: [null],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: ['']
    });
  }

  private _errToString(err: any): string {
    if (!err && err !== 0) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.error?.message) return String(err.error.message);
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }

//  submit() {
//   if (this.form.invalid) {
//     this.alert.error('Please complete the required fields (item type and quantity).');
//     return;
//   }

//   const raw = this.form.value;
//   const itemType = String(raw.itemType || '').trim();
//   if (!this.VALID_ITEM_TYPES.includes(itemType)) {
//     this.alert.error(`Invalid item type. Allowed: ${this.VALID_ITEM_TYPES.join(', ')}`);
//     return;
//   }

//   const quantity = Number(raw.quantity);
//   if (!Number.isInteger(quantity) || quantity <= 0) {
//     this.alert.error('Quantity must be a positive integer.');
//     return;
//   }

//   const acccountId = this.account?.acccountId ?? this.account?.accountId ?? this.account?.id ?? null;
//   if (!acccountId) {
//     this.alert.error('Unable to determine your account id. Re-login or check session.');
//     return;
//   }

//   // COERCE string inputs to numbers where appropriate
//   const itemId = raw.itemId ? Number(raw.itemId) : null;
//   const requesterRoomId = raw.requesterRoomId ? Number(raw.requesterRoomId) : null;

//   const payload: any = {
//     acccountId,
//     requesterRoomId,
//     itemId,
//     itemType,
//     quantity,
//     note: raw.note ?? null
//   };

//   console.log('Creating stock request payload:', payload);

//   this.submitting = true;
//   this.sr.create(payload).pipe(first()).subscribe({
//     next: () => {
//       this.alert.success('Request created', { keepAfterRouteChange: true });
//       this.router.navigate(['/req-stock']);
//     },
//     error: err => {
//       // Show the server-sent message if present, otherwise fallback
//       let msg = 'Server error';
//       try {
//         // err may be HttpErrorResponse
//         msg = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error) ?? String(err);
//       } catch (e) { msg = String(err); }
//       console.error('Create stock request failed (full error):', err);
//       this.alert.error(msg);
//       this.submitting = false;
//     }
//   });
// }

submit() {
  if (this.form.invalid) {
    this.alert.error('Please complete the required fields (item type and quantity).');
    return;
  }

  const raw = this.form.value;
  const itemType = String(raw.itemType || '').trim();
  if (!this.VALID_ITEM_TYPES.includes(itemType)) {
    this.alert.error(`Invalid item type. Allowed: ${this.VALID_ITEM_TYPES.join(', ')}`);
    return;
  }

  const quantity = Number(raw.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    this.alert.error('Quantity must be a positive integer.');
    return;
  }

  const acccountId = this.account?.acccountId ?? this.account?.accountId ?? this.account?.id ?? null;
  if (!acccountId) {
    this.alert.error('Unable to determine your account id. Re-login or check session.');
    return;
  }

  // COERCE string inputs to numbers where appropriate
  const itemId = raw.itemId ? Number(raw.itemId) : null;
  const requesterRoomId = raw.requesterRoomId ? Number(raw.requesterRoomId) : null;

  const payload: any = {
    acccountId,
    requesterRoomId,
    itemId,
    itemType,
    quantity,
    note: raw.note ?? null
  };

  console.log('Creating stock request payload:', payload);

  this.submitting = true;
  this.sr.create(payload).pipe(first()).subscribe({
    next: () => {
      this.alert.success('Request created', { keepAfterRouteChange: true });
      this.router.navigate(['/req-stock']);
    },
    error: err => {
      // Show the server-sent message if present, otherwise fallback
      let msg = 'Server error';
      try {
        // err may be HttpErrorResponse
        msg = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error) ?? String(err);
      } catch (e) { msg = String(err); }
      console.error('Create stock request failed (full error):', err);
      this.alert.error(msg);
      this.submitting = false;
    }
  });
}
}
