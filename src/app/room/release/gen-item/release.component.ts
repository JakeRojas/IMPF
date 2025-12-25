import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RoomService, AlertService } from '@app/_services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './release.component.html'
})
export class GenItemReleaseComponent implements OnInit {
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
      genItemInventoryId: [null, Validators.required],
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
    this.roomService.getGenItemInventory(this.roomId).pipe(first()).subscribe({
      next: (res: any[]) => this.inventory = res || [],
      error: (e) => this.alert.error(e)
    });
  }

  // submit() {
  //   if (this.releaseForm.invalid) { this.alert.error('Please complete the form'); return; }
  //   this.submitting = true;
  //   const payload = this.releaseForm.value;

  //   this.roomService.releaseGenItem(this.roomId, payload).pipe(first()).subscribe({
  //     next: () => {
  //       this.alert.success('Released successfully');
  //       this.submitting = false;
  //       this.router.navigate(['../', '..', 'inventory', 'general'], { relativeTo: this.route });
  //     },
  //     error: (e) => { this.alert.error(e); this.submitting = false; }
  //   });
  // }
  submit() {
    if (this.releaseForm.invalid) { this.alert.error('Please complete the form'); return; }
    this.submitting = true;
  
    // copy the form value so we can safely modify
    const payload: any = { ...this.releaseForm.value };
  
    // numeric coercions (backend expects numbers)
    if (payload.releaseQuantity != null) payload.releaseQuantity = Number(payload.releaseQuantity);
    if (payload.genItemInventoryId != null) payload.genItemInventoryId = Number(payload.genItemInventoryId);
  
    // map remarks -> notes (backend uses notes)
    if (payload.remarks && !payload.notes) payload.notes = payload.remarks;
  
    // --- IMPORTANT: attach the genItemType from the selected inventory row ---
    const selectedInv = this.inventory.find(it => (it.genItemInventoryId ?? it.id) === payload.genItemInventoryId);
    if (selectedInv && selectedInv.genItemType) {
      payload.genItemType = selectedInv.genItemType;
    } else {
      // defensive: if inventory didn't provide a type, set a sensible default (optional)
      // payload.genItemType = payload.genItemType || 'other';
      // Or simply allow backend validation to reject if type is required.
    }
  
    this.roomService.releaseGenItem(this.roomId, payload).pipe(first()).subscribe({
      next: () => {
        this.alert.success('Released successfully');
        this.submitting = false;
        this.router.navigate(['./', '.', 'inventory', 'general'], { relativeTo: this.route });
      },
      error: (e) => { this.alert.error(e); this.submitting = false; }
    });
  }
}