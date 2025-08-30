﻿import { Injectable }           from '@angular/core';
import { Observable, Subject }  from 'rxjs';
import { filter }               from 'rxjs/operators';

import { Alert, AlertOptions, AlertType } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class AlertService {
    private subject = new Subject<Alert>();
    private defaultId = 'default-alert';

    onAlert(id = this.defaultId): Observable<Alert> {
        return this.subject.asObservable().pipe(filter(x => x && x.id === id));
    }
    success(message: string, options?: AlertOptions) {
        this.alert(new Alert({ ...options, type: AlertType.Success, message }));
    }
    error(message: any) {
        const readable =
          message?.error?.message ??
          (typeof message === 'string'
            ? message
            : message?.message ??
              JSON.stringify(message?.error ?? message));
      
        this.subject.next({ type: AlertType.Error, message });
    }
    info(message: string, options?: AlertOptions) {
        this.alert(new Alert({ ...options, type: AlertType.Info, message }));
    }
    warn(message: string, options?: AlertOptions) {
        this.alert(new Alert({ ...options, type: AlertType.Warning, message }));
    }
    alert(alert: Alert) {
        alert.id = alert.id || this.defaultId;
        alert.autoClose = (alert.autoClose === undefined ? true : alert.autoClose);
        this.subject.next(alert);
    }
    clear(id = this.defaultId) {
        this.subject.next(new Alert({ id }));
    }
}