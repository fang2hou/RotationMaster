import { IActionMaster } from '../Core/Interface/IActionMaster'
import { FFXIVAction } from '../Core/Structures/FFXIVAction'
import { FFXIVActionType } from '../Core/Enums/FFXIVActionType'
import { IFFXIVPlayer } from '../Core/Interface/IFFXIVPlayer'

export class WarriorMaster implements IActionMaster {
    Actions: { [name: string]: FFXIVAction };
    ComboStage: number;
    ComboTime: number;
    HasInnerChaosBuff: boolean;

    constructor() {
        this.Actions = {};

        this.Actions['HeavySwing'] = new FFXIVAction(
            '1F', 'ヘヴィスウィング', 0, FFXIVActionType.Weaponskill, undefined, 'Icons/War/heavy_swing.png')
        this.Actions['Maim'] = new FFXIVAction(
            '25', 'メイム', 0, FFXIVActionType.Weaponskill, undefined, 'Icons/War/maim.png')
        this.Actions['StormsEye'] = new FFXIVAction(
            '2D', 'シュトルムブレハ', 0, FFXIVActionType.Weaponskill, undefined, 'Icons/War/storm\'s_eye.png')
        this.Actions['StormsPath'] = new FFXIVAction(
            '2A', 'シュトルムヴィント', 0, FFXIVActionType.Weaponskill, undefined, 'Icons/War/storm\'s_path.png')
        this.Actions['FellCleave'] = new FFXIVAction(
            'DDD', 'フェルクリーヴ', 0, FFXIVActionType.Weaponskill, undefined, 'Icons/War/fell_cleave.png')
        this.Actions['Decimate'] = new FFXIVAction(
            'DDE', 'デシメート', 0, FFXIVActionType.Weaponskill)
        this.Actions['InnerChaos'] = new FFXIVAction(
            '4051', 'インナーカオス', 0, FFXIVActionType.Weaponskill, undefined, 'Icons/War/inner_chaos.png')
        this.Actions['ChaoticCyclone'] = new FFXIVAction(
            'DDE', 'カオティックサイクロン', 0, FFXIVActionType.Weaponskill)
        this.Actions['Infuriate'] = new FFXIVAction(
            '4051', 'ウォークライ', 60, FFXIVActionType.Ability, undefined, 'Icons/War/infuriate.png')
        this.Actions['Upheaval'] = new FFXIVAction(
            '1CDB', 'アップヒーバル', 30, FFXIVActionType.Ability, undefined, 'Icons/War/upheaval.png')
        this.Actions['Onslaught'] = new FFXIVAction(
            '1CDA', 'オンスロート', 10, FFXIVActionType.Ability, undefined, 'Icons/War/onslaught.png')
        this.Actions['InnerRelease'] = new FFXIVAction(
            '1CDD', '原初の解放', 90, FFXIVActionType.Ability, undefined, 'Icons/War/inner_release.png')

        this.ComboStage = 0;
        this.ComboTime = Date.now();
        this.HasInnerChaosBuff = false;
    }

    UpdateStage(nextStep: number) {
        if (nextStep !== 0) {
            this.ComboTime = Date.now();
        }

        this.ComboStage = nextStep;
    }

    GetBuffRemain(timestamp?: number) {
        if (!timestamp) timestamp = Date.now();
        let endTime = this.Actions['StormEye'].LastUsedTime + 30 * 1000;
        let remain = endTime - timestamp;
        return remain < 0 ? 0 : remain / 1000;
    }

    DoAction(actionID: string) {
        switch (actionID) {
            // ヘヴィスウィング
            case this.Actions['HeavySwing'].ID:
                this.Actions['HeavySwing'].BeenUsed();
                this.UpdateStage(1);
                break;
            // メイム
            case this.Actions['Maim'].ID:
                this.Actions['Maim'].BeenUsed();
                this.UpdateStage(2);
                break;
            // シュトルムブレハ
            case this.Actions['StormsEye'].ID:
                this.Actions['StormsEye'].BeenUsed();
                this.UpdateStage(0);
                break;
            // シュトルムヴィント
            case this.Actions['StormsPath'].ID:
                this.Actions['StormsPath'].BeenUsed();
                this.UpdateStage(0);
                break;
            // フェルクリーヴ
            case this.Actions['FellCleave'].ID:
                this.Actions['FellCleave'].BeenUsed();
                break;
            // インナーカオス
            case this.Actions['InnerChaos'].ID:
                this.HasInnerChaosBuff = false;
                this.Actions['InnerChaos'].BeenUsed();
                this.Actions['Infuriate'].LastUsedTime -= 5 * 1000;
            // デシメート
            case this.Actions['Decimate'].ID:
                this.Actions['Decimate'].BeenUsed();
                break;
            // 	カオティックサイクロン
            case this.Actions['ChaoticCyclone'].ID:
                this.Actions['ChaoticCyclone'].BeenUsed();
                this.Actions['Infuriate'].LastUsedTime -= 5 * 1000;
                break;
            // アップヒーバル
            case this.Actions['Upheaval'].ID:
                this.Actions['Upheaval'].BeenUsed();
                break;
            // オンスロート
            case this.Actions['Onslaught'].ID:
                this.Actions['Onslaught'].BeenUsed();
                break;
            // ウォークライ
            case this.Actions['Infuriate'].ID:
                this.Actions['Infuriate'].BeenUsed();
                this.HasInnerChaosBuff = true;
                break;
            // 原初の解放
            case this.Actions['InnerRelease'].ID:
                this.Actions['InnerRelease'].BeenUsed();
                break;
            default:
                break;
        }
    }

    Consider(playerInfo: IFFXIVPlayer) {

    }

    ResetAllActions() {
        for (let name in this.Actions) {
            this.Actions[name].Reset();
        }

        this.ComboStage = 0;
        this.ComboTime = Date.now();
        this.HasInnerChaosBuff = false;
    }
}