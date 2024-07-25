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
    b1b2Animation="B1_and_B2",
    b2b3Animation="B2_and_B3",
    b3b4Animation="B3_and_B4",
)
_RS_OPT_PARAMETERS_PYTHON_FILE = "rsopt.py"
_RS_OPT_YML_FILE = "rsopt.yml"


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
        title=f"Wavelength {c.wavelength:.0f}nm",
        subtitle=template_common.enum_text(
            SCHEMA,
            "Characteristic",
            frame_args.sim_in.models.simulationSettings.characteristic,
        ),
        z_matrix=ar2d.tolist(),
    )


def write_parameters(data, run_dir, is_parallel):
    p = _generate_parameters_file(data)
    if _is_ml_animation(data):
        _write_rsopt_files(data, p, run_dir)
        return
    pkio.write_text(
        run_dir.join(template_common.PARAMETERS_PYTHON_FILE),
        p,
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


def _generate_dipoles(data):
    res = '\n"magnets": {'
    prev = PKDict()
    prevname = None
    for el in data.models.beamline.elements:
        if el._type == "dipole":
            res += f"""
    "{el.title}": {{
        "bend_angle": {el.angle},
        "Lbend": {el.length},
        "Ledge": {el.edge},
    }},
"""
            if prevname:
                prev[el.title] = prevname
            prevname = el.title
    res += "},\n"
    count = 0
    for el in data.models.beamline.elements:
        if el._type == "dipole":
            if "photonBeamline" in el and len(el.photonBeamline):
                for el2 in el.photonBeamline:
                    if el2._type == "camera":
                        c = el2
                    elif el2._type == "aperture":
                        w = el2
                assert c
                n = _PLOTS[list(_PLOTS.keys())[count]]
                count += 1
                res += f"""
"{n}": {{
    "magnets": ["{prev[el.title]}", "{el.title}"],
    "first_edge_to_window": {el.position + w.position},
    "second_edge_to_window": {w.position},
    "p": ({c.wavelength * 1e-9}, {c.wavelength * 1e-9}),
    "windowToLen": {c.position},
    "windowApp": {w.size},
    "Ne": 1,
    "windowAppX": {w.horizontalOffset},
    "windowAppY": {w.verticalOffset},
    "appCam": {c.apertureSize},
    "appCamX": {c.horizontalOffset},
    "appCamY": {c.verticalOffset},
    "camFocalLength": {c.focalLength},
}},
"""
    return res


def _generate_rsopt_method(data):
    return """
def rsopt_run(*args, **kwargs):
    for key, value in kwargs.items():
        v = params
        path = list(key.split("."))
        k = path.pop()
        for p in path:
            v = v[p]
        v[k] = value
    main()
"""


def _generate_parameters_file(data):
    res, v = template_common.generate_parameters_file(data)
    v.dipoleList = _generate_dipoles(data)
    if _is_ml_animation(data):
        v.rsoptRun = _generate_rsopt_method(data)
    return res + template_common.render_jinja(SIM_TYPE, v)


def _generate_rsopt_yml(data):
    p = data.models.mlParameters
    # TODO(pjm): parameterize values from variations
    return f"""
codes:
  - python:
      settings:
      parameters:
        B1_and_B2.windowToLen:
          min: 0.43
          max: 0.45
          samples: {p.numSamples}
          start: 0.44
      setup:
        input_file: {_RS_OPT_PARAMETERS_PYTHON_FILE}
        function: rsopt_run
        execution_type: parallel

options:
  software: mesh_scan
  output_file: rsoptOut
  sim_dirs_make: True
"""


def _plot_file(report):
    return f"{_PLOTS[report]}_intensity.dat"


def _is_ml_animation(data):
    return data.get("report", "") == "mlAnimation"


def _superscript(val):
    return re.sub(r"\^2", "\u00B2", val)


def _write_rsopt_files(data, parameters_file, run_dir):
    pkio.write_text(
        _RS_OPT_PARAMETERS_PYTHON_FILE,
        parameters_file,
    )
    pkio.write_text(
        _RS_OPT_YML_FILE,
        _generate_rsopt_yml(data),
    )
    pkio.write_text(
        run_dir.join(template_common.PARAMETERS_PYTHON_FILE),
        f"""
import pykern.pksubprocess

pykern.pksubprocess.check_call_with_signals(
    ["rsopt", "sample", "configuration", "{_RS_OPT_YML_FILE}"],
)
        """,
    )
