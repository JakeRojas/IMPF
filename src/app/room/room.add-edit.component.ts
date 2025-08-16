import { Component, OnInit }                    from '@angular/core';
import { Router, ActivatedRoute }               from '@angular/router';
import { FormBuilder, FormGroup, Validators }   from '@angular/forms';
import { first }                                from 'rxjs/operators';

import { RoomService, AlertService }            from '@app/_services';

@Component({ templateUrl: 'room.add-edit.component.html' })
export class RoomAddEditComponent implements OnInit {
    form!:      FormGroup;
    roomId?:    number;
    title!:     string;
    loading     = false;
    submitting  = false;
    submitted   = false;

    constructor(
        private formBuilder:    FormBuilder,
        private route:          ActivatedRoute,
        private router:         Router,
        private RoomService:    RoomService,
        private alertService:   AlertService
    ) { }

    ngOnInit() {
        this.roomId = this.route.snapshot.params['roomId'];

        // Define form with necessary fields
        this.form = this.formBuilder.group({
            roomName:       ['',            [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            roomFloor:      ['',            [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            roomType:       ['unknownroom', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            stockroomType:  ['unknownType', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            roomInCharge:   [,              [Validators.required]],
        });

        this.title = 'Create Room';
        if (this.roomId) {
            // Edit mode
            this.title = 'Edit Room';
            this.loading = true;
            this.RoomService.getRoomById(this.roomId)
                .pipe(first())
                .subscribe({
                    next: (room) => {
                        this.form.patchValue(room);
                        this.loading = false;
                    },
                    error: () => this.loading = false
                });
        }
    }

    // Convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // Clear alerts on submit
        this.alertService.clear();

        // Stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.submitting = true;

        // Create or update Room based on id param
        let saveRoom;
        let message: string;
        if (this.roomId) {
            saveRoom = () => this.RoomService.updateRoom(this.roomId!, this.form.value);
            message = 'Room updated successfully';
        } else {
            saveRoom = () => this.RoomService.createRoom(this.form.value);
            message = 'Room created successfully';
        }

        saveRoom()
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success(message, { keepAfterRouteChange: true });
                    this.router.navigateByUrl('/rooms');
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }
}
