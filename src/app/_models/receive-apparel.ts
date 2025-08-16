import { Account} from '@app/_models';

export interface ReceiveApparel {
    ReceiveApparelId:   number;
    receivedFrom:       Account[];
    receivedBy:         string;
    releasedBy:         string;
    apparelName:        string;
    apparelLevel:       string;
    apparelType:        string;
    apparelFor:         string;
    apparelSize:        string;
    apparelQuantity:    string;
}

export default ReceiveApparel;