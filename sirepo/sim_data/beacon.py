# -*- coding: utf-8 -*-
"""Beacon simulation data operations

:copyright: Copyright (c) 2024 RadiaSoft LLC.  All Rights Reserved.
:license: http://www.apache.org/licenses/LICENSE-2.0.html
"""
from pykern.pkcollections import PKDict
from pykern.pkdebug import pkdc, pkdlog, pkdp
import sirepo.sim_data


class SimData(sirepo.sim_data.SimDataBase):
    @classmethod
    def fixup_old_data(cls, data, qcall, **kwargs):
        dm = data.models
        cls._init_models(dm, cls.schema().model.keys())
        if "elements" not in dm.beamline:
            dm.beamline.elements = []
        for e in dm.beamline.elements:
            cls.update_model_defaults(e, e._type)
            if "photonBeamline" in e:
                for p in e.photonBeamline:
                    cls.update_model_defaults(p, p._type)

    @classmethod
    def _compute_model(cls, analysis_model, *args, **kwargs):
        if analysis_model == "mlAnimation":
            return analysis_model
        return "animation"

    @classmethod
    def _lib_file_basenames(cls, data):
        res = []
        return res
