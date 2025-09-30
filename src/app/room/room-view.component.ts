// import { Component, OnInit }                  from '@angular/core';
// import { ActivatedRoute }                     from '@angular/router';
// import { first }                              from 'rxjs/operators';
// import { HttpResponse }                       from '@angular/common/http';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// import {
//   AccountService,
//   RoomService,
//   QrService,
//   AlertService,
// } from '@app/_services';

// type InventoryItem = {
//   apparelInventoryId?: number;
//   adminSupplyInventoryId?: number;
//   genItemInventoryId?: number;
//   id?: number;
//   totalQuantity?: number;
//   quantity?: number;
//   supplyQuantity?: number;
//   status?: string;
//   [key: string]: any;
// };

// @Component({
//   templateUrl: './room-view.component.html'
// })
// export class RoomViewComponent implements OnInit {
//   currentAccount: any = null;
//   roomId!:          number;
//   room:             any = {};
//   inventory:        any[] = [];
//   receivedItems:    any[] = [];
//   releasedBatches:  any[] = [];
//   roomItems:        any[] = [];
//   inChargeOptions:  any[] = [];

//   levelOptions = ['pre','elem','7','8','9','10','sh','it','hs','educ','teachers'];
//   typeOptions  = ['uniform','pe'];
//   forOptions   = ['girls','boys'];
//   sizeOptions  = [
//     '2','4','6','8','10','12','14','16','18','20',
//     'xs','s','m','l','xl','2xl','3xl'
//   ];

//   // --- added props for QR scanning panel ---
//   scanned: any = null;
//   showScannedPanel = false;
//   account: any = null; // set from account/auth service if available

//   scannedNewStatus: string = 'damage';

//   // modal visibility flags
//   showReceiveModal = false;
//   showReleaseModal = false;

//   // forms
//   receiveForm!:   FormGroup;
//   releaseForm!:   FormGroup;
//   registerForm!:  FormGroup;
//   statusForm!:    FormGroup;

//   loading     = false;
//   submitting  = false;

//   apparelInventoryList: InventoryItem[] = [];
//   adminSupplyInventoryList: InventoryItem[] = [];
//   genItemInventoryList: InventoryItem[] = [];

//   constructor(
//     private route:        ActivatedRoute,
//     private fb:           FormBuilder,
//     private accountService:  AccountService,
//     private roomService:  RoomService,
//     private qrService:    QrService,
//     private alert:        AlertService,
//   ) {}

//   // ngOnInit() {
//   //   this.roomId = +this.route.snapshot.params['id'];

//   //   // TODO: assign this.account from your auth/account service here if available
//   //   // this.account = this.authService.accountValue;

//   //   // Receive form (keeps fields for both apparel and supply; we submit what is filled)
//   //   this.receiveForm = this.fb.group({
//   //     // apparel fields
//   //     apparelName:      [''],
//   //     apparelQuantity:  [0],
//   //     apparelLevel:     [''],
//   //     apparelType:      [''],
//   //     apparelFor:       [''],
//   //     apparelSize:      [''],
//   //     // supply fields
//   //     supplyName:       [''],
//   //     adminQuantity:    [0],
//   //     // common
//   //     receivedFrom:     ['', Validators.required],
//   //     receivedBy:       ['', Validators.required],
//   //     notes:            ['']
//   //   });

//   //   // Release form (batch)
//   //   this.releaseForm = this.fb.group({
//   //     apparelInventoryId: [null,  Validators.required],
//   //     releaseQuantity:    [1,     [Validators.required, Validators.min(1)]],
//   //     releasedBy:         ['',    Validators.required],
//   //     claimedBy:          ['',    Validators.required],
//   //     remarks:            ['']
//   //   });

//   //   this.registerForm = this.fb.group({ itemId:     [null,  Validators.required] });
//   //   this.statusForm   = this.fb.group({ itemQrCode: ['',    Validators.required], newStatus: ['', Validators.required] });

//   //   this.loadAll();
//   // }
//   ngOnInit() {
//     this.roomId = +this.route.snapshot.params['id'];

//     // Build receive form with non-blocking defaults. We'll set validators once we know room type.
//     this.receiveForm = this.fb.group({
//       // apparel fields (no validators yet — applied dynamically after room load)
//       apparelName:      [''],
//       apparelQuantity:  [0],
//       apparelLevel:     [''],
//       apparelType:      [''],
//       apparelFor:       [''],
//       apparelSize:      [''],
//       // supply fields
//       supplyName:       [''],
//       adminQuantity:    [0],
//       // common
//       receivedFrom:     ['', Validators.required],
//       receivedBy:       ['', Validators.required],
//       notes:            ['']
//     });

//     // Release form (batch)
//     this.releaseForm = this.fb.group({
//       apparelInventoryId: [null,  Validators.required],
//       releaseQuantity:    [1,     [Validators.required, Validators.min(1)]],
//       releasedBy:         ['',    Validators.required],
//       claimedBy:          ['',    Validators.required],
//       remarks:            ['']
//     });

//     this.registerForm = this.fb.group({ itemId:     [null,  Validators.required] });
//     this.statusForm   = this.fb.group({ itemQrCode: ['',    Validators.required], newStatus: ['', Validators.required] });

//     this.loadAll();
//   }

//   // loadAll() {
//   //   this.loading = true;

//   //   // fetch the room first so we know stockroomType
//   //   this.roomService.getRoomById(this.roomId).pipe(first()).subscribe({
//   //     next: r => {
//   //       this.room = r || {};
//   //       const st = (this.room.stockroomType || 'apparel').toString().toLowerCase();

//   //       // reset data arrays
//   //       this.inventory = [];
//   //       this.receivedItems = [];
//   //       this.releasedBatches = [];
//   //       this.roomItems = [];

//   //       // in-charge options (used in receive/release forms)
//   //       this.roomService.getInChargeOptions().pipe(first()).subscribe({
//   //         next: opts => this.inChargeOptions = opts || [],
//   //         error: () => { /* non-fatal */ }
//   //       });

//   //       // ------------- APPAREL -------------
//   //       if (!st || st === 'apparel') {
//   //         this.roomService.getApparelInventory(this.roomId).pipe(first()).subscribe({
//   //           next: inv => this.inventory = inv || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //         this.roomService.getReceivedBatchApparels(this.roomId).pipe(first()).subscribe({
//   //           next: rcv => this.receivedItems = rcv?.items || rcv || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //         this.roomService.getReleasedBatchAppparel(this.roomId).pipe(first()).subscribe({
//   //           next: r => this.releasedBatches = r?.batches || r || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //         this.roomService.getApparelUnits(this.roomId).pipe(first()).subscribe({
//   //           next: items => this.roomItems = items || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //       // ------------- ADMIN SUPPLY -------------
//   //       } else if (st === 'supply') {
//   //         this.roomService.getAdminSupplyInventory(this.roomId).pipe(first()).subscribe({
//   //           next: inv => this.inventory = inv || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //         this.roomService.getReceivedBatchAdminSupply(this.roomId).pipe(first()).subscribe({
//   //           next: rcv => this.receivedItems = rcv?.items || rcv || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //         this.roomService.getAdminSupplyUnits(this.roomId).pipe(first()).subscribe({
//   //           next: items => this.roomItems = items || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //         this.roomService.getReleasedBatchAdminSupply(this.roomId).pipe(first()).subscribe({
//   //           next: r => this.releasedBatches = r?.batches || r || [],
//   //           error: () => {}
//   //         });
//   //       // ------------- GENERAL ITEMS -------------
//   //       } else {
//   //         this.roomService.getGenItemInventory(this.roomId).pipe(first()).subscribe({
//   //           next: inv => this.inventory = inv || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //         this.roomService.getReceivedBatchGenItem(this.roomId).pipe(first()).subscribe({
//   //           next: rcv => this.receivedItems = rcv?.items || rcv || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //         this.roomService.getGenItemUnits(this.roomId).pipe(first()).subscribe({
//   //           next: items => this.roomItems = items || [],
//   //           error: e => this.alert.error(e)
//   //         });
//   //         this.roomService.getReleasedBatchGenItem(this.roomId).pipe(first()).subscribe({
//   //           next: r => this.releasedBatches = r?.batches || r || [],
//   //           error: () => {}
//   //         });
//   //       }

//   //       this.loading = false;
//   //     },
//   //     error: e => { this.alert.error(e); this.loading = false; }
//   //   });
//   // }
//   loadAll() {
//     this.loading = true;

//     // fetch the room first so we know stockroomType
//     this.roomService.getRoomById(this.roomId).pipe(first()).subscribe({
//       next: r => {
//         this.room = r || {};
//         const st = (this.room.stockroomType || 'apparel' || 'supply').toString().toLowerCase();

//         // reset data arrays
//         this.inventory = [];
//         this.receivedItems = [];
//         this.releasedBatches = [];
//         this.roomItems = [];

//         // // in-charge options (used in receive/release forms)
//         // this.roomService.getInChargeOptions().pipe(first()).subscribe({
//         //   next: opts => {
//         //     this.inChargeOptions = opts || [];
//         //   },
//         //   error: () => { /* non-fatal */ }
//         // });
//         this.accountService.getAll().pipe(first()).subscribe({
//           next: (accounts: any[]) => {
//             // keep as-is but normalise a bit for template convenience
//             this.inChargeOptions = (accounts || []).map(a => ({
//               id: a.accountId ?? a.id ?? a.AccountId ?? a.id,
//               firstName: a.firstName,
//               lastName: a.lastName,
//               username: a.username,
//               raw: a
//             }));
//           },
//           error: err => {
//             // don't block the whole page if this fails — just show a toast
//             this.alert.error('Failed to load account options: ' + (err?.message || err));
//           }
//         });

//         // apply dynamic validators depending on stockroomType
//         this.applyReceiveValidators(st);

//         // ------------- APPAREL -------------
//         if (!st || st === 'apparel') {
//           this.roomService.getApparelInventory(this.roomId).pipe(first()).subscribe({
//             next: inv => this.inventory = inv || [],
//             error: e => this.alert.error(e)
//           });
//           this.roomService.getReceivedBatchApparels(this.roomId).pipe(first()).subscribe({
//             next: rcv => this.receivedItems = rcv?.items || rcv || [],
//             error: e => this.alert.error(e)
//           });
//           this.roomService.getReleasedBatchAppparel(this.roomId).pipe(first()).subscribe({
//             next: r => this.releasedBatches = r?.batches || r || [],
//             error: e => this.alert.error(e)
//           });
//           this.roomService.getApparelUnits(this.roomId).pipe(first()).subscribe({
//             next: items => this.roomItems = items || [],
//             error: e => this.alert.error(e)
//           });
//         // ------------- ADMIN SUPPLY -------------
//         } else if (st === 'supply') {
//           this.roomService.getAdminSupplyInventory(this.roomId).pipe(first()).subscribe({
//             next: inv => this.inventory = inv || [],
//             error: e => this.alert.error(e)
//           });
//           this.roomService.getReceivedBatchAdminSupply(this.roomId).pipe(first()).subscribe({
//             next: rcv => this.receivedItems = rcv?.items || rcv || [],
//             error: e => this.alert.error(e)
//           });
//           this.roomService.getReleasedBatchAdminSupply(this.roomId).pipe(first()).subscribe({
//             next: r => this.releasedBatches = r?.batches || r || [],
//             error: e => this.alert.error(e)
//           });
//           this.roomService.getAdminSupplyUnits(this.roomId).pipe(first()).subscribe({
//             next: items => this.roomItems = items || [],
//             error: e => this.alert.error(e)
//           });
//         } else {
//           // general / items
//           this.roomService.getGenItemInventory(this.roomId).pipe(first()).subscribe({
//             next: inv => this.inventory = inv || [],
//             error: e => this.alert.error(e)
//           });
//           // this.roomService.getReceiveGenItem(this.roomId).pipe(first()).subscribe({
//           //   next: rcv => this.receivedItems = rcv?.items || rcv || [],
//           //   error: e => this.alert.error(e)
//           // });
//           this.roomService.getGenItemUnits(this.roomId).pipe(first()).subscribe({
//             next: items => this.roomItems = items || [],
//             error: e => this.alert.error(e)
//           });
//         }

//         this.loading = false;
//       },
//       error: err => { this.alert.error(err); this.loading = false; }
//     });
//   }

//   applyReceiveValidators(stockroomType: string) {
//     const st = (stockroomType || '').toLowerCase();

//     // clear validators first
//     const apparelControls = ['apparelName','apparelQuantity','apparelLevel','apparelType','apparelFor','apparelSize'];
//     const supplyControls  = ['supplyName','adminQuantity'];

//     apparelControls.forEach(c => {
//       const ctrl = this.receiveForm.get(c);
//       if (!ctrl) return;
//       ctrl.clearValidators();
//       ctrl.updateValueAndValidity();
//     });

//     supplyControls.forEach(c => {
//       const ctrl = this.receiveForm.get(c);
//       if (!ctrl) return;
//       ctrl.clearValidators();
//       ctrl.updateValueAndValidity();
//     });

//     // set for apparel
//     if (!st || st === 'apparel') {
//       this.receiveForm.get('apparelName')?.setValidators([Validators.required]);
//       this.receiveForm.get('apparelLevel')?.setValidators([Validators.required]);
//       this.receiveForm.get('apparelType')?.setValidators([Validators.required]);
//       this.receiveForm.get('apparelFor')?.setValidators([Validators.required]);
//       this.receiveForm.get('apparelSize')?.setValidators([Validators.required]);
//       this.receiveForm.get('apparelQuantity')?.setValidators([Validators.required, Validators.min(1)]);
//     }

//     // set for supply
//     if (st === 'supply') {
//       this.receiveForm.get('supplyName')?.setValidators([Validators.required]);
//       this.receiveForm.get('adminQuantity')?.setValidators([Validators.required, Validators.min(1)]);
//     }

//     // receivedFrom / receivedBy should always be required
//     this.receiveForm.get('receivedFrom')?.setValidators([Validators.required]);
//     this.receiveForm.get('receivedBy')?.setValidators([Validators.required]);

//     // update validity
//     // [...apparelControls, ...supplyControls, 'receivedFrom', 'receivedBy'].forEach(k => {
//     //   this.receiveForm.get(k)?.updateValueAndValidity();
//     // });
//     const keys = [...apparelControls, ...supplyControls, 'receivedFrom', 'receivedBy'];
//     keys.forEach(k => {
//       this.receiveForm.get(k)?.updateValueAndValidity();
//     });
//   }

//   // ------------------------ Modal open/close helpers --------------------------
//   openReceiveModal() {
//     this.receiveForm.reset({
//       apparelName: '',
//       apparelQuantity: 0,
//       supplyName: '',
//       adminQuantity: 0,
//       receivedFrom: '',
//       receivedBy: '',
//       notes: ''
//     });
//     this.showReceiveModal = true;
//   }
//   closeReceiveModal() { this.showReceiveModal = false; }

//   openReleaseModal(prefillInventoryId?: number) {
//     this.releaseForm.reset({
//       apparelInventoryId: prefillInventoryId || null,
//       releaseQuantity: 1,
//       releasedBy: '',
//       claimedBy: '',
//       remarks: ''
//     });
//     this.showReleaseModal = true;
//   }
//   closeReleaseModal() { this.showReleaseModal = false; }

//   // ------------------------ Modal actions --------------------------------
//   // onReceive() {
//   //   if (this.receiveForm.invalid) {
//   //     this.alert.error('Please fill required receive fields.');
//   //     return;
//   //   }
//   //   this.submitting = true;
  
//   //   const st = (this.room.stockroomType || 'apparel').toString().toLowerCase();
//   //   let payload: any = {
//   //     receivedFrom: this.receiveForm.value.receivedFrom,
//   //     receivedBy: Number(this.receiveForm.value.receivedBy),
//   //     notes: this.receiveForm.value.notes
//   //   };
  
//   //   if (!st || st === 'apparel') {
//   //     payload = {
//   //       ...payload,
//   //       apparelName: this.receiveForm.value.apparelName,
//   //       apparelQuantity: Number(this.receiveForm.value.apparelQuantity),
//   //       apparelLevel: this.receiveForm.value.apparelLevel,
//   //       apparelType: this.receiveForm.value.apparelType,
//   //       apparelFor: this.receiveForm.value.apparelFor,
//   //       apparelSize: this.receiveForm.value.apparelSize
//   //     };
//   //   } else if (st === 'supply') {
//   //     payload = {
//   //       ...payload,
//   //       supplyName: this.receiveForm.value.supplyName,
//   //       supplyQuantity: Number(this.receiveForm.value.adminQuantity)
//   //     };
//   //   } else {
//   //     payload = {
//   //       ...payload,
//   //       itemName: this.receiveForm.value.supplyName || this.receiveForm.value.apparelName,
//   //       itemQuantity: Number(this.receiveForm.value.adminQuantity || this.receiveForm.value.apparelQuantity)
//   //     };
//   //   }
  
//   //   this.roomService.receiveItem(this.roomId, payload).pipe(first()).subscribe({
//   //     next: () => {
//   //       this.alert.success('Received successfully');
//   //       this.submitting = false;
//   //       this.closeReceiveModal();
//   //       this.loadAll();
//   //     },
//   //     error: e => { this.alert.error(e); this.submitting = false; }
//   //   });
//   // }
//   // onRelease() {
//   //   if (this.releaseForm.invalid) {
//   //     this.alert.error('Please fill required release fields.');
//   //     return;
//   //   }
//   //   this.submitting = true;
  
//   //   // build normalized payload expected by backend
//   //   const raw = this.releaseForm.value;
//   //   const payload: any = {
//   //     apparelInventoryId: Number(raw.apparelInventoryId),
//   //     releaseApparelQuantity: Number(raw.releaseQuantity ?? raw.releaseApparelQuantity ?? 0),
//   //     releasedBy: raw.releasedBy != null ? String(raw.releasedBy) : '',
//   //     claimedBy: raw.claimedBy ?? '',
//   //     notes: raw.remarks ?? raw.notes ?? null
//   //   };
  
//   //   // basic client-side validation
//   //   if (!Number.isFinite(payload.apparelInventoryId) || payload.apparelInventoryId <= 0) {
//   //     this.alert.error('Please provide a valid Inventory ID.');
//   //     this.submitting = false;
//   //     return;
//   //   }
//   //   if (!Number.isFinite(payload.releaseApparelQuantity) || payload.releaseApparelQuantity <= 0) {
//   //     this.alert.error('Please provide a valid release quantity.');
//   //     this.submitting = false;
//   //     return;
//   //   }
  
//   //   const inventoryId = payload.apparelInventoryId;
//   //   const qty = payload.releaseApparelQuantity;
  
//   //   // small helper that actually calls backend
//   //   const sendRelease = () => {
//   //     this.roomService.releaseApparel(this.roomId, payload).pipe(first()).subscribe({
//   //       next: () => {
//   //         this.alert.success('Released successfully');
//   //         this.submitting = false;
//   //         this.closeReleaseModal();
//   //         this.loadAll(); // refresh lists & statuses
//   //       },
//   //       error: e => {
//   //         const msg = e?.error?.message || e?.message || String(e);
//   //         this.alert.error(msg);
//   //         this.submitting = false;
//   //       }
//   //     });
//   //   };
  
//   //   // try to find the inventory in already-loaded list (if you keep it)
//   //   let inv = null;
//   //   if (this.apparelInventoryList && Array.isArray(this.apparelInventoryList)) {
//   //     inv = this.apparelInventoryList.find(i =>
//   //       (i.apparelInventoryId ?? i.id) === inventoryId
//   //     );
//   //   }
  
//   //   if (inv) {
//   //     const available = Number(inv.totalQuantity ?? inv.quantity ?? inv.supplyQuantity ?? 0);
//   //     if (available < qty) {
//   //       this.alert.error(`Not enough stock to release (${available} available).`);
//   //       this.submitting = false;
//   //       return;
//   //     }
//   //     // ok, proceed
//   //     sendRelease();
//   //   } else {
//   //     // inventory not loaded: fetch inventory list for this room and re-check
//   //     this.roomService.getApparelInventory(this.roomId).pipe(first()).subscribe({
//   //       next: list => {
//   //         this.apparelInventoryList = list || [];
//   //         inv = this.apparelInventoryList.find(i => (i.apparelInventoryId ?? i.id) === inventoryId);
//   //         const available = Number(inv?.totalQuantity ?? 0);
  
//   //         if (!inv) {
//   //           this.alert.error('Selected inventory not found. Please refresh and try again.');
//   //           this.submitting = false;
//   //           return;
//   //         }
  
//   //         if (available < qty) {
//   //           this.alert.error(`Not enough stock to release (${available} available).`);
//   //           this.submitting = false;
//   //           return;
//   //         }
//   //         // ok, proceed
//   //         sendRelease();
//   //       },
//   //       error: err => {
//   //         this.alert.error('Failed to fetch inventory for validation: ' + (err?.message || err));
//   //         this.submitting = false;
//   //       }
//   //     });
//   //   }
//   // }
// onReceive() {
//   if (this.receiveForm.invalid) {
//     this.alert.error('Please fill required receive fields.');
//     return;
//   }
//   this.submitting = true;

//   const st = (this.room.stockroomType || 'apparel').toString().toLowerCase();
//   let payload: any = {
//     receivedFrom: this.receiveForm.value.receivedFrom,
//     receivedBy: Number(this.receiveForm.value.receivedBy),
//     notes: this.receiveForm.value.notes
//   };

//   if (!st || st === 'apparel') {
//     payload = {
//       ...payload,
//       apparelName: this.receiveForm.value.apparelName,
//       apparelQuantity: Number(this.receiveForm.value.apparelQuantity),
//       apparelLevel: this.receiveForm.value.apparelLevel,
//       apparelType: this.receiveForm.value.apparelType,
//       apparelFor: this.receiveForm.value.apparelFor,
//       apparelSize: this.receiveForm.value.apparelSize
//     };
//   } else if (st === 'supply') {
//     payload = {
//       ...payload,
//       supplyName: this.receiveForm.value.supplyName,
//       // tolerate either adminQuantity or supplyQuantity
//       supplyQuantity: Number(this.receiveForm.value.adminQuantity ?? this.receiveForm.value.supplyQuantity ?? 0)
//     };
//   } else {
//     payload = {
//       ...payload,
//       itemName: this.receiveForm.value.supplyName ?? this.receiveForm.value.apparelName,
//       itemQuantity: Number(this.receiveForm.value.adminQuantity ?? this.receiveForm.value.apparelQuantity ?? 0)
//     };
//   }

//   this.roomService.receiveItem(this.roomId, payload).pipe(first()).subscribe({
//     next: () => {
//       this.alert.success('Received successfully');
//       this.submitting = false;
//       this.closeReceiveModal();
//       this.loadAll();
//     },
//     error: e => { this.alert.error(e); this.submitting = false; }
//   });
// }


// // -----------------------------------------
// // onRelease() (handles apparel, admin supply, general item)
// // -----------------------------------------
// onRelease() {
//   if (this.releaseForm.invalid) {
//     this.alert.error('Please fill required release fields.');
//     return;
//   }
//   this.submitting = true;

//   const raw = this.releaseForm.value;
//   const st = (this.room.stockroomType || 'apparel').toString().toLowerCase();

//   // helper to pick form fields that might exist in different naming conventions
//   const pickInventoryId = (candidates: (string | undefined)[]) => {
//     for (const key of candidates) {
//       if (!key) continue;
//       const v = raw[key];
//       if (v != null && v !== '') return Number(v);
//     }
//     return null;
//   };
//   const pickQuantity = (candidates: (string | undefined)[]) => {
//     for (const key of candidates) {
//       if (!key) continue;
//       const v = raw[key];
//       if (v != null && v !== '') return Number(v);
//     }
//     return 0;
//   };

//   // Build payload + determine which flow to use
//   let payload: any = {};
//   let inventoryId: number | null = null;
//   let qty: number = 0;
//   let flow: 'apparel' | 'supply' | 'gen';

//   if (!st || st === 'apparel') {
//     flow = 'apparel';
//     inventoryId = pickInventoryId(['apparelInventoryId', 'inventoryId', 'id']);
//     qty = pickQuantity(['releaseQuantity', 'releaseApparelQuantity', 'apparelQuantity', 'quantity']);
//     payload = {
//       apparelInventoryId: inventoryId,
//       releaseApparelQuantity: qty,
//       releasedBy: raw.releasedBy != null ? String(raw.releasedBy) : '',
//       claimedBy: raw.claimedBy ?? '',
//       notes: raw.remarks ?? raw.notes ?? null
//     };
//   } else if (st === 'supply') {
//     flow = 'supply';
//     inventoryId = pickInventoryId(['adminSupplyInventoryId', 'adminInventoryId', 'supplyInventoryId', 'inventoryId', 'id']);
//     qty = pickQuantity(['releaseQuantity', 'releaseAdminSupplyQuantity', 'adminQuantity', 'supplyQuantity', 'quantity']);
//     payload = {
//       adminSupplyInventoryId: inventoryId,
//       releaseAdminSupplyQuantity: qty,
//       releasedBy: raw.releasedBy != null ? String(raw.releasedBy) : '',
//       claimedBy: raw.claimedBy ?? '',
//       notes: raw.remarks ?? raw.notes ?? null
//     };
//   } else {
//     // general item
//     flow = 'gen';
//     inventoryId = pickInventoryId(['genItemInventoryId', 'genInventoryId', 'itemInventoryId', 'inventoryId', 'id']);
//     qty = pickQuantity(['releaseQuantity', 'releaseItemQuantity', 'itemQuantity', 'quantity']);
//     payload = {
//       genItemInventoryId: inventoryId,
//       releaseItemQuantity: qty,
//       releasedBy: raw.releasedBy != null ? String(raw.releasedBy) : '',
//       claimedBy: raw.claimedBy ?? '',
//       notes: raw.remarks ?? raw.notes ?? null,
//       genItemType: raw.genItemType ?? raw.itemType ?? null
//     };
//   }

//   // basic client-side validation
//   if (!Number.isFinite(inventoryId as number) || (inventoryId as number) <= 0) {
//     this.alert.error('Please provide a valid Inventory ID.');
//     this.submitting = false;
//     return;
//   }
//   if (!Number.isFinite(qty) || qty <= 0) {
//     this.alert.error('Please provide a valid release quantity.');
//     this.submitting = false;
//     return;
//   }

//   // small helper to call backend per flow
//   const callReleaseApi = () => {
//     if (flow === 'apparel') {
//       this.roomService.releaseApparel(this.roomId, payload).pipe(first()).subscribe(apiObserver);
//     } else if (flow === 'supply') {
//       // assumes you have this method in roomService
//       this.roomService.releaseAdminSupply(this.roomId, payload).pipe(first()).subscribe(apiObserver);
//     } else {
//       // gen item
//       this.roomService.releaseGenItem(this.roomId, payload).pipe(first()).subscribe(apiObserver);
//     }
//   };

//   // API result handler
//   const apiObserver = {
//     next: () => {
//       this.alert.success('Released successfully');
//       this.submitting = false;
//       this.closeReleaseModal();
//       this.loadAll(); // refresh lists & statuses
//     },
//     error: (e: any) => {
//       const msg = e?.error?.message || e?.message || String(e);
//       this.alert.error(msg);
//       this.submitting = false;
//     }
//   };

//   // try to find the inventory in already-loaded lists; fallback to fetching the appropriate inventory list
//   const findInList = (): InventoryItem | undefined => {
//     if (flow === 'apparel') {
//       return (this.apparelInventoryList || []).find((i: InventoryItem) => (i.apparelInventoryId ?? i.id) === inventoryId);
//     } else if (flow === 'supply') {
//       return (this.adminSupplyInventoryList || []).find((i: InventoryItem) => (i.adminSupplyInventoryId ?? i.id) === inventoryId);
//     } else {
//       return (this.genItemInventoryList || []).find((i: InventoryItem) => (i.genItemInventoryId ?? i.id) === inventoryId);
//     }
//   };

//   const inv = findInList();
//   if (inv) {
//     const available = Number(inv.totalQuantity ?? inv.quantity ?? inv.supplyQuantity ?? 0);
//     if (available < qty) {
//       this.alert.error(`Not enough stock to release (${available} available).`);
//       this.submitting = false;
//       return;
//     }
//     callReleaseApi();
//     return;
//   }

//   // inventory not present locally: fetch the right inventory list then re-check
//   let fetchObs;
//   if (flow === 'apparel') {
//     fetchObs = this.roomService.getApparelInventory(this.roomId);
//   } else if (flow === 'supply') {
//     fetchObs = this.roomService.getAdminSupplyInventory
//       ? this.roomService.getAdminSupplyInventory(this.roomId)
//       : this.roomService.getAdminSupplyInventory // tolerate alternate name
//         ? this.roomService.getAdminSupplyInventory(this.roomId)
//         : null;
//   } else {
//     fetchObs = this.roomService.getGenItemInventory
//       ? this.roomService.getGenItemInventory(this.roomId)
//       : this.roomService.getGenItemInventory
//         ? this.roomService.getGenItemInventory(this.roomId)
//         : null;
//   }

//   if (!fetchObs) {
//     // no fetch method matched — proceed and rely on backend to validate
//     // (still safer to request the server which will reject if insufficient)
//     callReleaseApi();
//     return;
//   }

//   fetchObs.pipe(first()).subscribe({
//     next: (list: InventoryItem[]) => {
//       if (flow === 'apparel') this.apparelInventoryList = list || [];
//       else if (flow === 'supply') this.adminSupplyInventoryList = list || [];
//       else this.genItemInventoryList = list || [];

//       const found = (flow === 'apparel'
//         ? this.apparelInventoryList.find((i: InventoryItem) => (i.apparelInventoryId ?? i.id) === inventoryId)
//         : flow === 'supply'
//           ? this.adminSupplyInventoryList.find((i: InventoryItem) => (i.adminSupplyInventoryId ?? i.id) === inventoryId)
//           : this.genItemInventoryList.find((i: InventoryItem) => (i.genItemInventoryId ?? i.id) === inventoryId)
//       );

//       if (!found) {
//         this.alert.error('Selected inventory not found. Please refresh and try again.');
//         this.submitting = false;
//         return;
//       }

//       const available = Number(found.totalQuantity ?? 0);
//       if (available < qty) {
//         this.alert.error(`Not enough stock to release (${available} available).`);
//         this.submitting = false;
//         return;
//       }
//       // ok proceed
//       callReleaseApi();
//     },
//     error: (err: any) => {
//       this.alert.error('Failed to fetch inventory for validation: ' + (err?.message || err));
//       this.submitting = false;
//     }
//   });
// }



//   // ------------------------ QR Scanning handlers ------------------------------
//   handleScannedPayload(parsedPayload: any) {
//     this.scanned = parsedPayload;
//     this.showScannedPanel = true;
//   }

//   releaseScannedUnit() {
//     if (!this.scanned) return;

//     // unit-level QR
//     if (this.scanned.unitId) {
//       const stockroomType = this.scanned.itemType || (this.room.stockroomType || 'apparel');
//       const unitId = this.scanned.unitId;
//       this.qrService.releaseUnit(stockroomType, unitId, { actorId: this.account?.accountId }).pipe(first())
//         .subscribe({
//           next: () => {
//             this.alert.success('Unit released');
//             this.showScannedPanel = false;
//             this.loadAll();
//           },
//           error: e => this.alert.error(e)
//         });

//     // batch-level QR (inventory)
//     } else if (this.scanned.id || this.scanned.inventoryId || this.scanned.apparelInventoryId) {
//       const inventoryId = this.scanned.id || this.scanned.inventoryId || this.scanned.apparelInventoryId;
//       const qtyStr = window.prompt('Batch QR detected. How many units to release?', '1');
//       const qty = parseInt(qtyStr || '0', 10);
//       if (!qty || qty <= 0) return;

//       const payload = {
//         apparelInventoryId: inventoryId,
//         releaseQuantity: qty,
//         releasedBy: `${this.account?.firstName || ''} ${this.account?.lastName || ''}`.trim(),
//         claimedBy: '',
//         notes: `Released via QR on ${new Date().toISOString()}`
//       };

//       this.roomService.releaseApparel(this.roomId, payload).pipe(first()).subscribe({
//         next: () => {
//           this.alert.success('Batch released');
//           this.showScannedPanel = false;
//           this.loadAll();
//         },
//         error: e => this.alert.error(e)
//       });
//     }
//   }

//   // ------------------------ QR download helpers -------------------------------
//   downloadBlob(blob: Blob, filename: string) {
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename || 'qrcode.png';
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//     window.URL.revokeObjectURL(url);
//   }

//   parseFilenameFromContentDisposition(cdHeader: string | null, fallback: string) {
//     if (!cdHeader) return fallback;
//     const match = /filename\*?=(?:UTF-8'')?\"?([^\";]+)/i.exec(cdHeader);
//     if (match && match[1]) {
//       try { return decodeURIComponent(match[1]); } catch (e) { return match[1]; }
//     }
//     return fallback;
//   }

//   onDownloadBatchQr(invOrBatch: any) {
//     const stockroomType = (this.room && this.room.stockroomType) ? this.room.stockroomType : 'apparel';
//     const inventoryId = invOrBatch.receiveApparelId || invOrBatch.apparelInventoryId || invOrBatch.id || invOrBatch.inventoryId;
//     if (!inventoryId) {
//       this.alert.error('Cannot determine inventory id for QR generation.');
//       return;
//     }

//     this.qrService.getBatchQr(stockroomType, inventoryId).pipe(first())
//       .subscribe({
//         next: (resp: HttpResponse<Blob>) => {
//           const blob = resp.body as Blob;
//           const cd = resp.headers.get('Content-Disposition');
//           const fallback = `qr-${stockroomType}-${inventoryId}.png`;
//           const filename = this.parseFilenameFromContentDisposition(cd, fallback);
//           this.downloadBlob(blob, filename);
//           this.alert.success('QR downloaded and backend saved/updated (if not already).');
//         },
//         error: err => {
//           this.alert.error(err);
//         }
//       });
//   }

//   onDownloadUnitQr(unit: any) {
//     const stockroomType = (this.room && this.room.stockroomType) ? this.room.stockroomType : 'apparel';
//     const unitId = unit.apparelId || unit.adminSupplyId || unit.id || unit.unitId;
//     if (!unitId) { this.alert.error('Cannot determine unit id for QR generation.'); return; }
//   }
// }

// src/app/room/room-view.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute }     from '@angular/router';
import { first }              from 'rxjs/operators';

import { RoomService, AlertService } from '@app/_services';

@Component({
  templateUrl: './room-view.component.html'
})
export class RoomViewComponent implements OnInit {
  roomId!: number;
  room: any = {};
  stockPath: string = 'general';
  isStockroom = false;

  constructor(
    private route: ActivatedRoute,
    private roomService: RoomService,
    private alert: AlertService
  ) {}

  ngOnInit(): void {
    this.roomId = +this.route.snapshot.params['id'];
    if (!this.roomId) {
      this.alert.error('Room id is missing in route');
      return;
    }

    this.loadRoom();
  }

  private loadRoom() {
    this.roomService.getRoomById(this.roomId).pipe(first()).subscribe({
      next: (r: any) => {
        this.room = r || {};
        this.stockPath = this.computeStockPath(this.room);
        this.isStockroom = this.room.roomType === 'stockroom' || this.room.roomType === 'subStockroom';
      },
      error: (e) => this.alert.error(e)
    });
  }

  private computeStockPath(room: any): string {
    if (!room || !room.stockroomType) return 'general';
    const t = (room.stockroomType || '').toLowerCase();
    if (t === 'apparel') return 'apparel';
    if (t === 'supply') return 'supply';
    return 'general';
  }
}

