import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransferService } from '@app/_services';
import { AlertService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-transfer-create',
  templateUrl: './transfer-create.component.html'
})
export class TransferCreateComponent implements OnInit {
  form!: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private transferService: TransferService,
    private alert: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      fromRoomId: [null, [Validators.required]],
      toRoomId:   [null, [Validators.required]],
      itemType:   ['apparel', [Validators.required]],
      itemId:     [null, [Validators.required]],
      quantity:   [1, [Validators.required, Validators.min(1)]],
      note:       ['']
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return this.alert.error('Please fill required fields');
    }

    const payload = this.form.value;
    this.submitting = true;
    this.transferService.create(payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Transfer created');
        this.submitting = false;
        this.router.navigate(['/transfers']);
      },
      error: err => { this.alert.error(err); this.submitting = false; }
    });
  }

  cancel() { this.router.navigate(['/transfers']); }
}
