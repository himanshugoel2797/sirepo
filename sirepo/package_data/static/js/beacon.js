'use strict';

var srlog = SIREPO.srlog;
var srdbg = SIREPO.srdbg;

SIREPO.app.config(function() {
    SIREPO.SINGLE_FRAME_ANIMATION = ['B1B2Animation', 'B2B3Animation', 'B3B4Animation'];
});

SIREPO.app.factory('beaconService', function(appState) {
    var self = {};
    appState.setAppService(self);
    self.computeModel = () => 'animation';
    return self;
});

SIREPO.app.controller('BeamlineController', function (appState, frameCache, panelState, persistentSimulation, $scope) {
    var self = this;
    self.simScope = $scope;
    self.simHandleStatus = data => {
        self.reports = data.reports;
        frameCache.setFrameCount(data.frameCount || 0);
    };
    self.simState = persistentSimulation.initSimulationState(self);
});

SIREPO.app.directive('appFooter', function() {
    return {
        restrict: 'A',
        scope: {
            nav: '=appFooter',
        },
        template: `
            <div data-common-footer="nav"></div>
        `,
    };
});

SIREPO.app.directive('appHeader', function(appState, beaconService, panelState) {
    return {
        restrict: 'A',
        scope: {
            nav: '=appHeader',
        },
        template: `
            <div data-app-header-brand="nav"></div>
            <div data-app-header-left="nav"></div>
            <div data-app-header-right="nav">
              <app-header-right-sim-loaded>
                <div data-sim-sections="">
                  <li class="sim-section" data-ng-class="{active: nav.isActive(\'beamline\')}"><a href data-ng-click="nav.openSection(\'beamline\')"><span class="glyphicon glyphicon-flash"></span> Beamline</a></li>
                </div>
              </app-header-right-sim-loaded>
              <app-settings>
              </app-settings>
              <app-header-right-sim-list>
              </app-header-right-sim-list>
            </div>
        `,
    };
});
