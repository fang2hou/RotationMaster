declare var addOverlayListener: any;

import { RotationMaster } from './Core/RotationMaster'

let rotationMaster = new RotationMaster();

addOverlayListener("onPlayerChangedEvent", function (entityData: any) {
    rotationMaster.OnPlayerChanged(entityData);
});

addOverlayListener("onLogEvent", function (entityData: any) {
    rotationMaster.OnLogEvent(entityData);
});

addOverlayListener('onInCombatChangedEvent', function (entityData: any) {
    rotationMaster.OnInCombatChanged(entityData);
});