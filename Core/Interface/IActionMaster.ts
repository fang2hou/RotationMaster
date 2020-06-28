import { FFXIVAction } from '../Structures/FFXIVAction'
import { IFFXIVPlayer } from './IFFXIVPlayer'

export interface IActionMaster {
    Actions: { [name: string]: FFXIVAction };
    IsInCombat: boolean;
    DoAction: (actionID: string) => void;
    Consider: (playerInfo: IFFXIVPlayer) => void;
    ResetAllActions: () => void;
}