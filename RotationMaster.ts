declare var Regexes: any;
declare var addOverlayListener: any;

import { IFFXIVPlayer } from './Core/Interface/IFFXIVPlayer'
import { IActionMaster } from './Core/Interface/IActionMaster'
import { WarriorMaster } from './Jobs/Warrior'

class RotationMaster {
    Player: IFFXIVPlayer | null;
    Initialized: boolean;
    Regexes: {
        UseAbility: any,
        GainEffect: any,
        LoseEffect: any,
    };

    core: IActionMaster | null;

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

            if (this.Player?.Job) {
                switch (this.Player?.Job) {
                    case 'WAR':
                        this.core = new WarriorMaster();
                        break;
                    default:
                        this.core = new WarriorMaster(); /* Debug */
                        break;
                }
            }
        };

        // Reset after changing the job
        if (this.Player?.Job != entityData.detail.job) {
            this.Initialized = false;
            this.OnPlayerChanged(entityData);
            return;
        }

        // Update job source
        if (this.Player?.Job) {
            switch (this.Player?.Job) {
                case 'WAR':
                    this.Player.JobSource.Beast = <number><any>entityData.detail.jobDetail.beast;
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

let rotationMaster = new RotationMaster();

addOverlayListener("onPlayerChangedEvent", function (e:any) {
    rotationMaster.OnPlayerChanged(e);
});

addOverlayListener("onLogEvent", function (e:any) {
    rotationMaster.OnLogEvent(e);
});

// addOverlayListener('onInCombatChangedEvent', function (e) {
//     rotationMaster.OnInCombatChanged(e);
// });