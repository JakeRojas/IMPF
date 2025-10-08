import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form!: FormGroup;
    AccountId?: number;
    title!: string;
    loading = false;
    submitting = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        public accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.AccountId = this.route.snapshot.params['AccountId'];

        this.form = this.formBuilder.group({
            title:              ['', Validators.required],
            firstName:          ['', Validators.required],
            lastName:           ['', Validators.required],
            email:              ['', [Validators.required, Validators.email]],
            role:               ['', Validators.required],
            status:             ['', Validators.required],
            password:           ['', [Validators.minLength(6), ...(!this.AccountId ? [Validators.required] : [])]],
            confirmPassword:    ['']
        }, {
            validator: MustMatch('password', 'confirmPassword')
        });

        this.title = 'Create Account';
        if (this.AccountId) {
            this.title = 'Edit Account';
            this.loading = true;
            this.accountService.getById(this.AccountId)
                .pipe(first())
                .subscribe(x => {
                    this.form.patchValue(x);
                    this.loading = false;
                });
        }
    }

    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        this.submitting = true;

        let saveAccount;
        let message: string;
        if (this.AccountId) {
            saveAccount = () => this.accountService.update(this.AccountId!, this.form.value);
            message = 'Account updated';
        } else {
            saveAccount = () => this.accountService.create(this.form.value);
            message = 'Account created';
        }

        saveAccount()
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success(message, { keepAfterRouteChange: true });
                    this.router.navigateByUrl('/admin/accounts');
                },
                error: error => {
                    console.error('Create account error:', error);
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }
}