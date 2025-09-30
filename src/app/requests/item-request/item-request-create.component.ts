// src/app/item-request/item-request-create.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormArray, Validators } from '@angular/forms';
import { ItemRequestService } from '@app/_services/item-request.service';
import { AlertService, AccountService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './item-request-create.component.html'
})
export class ItemRequestCreateComponent {
  form = this.fb.group({
    requesterRoomId: [null],
    items: this.fb.array([ this._createItem() ]),
    note: ['']
  });

  account: any;
  submitting = false;

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

  submit() {
    if (this.form.invalid) { this.alert.error('Please fix validation errors'); return; }

    const acccountId = this.account?.acccountId ?? this.account?.accountId ?? this.account?.id ?? null;
    if (!acccountId) { this.alert.error('Account id missing'); return; }

    // prepare payload
    const payload: any = {
      acccountId,
      requesterRoomId: this.form.value.requesterRoomId ?? null,
      items: (this.form.value.items || []).map((it: any) => ({
        itemType: it.itemType,
        itemId: it.itemId ? Number(it.itemId) : null,
        quantity: Number(it.quantity) || 0,
        note: it.note ?? null
      })),
      note: this.form.value.note ?? null
    };

    console.log('Create item request payload:', payload);
    this.submitting = true;
    this.ir.create(payload).pipe(first()).subscribe({
      next: () => { this.alert.success('Item request created'); this.router.navigate(['/req-item']); },
      error: e => { this.alert.error(e?.error?.message ?? e?.message ?? 'Server error'); this.submitting = false; }
    });
  }
}
