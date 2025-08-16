import { Account} from '@app/_models';

export interface Room {
    roomId: number;
    roomName: string;
    roomFloor: string;
    roomType: string;
    stockroomType: string;
    roomInCharge: Account;
}