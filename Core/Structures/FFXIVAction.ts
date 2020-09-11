import { FFXIVActionType } from '../Enums/FFXIVActionType'
declare var GLOBAL_COOL_DOWN: number;

export class FFXIVAction {
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

    GetRemainTime(time?: number, gcd?: number): number {
        this.StackUpdate();

        let remain: number;

        if (gcd) {
            let currentTime = Date.now();
            let gcdTime = currentTime + gcd * GLOBAL_COOL_DOWN * 1000;
            remain = this.CoolDown - (gcdTime - this.LastUsedTime);
        } else if (time) {
            remain = this.CoolDown - (time - this.LastUsedTime);
        } else {
            let currentTime = Date.now();
            remain = this.CoolDown - (currentTime - this.LastUsedTime);
        }

        return remain < 0 ? 0 : remain / 1000;
    }

    BeenUsed() {
        this.StackUpdate();

        if (this.MaxStack != 1) {
            if (this.CurrentStack == this.MaxStack) {
                // Only start calculate the cooldown after using action in max stack
                this.LastUsedTime = Date.now();
            }
        } else {
            this.LastUsedTime = Date.now();
        }

        this.CurrentStack = Math.max(0, this.CurrentStack - 1);

        console.log(this.Name+" been used.");
    }

    Reset() {
        this.CurrentStack = this.MaxStack;
        this.LastUsedTime = 0;
    }
}