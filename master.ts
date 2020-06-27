declare var Regexes: any;

let GLOBAL_COOL_DOWN: number = 2.5;
const ABILITY_STUN: number = 0.5;

interface IFFXIVPlayer {
    ID: string;
    Name: string;
    Job: string;
    Level: number;
    CurrentMP: number;
    MaxMP: number;
    JobSource: {
        Beast: number;
    }
}

enum FFXIVActionType {
    Weaponskill,
    Spell,
    Ability,
}

class FFXIVAction {
    ID: string;
    Name: string;
    CoolDown: number;
    LastUsedTime: number;
    Type: FFXIVActionType;
    CurrentStack: number;
    MaxStack: number;
    IconURL: string | null;

    constructor(id: string, name: string, cooldown: number, type: FFXIVActionType, maxStack?: number, url?: string) {
        this.ID = id;
        this.Name = name;
        this.CoolDown = cooldown * 1000;
        this.Type = type;
        this.MaxStack = maxStack || 1;
        this.CurrentStack = this.MaxStack;
        this.IconURL = url || null;

        this.LastUsedTime = 0;
    }

    StackUpdate() {
        if (this.CurrentStack < this.MaxStack) {
            let currentTime = Date.now();
            let isCharged = currentTime - this.LastUsedTime > this.CoolDown;
            if (isCharged) {
                this.LastUsedTime += this.CoolDown;
                this.CurrentStack++;
            }
        }
    }

    // 支持 3 种模式进行获取剩余时间
    GetRemainTime(time?: number, gcd?: number): number {
        this.StackUpdate();

        let remain: number;

        if (gcd) {
            // gcd 数量模式
            let currentTime = Date.now();
            let gcdTime = currentTime + gcd * GLOBAL_COOL_DOWN * 1000;
            remain = this.CoolDown - (gcdTime - this.LastUsedTime);
        } else if (time) {
            // 时间戳模式
            remain = this.CoolDown - (time - this.LastUsedTime);
        } else {
            // 当前时间模式
            let currentTime = Date.now();
            remain = this.CoolDown - (currentTime - this.LastUsedTime);
        }

        return remain < 0 ? 0 : remain / 1000;
    }

    BeenUsed() {
        this.StackUpdate();

        if (this.MaxStack != 1) {
            if (this.CurrentStack == this.MaxStack) {
                // 满层数时使用是要开始计时的
                this.LastUsedTime = Date.now();
            }
        } else {
            this.LastUsedTime = Date.now();
        }

        this.CurrentStack = Math.max(0, this.CurrentStack - 1);
    }

    Reset() {
        this.CurrentStack = this.MaxStack;
        this.LastUsedTime = 0;
    }
}

interface ICustomMaster {
    Actions: { [name: string]: FFXIVAction };
    DoAction: (actionID: string) => void;
    Consider: (playerInfo: IFFXIVPlayer) => void;
    ResetAllActions: () => void;
}

class WarriorMaster implements ICustomMaster {
    Actions: { [name: string]: FFXIVAction };
    ComboStage: number;
    ComboTime: number;
    HasInnerChaosBuff: boolean;

    constructor() {
        this.Actions = {};

        this.Actions['HeavySwing'] = new FFXIVAction(
            '1F', 'ヘヴィスウィング', 0, FFXIVActionType.Weaponskill, undefined, 'War/heavy_swing.png')
        this.Actions['Maim'] = new FFXIVAction(
            '25', 'メイム', 0, FFXIVActionType.Weaponskill, undefined, 'War/maim.png')
        this.Actions['StormsEye'] = new FFXIVAction(
            '2D', 'シュトルムブレハ', 0, FFXIVActionType.Weaponskill, undefined, 'War/storm\'s_eye.png')
        this.Actions['StormsPath'] = new FFXIVAction(
            '2A', 'シュトルムヴィント', 0, FFXIVActionType.Weaponskill, undefined, 'War/storm\'s_path.png')
        this.Actions['FellCleave'] = new FFXIVAction(
            'DDD', 'フェルクリーヴ', 0, FFXIVActionType.Weaponskill, undefined, 'War/fell_cleave.png')
        this.Actions['Decimate'] = new FFXIVAction(
            'DDE', 'デシメート', 0, FFXIVActionType.Weaponskill)
        this.Actions['InnerChaos'] = new FFXIVAction(
            '4051', 'インナーカオス', 0, FFXIVActionType.Weaponskill, undefined, 'War/inner_chaos.png')
        this.Actions['ChaoticCyclone'] = new FFXIVAction(
            'DDE', 'カオティックサイクロン', 0, FFXIVActionType.Weaponskill)
        this.Actions['Infuriate'] = new FFXIVAction(
            '4051', 'ウォークライ', 60, FFXIVActionType.Ability, undefined, 'War/infuriate.png')
        this.Actions['Upheaval'] = new FFXIVAction(
            '1CDB', 'アップヒーバル', 30, FFXIVActionType.Ability, undefined, 'War/upheaval.png')
        this.Actions['Onslaught'] = new FFXIVAction(
            '1CDA', 'オンスロート', 10, FFXIVActionType.Ability, undefined, 'War/onslaught.png')
        this.Actions['InnerRelease'] = new FFXIVAction(
            '1CDD', '原初の解放', 90, FFXIVActionType.Ability, undefined, 'War/inner_release.png')

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

class RotationMaster {
    Player: IFFXIVPlayer | null;
    Initialized: boolean;
    Regexes: {
        UseAbility: any,
        GainEffect: any,
        LoseEffect: any,
    };

    core: ICustomMaster | null;

    constructor() {
        this.Player = null;
        this.Initialized = false;
        this.Regexes = {
            UseAbility: null,
            GainEffect: null,
            LoseEffect: null,
        };

        this.core = null;
    }

    OnPlayerChanged(entityData: any) {
        if (!this.Initialized) {
            this.Player = {
                ID: <string><any>entityData.detail.id,
                Name: <string><any>entityData.detail.name,
                Job: <string><any>entityData.detail.job,
                Level: <number><any>entityData.detail.level,
                CurrentMP: <number><any>entityData.detail.currentMP,
                MaxMP: 1000, // 5.0 版本开始固定为 10000 魔力
                JobSource: {
                    Beast: 0,
                },
            };

            this.Regexes.UseAbility = Regexes.ability({ source: this.Player.Name });
            this.Regexes.GainEffect = Regexes.gainsEffect({ target: this.Player.Name });
            this.Regexes.LoseEffect = Regexes.losesEffect({ target: this.Player.Name });
        };

        if (this.Player?.Job != entityData.detail.job) {
            // 重置
            this.Initialized = false;
            this.OnPlayerChanged(entityData);
            return;
        }

        if (this.Player?.Job) {
            switch (this.Player?.Job) {
                case 'WAR': // 战士
                    this.Player.JobSource.Beast = <number><any>entityData.detail.jobDetail.beast;
                    this.core = new WarriorMaster();
                    break;
                default:
                    this.core = new WarriorMaster(); /* Debug */
                    break;
            }
        }
    }

    OnLogEvent(entityData: any) {
        if (!this.Initialized) return;

        for (let i = 0; i < entityData.detail.logs.length; i++) {
            let log = entityData.detail.logs[i];

            if (log[16] == '5' || log[16] == '6') {
                let matchResult = log.match(this.Regexes.UseAbility);
                if (matchResult) {
                    let id = matchResult.groups.id;
                    this.core?.DoAction(id);
                    return;
                }
            } if (log[15] == '1') {
                if (log[16] == 'A') {
                    // let m = log.match(this.Regexes.GainEffect);
                } else if (log[16] == 'E') {
                    // let m = log.match(this.Regexes.LoseEffect);
                }
            } else if (log.search(/reset-war/) >= 0) {
                console.log('Test request received.');
                this.core?.ResetAllActions();
            } else if (log.search(/21:........:40000010:/) >= 0) {
                console.log('Retry');
                this.core?.ResetAllActions();
            }
        }
    }
}