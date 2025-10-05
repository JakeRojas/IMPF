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
      //requesterRoomId: [null],
      itemType: ['apparel', Validators.required],
      itemId: [null],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: ['']
    });
  }

  // Form helpers
  get items() { return this.form.get('items') as FormArray; }
  addItem() { this.items.push(this._createItem()); }
  removeItem(i: number) { if (this.items.length > 1) this.items.removeAt(i); }

  // Helper to normalize error -> string
  private _errToString(err: any) {
    if (!err && err !== 0) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err?.error?.message) return String(err.error.message);
    if (err?.message) return String(err.message);
    try { return JSON.stringify(err); } catch { return String(err); }
  }

  submit() {
    // basic validation
    if (this.form.invalid) {
      this.alert.error('Please fix validation errors');
      return;
    }

    // NOTE: backend /req-item expects single-item payloads like:
    // { requesterRoomId, itemType, itemId, quantity, note }
    // (Your server-side validation currently does NOT accept an `items` array.)
    // See backend controller create schema for /req-item. :contentReference[oaicite:2]{index=2}

    const raw = this.form.value;
    const requesterRoomId = raw.requesterRoomId ? Number(raw.requesterRoomId) : null;

    // Build one payload per requested item (so we keep multi-item UI but send per-backend single-item requests)
    const payloads = (raw.items || []).map((it: any) => ({
      requesterRoomId,
      itemType: String(it.itemType || '').trim(),
      itemId: it.itemId ? Number(it.itemId) : null,
      quantity: Number(it.quantity) || 0,
      note: it.note && String(it.note).trim() !== '' ? String(it.note).trim() : null
    }));

    // simple sanity checks
    if (payloads.some(p => !p.itemType || !Number.isFinite(p.quantity) || p.quantity <= 0)) {
      this.alert.error('Each item must have a valid type and a positive integer quantity.');
      return;
    }

    this.submitting = true;

    // If there is only one item, keep it simple; otherwise send multiple and wait for all
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