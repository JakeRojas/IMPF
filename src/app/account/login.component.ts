import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';

@Component({ templateUrl: 'login.component.html' })
export class LoginComponent implements OnInit {
    form!: FormGroup;
    submitting = false;
    submitted = false;
    showRegister = false;
    hidePassword = true;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
        this.accountService.hasAnyAccount()
            .pipe(first())
            .subscribe({
                next: (res: any) => {
                    console.log('[Login] hasAnyAccount response:', res);
                    // show register button only if res.exists is explicitly false
                    // or if the response indicates no accounts found
                    const exists = res && (res.exists === true || res.exists === 1 || res.exists === 'true');
                    this.showRegister = !exists;
                    console.log('[Login] showRegister evaluated to:', this.showRegister);
                },
                error: err => {
                    console.error('[Login] hasAnyAccount failed (showing register):', err);
                    this.showRegister = true;
                }
            });
    }

    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        this.submitting = true;
        this.accountService.login(this.f.email.value, this.f.password.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
                    this.router.navigateByUrl(returnUrl);
                },
                error: error => {
                    this.alertService.error(error);
                    this.submitting = false;
                }
            });
    }
}