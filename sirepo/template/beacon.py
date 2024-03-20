"""Beacon execution template.

:copyright: Copyright (c) 2024 RadiaSoft LLC.  All Rights Reserved.
:license: http://www.apache.org/licenses/LICENSE-2.0.html
"""
from pykern import pkio
from pykern.pkcollections import PKDict
from pykern.pkdebug import pkdc, pkdlog, pkdp
from sirepo.template import template_common
import numpy
import sirepo.sim_data
import srwpy.uti_plot_com


_SIM_DATA, SIM_TYPE, SCHEMA = sirepo.sim_data.template_globals()

_PLOTS = PKDict(
    B1B2Animation="B1_and_B2",
    B2B3Animation="B2_and_B3",
    B3B4Animation="B3_and_B4",
)


def background_percent_complete(report, run_dir, is_running):
    res = PKDict(
        frameCount=0,
        percentComplete=0,
        reports=[],
    )
    for r in _PLOTS:
        f = run_dir.join(_plot_file(r))
        if f.exists():
            res.frameCount += 1
            res.percentComplete = res.frameCount * 100.0 / len(_PLOTS.keys())
            res.reports.append(r)
    return res


def get_data_file(run_dir, model, frame, options):
    return f"{_PLOTS[model]}_intensity.dat"


def python_source_for_model(data, model, qcall, **kwargs):
    return _generate_parameters_file(data)


def sim_frame(frame_args):
    data, _, allrange, _, _ = srwpy.uti_plot_com.file_load(
        _plot_file(frame_args.frameReport)
    )
    ar2d = numpy.reshape(data, (allrange[8], allrange[5]))
    c = _camera_for_report(frame_args.sim_in, frame_args.frameReport)
    return PKDict(
        x_range=[allrange[3], allrange[4], allrange[5]],
        y_range=[allrange[6], allrange[7], allrange[8]],
        x_label="Horizontal Position [m]",
        y_label="Vertical Position [m]",
        z_label="Intensity [ph/s/.1%bw/mm²]",
        title=f"Wavelength {c.wavelength:.2f}nm",
        subtitle=template_common.enum_text(
            SCHEMA,
            "Characteristic",
            frame_args.sim_in.models.simulationSettings.characteristic,
        ),
        z_matrix=ar2d.tolist(),
    )


def write_parameters(data, run_dir, is_parallel):
    pkio.write_text(
        run_dir.join(template_common.PARAMETERS_PYTHON_FILE),
        _generate_parameters_file(data),
    )


def _camera_for_report(data, report):
    idx = list(_PLOTS.keys()).index(report)
    count = 0
    for el in data.models.beamline.elements:
        if "photonBeamline" in el:
            for o in el.photonBeamline:
                if o._type == "camera":
                    if count == idx:
                        return o
                    count += 1
    raise AssertionError(f"Camera not found for index: {idx}")


def _generate_parameters_file(data):
    res, v = template_common.generate_parameters_file(data)
    return res + template_common.render_jinja(SIM_TYPE, v)


def _plot_file(report):
    return f"{_PLOTS[report]}_intensity.dat"


def _superscript(val):
    return re.sub(r"\^2", "\u00B2", val)
