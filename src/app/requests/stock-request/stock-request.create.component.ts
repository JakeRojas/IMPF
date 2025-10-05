import { Component  } from '@angular/core';
import { Router     } from '@angular/router';
import { first      } from 'rxjs/operators';
import { 
  FormBuilder, 
  FormGroup, 
  Validators 
} from '@angular/forms';

import { 
  AlertService, 
  AccountService, 
  StockRequestService 
} from '@app/_services';
// =========================================================================

@Component({ 
  templateUrl: './stock-request.create.component.html' 
})
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

  // Use the correct account property name and ensure it's present
  const accountId = this.account?.accountId ?? this.account?.id ?? null;
  if (!accountId) {
    this.alert.error('Unable to determine your account id. Re-login or check session.');
    return;
  }

  // coerce inputs
  const itemId = raw.itemId ? Number(raw.itemId) : null;
  const requesterRoomId = raw.requesterRoomId ? Number(raw.requesterRoomId) : null;

  // convert empty note to null (so Joi won't treat '' as invalid)
  const note = raw.note && String(raw.note).trim() !== '' ? String(raw.note).trim() : null;

  const payload: any = {
    accountId,          // <<--- FIXED: backend expects "accountId"
    requesterRoomId,
    itemId,
    itemType,
    quantity,
    note
  };

  console.log('Creating stock request payload:', payload);

  this.submitting = true;
  this.sr.create(payload).pipe(first()).subscribe({
    next: () => {
      this.alert.success('Request created', { keepAfterRouteChange: true });
      this.router.navigate(['/req-stock']);
    },
    error: err => {
      let msg = 'Server error';
      try { msg = err?.error?.message ?? err?.message ?? JSON.stringify(err?.error) ?? String(err); } catch (e) { msg = String(err); }
      console.error('Create stock request failed (full error):', err);
      this.alert.error(msg);
      this.submitting = false;
    }
  });
}
}