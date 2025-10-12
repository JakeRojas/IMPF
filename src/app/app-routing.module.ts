import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home';
import { AuthGuard } from './_helpers';
import { Role } from './_models';

const accountModule = () => import('./account/account.module').then(x => x.AccountModule);
const adminModule = () => import('./admin/admin.module').then(x => x.AdminModule);
const profileModule = () => import('./profile/profile.module').then(x => x.ProfileModule);

const roomModule = () => import('./room/room.module').then(x => x.RoomModule);
const scanModule = () => import('./scan/scan.module').then(x => x.ScanModule);

const stockRequestModule = () => import('./requests/stock-request/stock-request.module').then(x => x.StockRequestModule);
const itemRequestModule = () => import('./requests/item-request/item-request.module').then(x => x.ItemRequestModule);

const transferModule = () => import('./transfer/transfer.module').then(x => x.TransferModule);

const routes: Routes = [
    { path: '', component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'account', loadChildren: accountModule },
    { path: 'profile', loadChildren: profileModule, canActivate: [AuthGuard] },
    { path: 'admin', loadChildren: adminModule, canActivate: [AuthGuard], data: { roles: [Role.SuperAdmin] } },

    { path: 'room', loadChildren: roomModule, canActivate: [AuthGuard], data: { roles: [Role.SuperAdmin, Role.Admin, Role.StockroomAdmin] } },
    { path: 'scan', loadChildren: scanModule, canActivate: [AuthGuard], data: { roles: [Role.SuperAdmin] } },

    { path: 'req-stock', loadChildren: stockRequestModule, canActivate: [AuthGuard], data: { roles: [Role.SuperAdmin, Role.Admin, Role.StockroomAdmin] } },
    { path: 'req-item', loadChildren: itemRequestModule, canActivate: [AuthGuard], data: { roles: [Role.SuperAdmin, Role.StockroomAdmin, Role.Teacher] } },

    { path: 'transfers', loadChildren: transferModule, canActivate: [AuthGuard], data: { roles: [Role.SuperAdmin, Role.Admin, Role.StockroomAdmin, Role.Teacher] } },

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
