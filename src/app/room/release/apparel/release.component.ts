import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService, AlertService } from '@app/_services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './release.component.html'
})
export class ApparelReleaseComponent implements OnInit {
  roomId = NaN;
  inventory: any[] = [];
  releaseForm!: FormGroup;
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private roomService: RoomService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.roomId = this.findRoomId(this.route);
    this.releaseForm = this.fb.group({
      apparelInventoryId: [null, Validators.required],
      releaseQuantity: [1, [Validators.required, Validators.min(1)]],
      claimedBy: ['', Validators.required],
      releasedBy: ['', Validators.required],
      remarks: ['']
    });

    this.loadInventory();
  }

  private findRoomId(route: ActivatedRoute): number {
    let r: ActivatedRoute | null = route;
    while (r) {
      const idParam = r.snapshot.paramMap.get('id');
      if (idParam) return +idParam;
      r = r.parent;
    }
    return NaN;
  }

  loadInventory() {
    this.roomService.getApparelInventory(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => this.inventory = res || [],
      error: (e) => this.alert.error(e)
    });
  }

  submit() {
    if (this.releaseForm.invalid) { this.alert.error('Please complete the form'); return; }
    this.submitting = true;
    const payload = this.releaseForm.value;

    this.roomService.releaseApparel(this.roomId, payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Released successfully');
        this.submitting = false;
        this.router.navigate(['../', '..', 'inventory', 'apparel'], { relativeTo: this.route });
      },
      error: (e) => { this.alert.error(e); this.submitting = false; }
    });
  }
}