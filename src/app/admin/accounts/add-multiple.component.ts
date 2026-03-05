import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';

@Component({ templateUrl: 'add-multiple.component.html' })
export class AddMultipleComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    submitting = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        public accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            emails: ['', Validators.required],
            role: ['', Validators.required],
            status: ['active', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, {
            validator: MustMatch('password', 'confirmPassword')
        });
    }

    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        const rawEmails = this.form.value.emails;
        // Split by comma, newline, or space, filter out empty, format validate if needed
        const emailList = rawEmails.split(/[\s,]+/).filter((e: string) => e.trim().length > 0);
        if (emailList.length === 0) {
            this.alertService.error('Please provide at least one valid email address.');
            return;
        }

        // Optional: rudimentary email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emailList.filter((e: string) => !emailRegex.test(e));
        if (invalidEmails.length > 0) {
            this.alertService.error(`Invalid email formats found: ${invalidEmails.join(', ')}`);
            return;
        }

        this.submitting = true;

        const accountsPayload = emailList.map((email: string) => ({
            title: 'N/A',
            firstName: 'New',
            lastName: 'User',
            email: email,
            role: this.form.value.role,
            status: this.form.value.status,
            password: this.form.value.password,
            confirmPassword: this.form.value.confirmPassword
        }));

        this.accountService.createArray(accountsPayload)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success(`${emailList.length} Accounts created successfully`, { keepAfterRouteChange: true });
                    this.router.navigateByUrl('/admin/accounts');
                },
                error: error => {
                    console.error('Create multiple accounts error:', error);
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }
}
