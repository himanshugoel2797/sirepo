'use strict';

var srlog = SIREPO.srlog;
var srdbg = SIREPO.srdbg;

SIREPO.app.config(function() {
    SIREPO.SINGLE_FRAME_ANIMATION = ['B1B2Animation', 'B2B3Animation', 'B3B4Animation'];
    SIREPO.appFieldEditors += `
        <div data-ng-switch-when="VariationElements">
          <div data-variation-elements="" data-model-name="modelName" data-model="model" data-field="field"></div>
        </div>
    `;
});

SIREPO.app.factory('beaconService', function(appState) {
    const self = {};
    appState.setAppService(self);
    self.computeModel = (analysisModel) => {
        if (analysisModel == 'mlAnimation') {
            return analysisModel;
        }
        return'animation';
    };
    return self;
});

SIREPO.app.controller('BeamlineController', function (appState, frameCache, panelState, persistentSimulation, $scope) {
    const self = this;
    self.simScope = $scope;
    self.simHandleStatus = data => {
        self.reports = data.reports;
        frameCache.setFrameCount(data.frameCount || 0);
    };
    self.simState = persistentSimulation.initSimulationState(self);
});

SIREPO.app.controller('MLController', function (appState, frameCache, panelState, persistentSimulation, $scope) {
    const self = this;
    self.simScope = $scope;
    self.simAnalysisModel = 'mlAnimation';
    self.simHandleStatus = data => {
        //TODO(pjm): provide link to h5 result file
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
                  <li class="sim-section" data-ng-class="{active: nav.isActive('beamline')}"><a href data-ng-click="nav.openSection('beamline')"><span class="glyphicon glyphicon-option-horizontal"></span> Beamline</a></li>
                  <li class="sim-section" data-ng-class="{active: nav.isActive('ml')}"><a href data-ng-click="nav.openSection('ml')"><span class="glyphicon glyphicon-equalizer"></span> Machine Learning</a></li>
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


SIREPO.app.directive('beamlineButton', function(beamlineService, panelState) {
    return {
        restrict: 'A',
        scope: {
            item: '=beamlineButton',
        },
        template: `
<button type="button" data-ng-click="togglePopover()" class="btn btn-sm srw-beamline-element-label" data-ng-class="{'btn-{{item.style}}': true}" data-ng-attr-style="position: absolute; top: {{item.y}}px; left: {{item.x}}px">{{ item.title }} <span class="caret"></span></button>
        `,
        controller: function($scope, $element) {
            $scope.togglePopover = () => {
                if (beamlineService.activeItem) {
                    beamlineService.setActiveItem(null);
                }
                $($element).find('.srw-beamline-element-label').popover('toggle');
            };
        },
        link: function(scope, element) {
            const el = $(element).find('.srw-beamline-element-label');

            el.popover({
                trigger: 'manual',
                html: true,
                placement: 'bottom',
                content: function() {
                    return $('#srw-' + scope.item.modelAccess.modelKey + '-editor');
                },
                // adds sr-beamline-popover class to standard template
                template: '<div class="popover sr-beamline-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
            }).on('show.bs.popover', function() {
                $('.srw-beamline-element-label').not(el).popover('hide');
                beamlineService.setActiveItem(scope.item.modelAccess.getData());
                const editor = el.data('bs.popover').getContent();
                editor.trigger('sr.resetActivePage');
            }).on('shown.bs.popover', function() {
                $('.popover-content .form-control').first().select();
                scope.$apply();
            }).on('hide.bs.popover', function() {
                beamlineService.setActiveItem(null);
                const editor = el.data('bs.popover').getContent();
                // return the editor to the editor-holder so it will be available for the
                // next element of this type
                if (editor) {
                    $('.srw-editor-holder').append(editor);
                }
            });

            scope.$on('$destroy', function() {
                el.off();
                const popover = el.data('bs.popover');
                // popover has a memory leak with $tip user_data which needs to be cleaned up manually
                if (popover && popover.$tip) {
                    popover.$tip.removeData('bs.popover');
                }
                el.popover('destroy');
            });
        },
    };
});

SIREPO.app.directive('editorHolders', function(appState) {
    return {
        restrict: 'A',
        scope: {},
        template: `
            <div class="srw-editor-holder" style="display:none">
              <div data-ng-repeat="item in ::allItems">
                <div class="sr-beamline-editor" id="srw-{{ ::item.type }}-editor" data-beamline-item-editor="" data-model-name="{{ ::item.type }}"></div>
              </div>
            </div>
        `,
        controller: function($scope) {
            $scope.allItems = ['aperture', 'camera', 'dipole', 'electronBeam'].map(
                (n) => { return { type: n }; },
            );
        },
    };
});

SIREPO.app.directive('beaconBeamline', function(appState, beamlineService) {
    return {
        restrict: 'A',
        scope: {},
        template: `
<div data-editor-holders=""></div>
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

              <div class="row">
                <form>
                  <div class="col-md-6 col-sm-8 pull-right" data-ng-show="checkIfDirty()">
                    <button data-ng-click="saveBeamlineChanges()" class="btn btn-primary sr-button-save-cancel">Save</button>
                    <button data-ng-click="cancelBeamlineChanges()" class="btn btn-default sr-button-save-cancel">Cancel</button>
                  </div>
                </form>
              </div>


        `,
        controller: function(appState, $scope) {
            const style = {
                aperture: 'warning',
                camera: 'success',
                dipole: 'primary',
                electronBeam: 'default',
            };

            function element(type, x, y, title) {
                return {
                    x: x,
                    y: y,
                    title: title,
                    style: style[type],
                    modelAccess: {
                        modelKey: type,
                        getData: type == 'electronBeam'
                               ? () => appState.models.electronBeam
                               : () => findElementByTitle(title),
                    },
                };
            }

            function findElementByTitle(title, items) {
                for (const el of items || appState.models.beamline.elements) {
                    if (el.title == title) {
                        return el;
                    }
                    if (el.photonBeamline) {
                        const p = findElementByTitle(title, el.photonBeamline);
                        if (p) {
                            return p;
                        }
                    }
                }
            }

            $scope.elements = [
                element('electronBeam', 30, 250, 'Electron Beam'),
                element('dipole', 290, 250, 'B1'),
                element('dipole', 395, 120, 'B2'),
                element('dipole', 540, 120, 'B3'),
                element('dipole', 625, 250, 'B4'),
                element('aperture', 460, 0, 'W1'),
                element('aperture', 645, 120, 'W2'),
                element('aperture', 680, 350, 'W3'),
                element('camera', 660, 0, 'B1 B2'),
                element('camera', 760, 120, 'B2 B3'),
                element('camera', 880, 350, 'B3 B4'),
            ];

            $scope.cancelBeamlineChanges = function() {
                beamlineService.dismissPopup();
                appState.cancelChanges(['beamline', 'electronBeam']);
            };

            $scope.checkIfDirty = function() {
                if (! appState.deepEquals(
                    appState.applicationState().electronBeam,
                    appState.models.electronBeam,
                )) {
                    return true;
                }
                return ! appState.deepEquals(
                    appState.applicationState().beamline,
                    appState.models.beamline,
                );
            };

            $scope.saveBeamlineChanges = function() {
                appState.saveChanges(['beamline', 'electronBeam']);
            };
        },
    };
});

SIREPO.app.directive('variationElements', function() {
    return {
        restrict: 'A',
        scope: {
            model: '=',
            modelName: '=',
            field: '=',
        },
        template: `
            <div class="control-label col-sm-offset-4 col-sm-3" style="text-align: left"><label>Variations</label></div>
            <div class="col-sm-11">
              <div data-ng-repeat="item in items track by item._id">
                <div class="col-sm-12">
                  <hr />
                  <a href class="sr-beacon-ml-label" data-ng-click="toggleItem(item)" style="text-decoration: none">
                    <span class="glyphicon" data-ng-class="{
                      'glyphicon-chevron-up': ! isHidden(item),
                      'glyphicon-chevron-down': isHidden(item) }"></span>
                    <b>{{ item.title }}</b>
                  </a>
                </div>
                <div data-ng-show="! isHidden(item)">
                <div data-ng-repeat="f in item.fields track by $index" class="form-group form-group-sm"
                  data-model-field="f" data-model-name="item._type" data-model-data="item"
                  data-label-size="9" data-field-size="3"></div>
                </div>
              </div>
            </div>
        `,
        controller: function(appState, $scope) {
            $scope.items = [];
            $scope.setDefaultValue = false;
            if (! $scope.model && $scope.field) {
                return;
            }
            if (! $scope.model[$scope.field]) {
                $scope.model[$scope.field] = {};
            }

            function addFields(item) {
                item.hidden = true;
                item.fields = [];
                if (! $scope.model[$scope.field][item._id]) {
                    $scope.model[$scope.field][item._id] = {};
                }
                const m = $scope.model[$scope.field][item._id];
                item.getData = () => m;
                for (const [f, v] of Object.entries(SIREPO.APP_SCHEMA.model[item._type])) {
                    if (v[1] == 'Float') {
                        if (m[f] === undefined) {
                            m[f] = 0;
                            $scope.setDefaultValue = true;
                        }
                        if (m[f]) {
                            item.hidden = false;
                        }
                        item.fields.push(f);
                    }
                }
                $scope.items.push(item);
            }

            function addElement(element) {
                addFields({
                    _type: element._type,
                    _id: element._id,
                    title: appState.viewInfo(element._type).title + ' ' + element.title,
                });
            }

            function init() {
                addFields({
                    _type: 'electronBeam',
                    _id: 0,
                    title: appState.viewInfo('electronBeam').title,
                });
                for (const el of appState.models.beamline.elements) {
                    addElement(el);
                    if (el.photonBeamline) {
                        for (const p of el.photonBeamline) {
                            addElement(p);
                        }
                    }
                }
                if ($scope.setDefaultValue) {
                    appState.saveChanges($scope.modelName);
                }
            }

            $scope.isHidden = (item) => item.hidden;

            $scope.toggleItem = (item) => {
                item.hidden = ! $scope.isHidden(item);
            };

            init();
        },
    };
});
