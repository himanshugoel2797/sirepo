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


def _superscript(val):
    return re.sub(r"\^2", "\u00B2", val)


def sim_frame(frame_args):
    data, _, allrange, _, _ = srwpy.uti_plot_com.file_load(
        _plot_file(frame_args.frameReport)
    )
    ar2d = numpy.reshape(data, (allrange[8], allrange[5]))
    return PKDict(
        x_range=[allrange[3], allrange[4], allrange[5]],
        y_range=[allrange[6], allrange[7], allrange[8]],
        x_label="Horizontal Position [m]",
        y_label="Vertical Position [m]",
        z_label="Intensity [ph/s/.1%bw/mm²]",
        # TODO(pjm): show camera wavelength
        title="",
        # TODO(pjm): show characteristic
        subtitle="",
        z_matrix=ar2d.tolist(),
    )


def write_parameters(data, run_dir, is_parallel):
    pkio.write_text(
        run_dir.join(template_common.PARAMETERS_PYTHON_FILE),
        _generate_parameters_file(data),
    )


def _generate_parameters_file(data):
    res, v = template_common.generate_parameters_file(data)
    return res + template_common.render_jinja(SIM_TYPE, v)


def _plot_file(report):
    return f"{_PLOTS[report]}_intensity.dat"
