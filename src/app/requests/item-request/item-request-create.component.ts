import { 
  FormBuilder, 
  FormArray, 
  Validators 
} from '@angular/forms';
import { Component  } from '@angular/core';
import { Router     } from '@angular/router';
import { first      } from 'rxjs/operators';
import { forkJoin   } from 'rxjs';

import { 
  AlertService, 
  AccountService, 
  ItemRequestService 
} from '@app/_services';
// ===================================================

@Component({
  templateUrl: './item-request-create.component.html'
})
export class ItemRequestCreateComponent {
  form = this.fb.group({
    requesterRoomId: [null],
    items: this.fb.array([ this._createItem() ]),
    note: ['']
  });

  submitting = false;
  account: any;

  constructor(
    private fb: FormBuilder,
    private ir: ItemRequestService,
    private alert: AlertService,
    private router: Router,
    private accountService: AccountService
  ) {
    this.account = this.accountService.accountValue;
  }

  private _createItem() {
    return this.fb.group({
      itemType: ['apparel', Validators.required],
      itemId: [null],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: ['']
    });
  }

  get items() { return this.form.get('items') as FormArray; }
  addItem() { this.items.push(this._createItem()); }
  removeItem(i: number) { if (this.items.length > 1) this.items.removeAt(i); }

  private _errToString(err: any) {
    if (!err && err !== 0) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.error?.message) return String(err.error.message);
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }

  submit() {
    if (this.form.invalid) {
      this.alert.error('Please fix validation errors');
      return;
    }

    const raw = this.form.value;
    const requesterRoomId = raw.requesterRoomId ? Number(raw.requesterRoomId) : null;

    const payloads = (raw.items || []).map((it: any) => ({
      requesterRoomId,
      itemType: String(it.itemType || '').trim(),
      itemId: it.itemId ? Number(it.itemId) : null,
      quantity: Number(it.quantity) || 0,
      note: it.note && String(it.note).trim() !== '' ? String(it.note).trim() : null
    }));

    if (payloads.some(p => !p.itemType || !Number.isFinite(p.quantity) || p.quantity <= 0)) {
      this.alert.error('Each item must have a valid type and a positive integer quantity.');
      return;
    }

    this.submitting = true;

    const calls = payloads.map(p => this.ir.create(p));

    forkJoin(calls).pipe(first()).subscribe({
      next: () => {
        this.alert.success(payloads.length > 1 ? 'Item requests created' : 'Item request created', { keepAfterRouteChange: true });
        this.router.navigate(['/req-item']);
      },
      error: e => {
        this.alert.error(this._errToString(e));
        console.error('Create item request error (full):', e);
        this.submitting = false;
      }
    });
  }
}