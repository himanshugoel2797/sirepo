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
                  <li class="sim-section" data-ng-class="{active: nav.isActive('beamline')}"><a href data-ng-click="nav.openSection('beamline')"><span class="glyphicon glyphicon-flash"></span> Beamline</a></li>
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


SIREPO.app.directive('beamlineButton', function(panelState) {
    return {
        restrict: 'A',
        scope: {
            element: '=beamlineButton',
        },
        template: `
<button type="button" data-ng-click="showModel()" data-ng-attr-class="btn btn-sm btn-{{ element.style }}" data-ng-attr-style="position: absolute; top: {{element.y}}px; left: {{element.x}}px">{{ element.title }}</button>
        `,
        controller: function($scope) {
            $scope.showModel = () => {
                panelState.showModalEditor($scope.element.modelAccess.modelKey);
            };

            if (! $scope.element.style) {
                $scope.element.style = 'default';
            }
        },
    };
});

SIREPO.app.directive('beaconBeamline', function(appState) {
    return {
        restrict: 'A',
        scope: {},
        template: `
<div class="text-center" style="width: 1000px; margin: auto; position: relative">


<div data-ng-repeat="el in elements"><div data-beamline-button="el"></div></div>


<svg version="1.1" viewBox="0.0 0.0 660.0 250.0" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">
  <clipPath id="p.0">
    <path d="m0 0l960.0 0l0 720.0l-960.0 0l0 -720.0z" clip-rule="nonzero"/>
  </clipPath>
  <g>
    <path fill="#000000" fill-opacity="0.0" d="m0 0l960.0 0l0 720.0l-960.0 0z" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m8.0 176.0l184.0 0" fill-rule="evenodd"/>
    <path stroke="#cccccc" stroke-width="8.0" stroke-linejoin="round" stroke-linecap="butt" d="m8.0 176.0l184.0 0" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m448.0 176.0l184.0 0" fill-rule="evenodd"/>
    <path stroke="#cccccc" stroke-width="8.0" stroke-linejoin="round" stroke-linecap="butt" d="m448.0 176.0l184.0 0" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m320.0 8.0l-64.0 104.0" fill-rule="evenodd"/>
    <path stroke="#ff0000" stroke-opacity="0.6" stroke-width="7.0" stroke-linejoin="round" stroke-linecap="butt" d="m320.0 8.0l-64.0 104.0" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m320.0 8.0l120.0 0" fill-rule="evenodd"/>
    <path stroke="#ff0000" stroke-opacity="0.6" stroke-width="7.0" stroke-linejoin="round" stroke-linecap="butt" d="m320.0 8.0l120.0 0" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m336.0 88.0l168.0 0" fill-rule="evenodd"/>
    <path stroke="#ff0000" stroke-opacity="0.6" stroke-width="7.0" stroke-linejoin="round" stroke-linecap="butt" d="m336.0 88.0l168.0 0" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m384.0 112.0l80.0 128.0" fill-rule="evenodd"/>
    <path stroke="#ff0000" stroke-opacity="0.6" stroke-width="7.0" stroke-linejoin="round" stroke-linecap="butt" d="m384.0 112.0l80.0 128.0" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m464.0 240.0l120.0 0" fill-rule="evenodd"/>
    <path stroke="#ff0000" stroke-opacity="0.6" stroke-width="7.0" stroke-linejoin="round" stroke-linecap="butt" d="m464.0 240.0l120.0 0" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m192.0 176.0c26.0 0 39.0 -22.0 52.0 -44.0c13.0 -22.0 26.0 -44.0 52.0 -44.0" fill-rule="evenodd"/>
    <path stroke="#cccccc" stroke-width="8.0" stroke-linejoin="round" stroke-linecap="butt" d="m192.0 176.0c26.0 0 39.0 -22.0 52.0 -44.0c13.0 -22.0 26.0 -44.0 52.0 -44.0" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m448.0 176.0c-26.0 0 -39.0 -22.0 -52.0 -44.0c-13.0 -22.0 -26.0 -44.0 -52.0 -44.0" fill-rule="evenodd"/>
    <path stroke="#cccccc" stroke-width="8.0" stroke-linejoin="round" stroke-linecap="butt" d="m448.0 176.0c-26.0 0 -39.0 -22.0 -52.0 -44.0c-13.0 -22.0 -26.0 -44.0 -52.0 -44.0" fill-rule="evenodd"/>
    <path fill="#000000" fill-opacity="0.0" d="m296.0 88.0l48.0 0" fill-rule="evenodd"/>
    <path stroke="#cccccc" stroke-width="8.0" stroke-linejoin="round" stroke-linecap="butt" d="m296.0 88.0l48.0 0" fill-rule="evenodd"/>
  </g>
</svg>

</div>

<div data-ng-repeat="el in element">
    <div data-modal-editor="" view-name="{{ el.modelName }}" data-model-data="el.modelAccess"></div>
</div>


        `,
        controller: function(appState, $scope) {

            function findElementByTitle(title) {
                for (const el of appState.models.beamline.elements) {
                    if (el.title == title) {
                        return el;
                    }
                }
            }

            $scope.elements = [
                {
                    x: 30,
                    y: 250,
                    title: 'Electron Beam',
                    modelAccess: {
                        modelKey: 'electronBeam',
                        getData: () => appState.models.electronBeam,
                    },
                },
                {
                    x: 290,
                    y: 250,
                    title: 'B1',
                    style: 'primary',
                    modelAccess: {
                        modelKey: 'dipole',
                        getData: () => {
                            return findElementByTitle('B1');
                        },
                    },
                },
                {
                    x: 395,
                    y: 120,
                    title: 'B2',
                    style: 'primary',
                    modelAccess: {
                        modelKey: 'dipole',
                        getData: () => {
                            return findElementByTitle('B2');
                        },
                    },
                },
                {
                    x: 540,
                    y: 120,
                    title: 'B3',
                    style: 'primary',
                    modelAccess: {
                        modelKey: 'dipole',
                        getData: () => {
                            return findElementByTitle('B3');
                        },
                    },
                },
                {
                    x: 645,
                    y: 250,
                    title: 'B4',
                    style: 'primary',
                    modelAccess: {
                        modelKey: 'dipole',
                        getData: () => {
                            return findElementByTitle('B4');
                        },
                    },
                },
                {
                    x: 460,
                    y: 0,
                    title: 'W1',
                    style: 'warning',
                    modelAccess: {
                        modelKey: 'aperture',
                        getData: () => {
                            return findElementByTitle('Window 1');
                        },
                    },
                },
                {
                    x: 645,
                    y: 120,
                    title: 'W2',
                    style: 'warning',
                    modelAccess: {
                        modelKey: 'aperture',
                        getData: () => {
                            return findElementByTitle('Window 2');
                        },
                    },
                },
                {
                    x: 680,
                    y: 350,
                    title: 'W3',
                    style: 'warning',
                    modelAccess: {
                        modelKey: 'aperture',
                        getData: () => {
                            return findElementByTitle('Window 3');
                        },
                    },
                },
                {
                    x: 660,
                    y: 0,
                    title: 'B1 B2',
                    style: 'success',
                    modelAccess: {
                        modelKey: 'camera',
                        getData: () => {
                            return findElementByTitle('B1 B2 Camera');
                        },
                    },
                },
                {
                    x: 760,
                    y: 120,
                    title: 'B2 B3',
                    style: 'success',
                    modelAccess: {
                        modelKey: 'camera',
                        getData: () => {
                            return findElementByTitle('B2 B3 Camera');
                        },
                    },
                },
                {
                    x: 880,
                    y: 350,
                    title: 'B3 B4',
                    style: 'success',
                    modelAccess: {
                        modelKey: 'camera',
                        getData: () => {
                            return findElementByTitle('B3 B4 Camera');
                        },
                    },
                },
            ];
        },
    };
});
