"""test sirepo.cron

:copyright: Copyright (c) 2025 RadiaSoft LLC.  All Rights Reserved.
:license: http://www.apache.org/licenses/LICENSE-2.0.html
"""


def test_e2e():
    import asyncio
    from pykern.pkcollections import PKDict
    from pykern import pkconfig, pkunit, pkconst, pkio, util

    async def _pre_start(params):
        from sirepo import srtime

        params.calls += 1
        srtime.adjust_time(days=1)
        if params.calls >= 2:
            asyncio.get_running_loop().stop()

    p = str(util.unbound_localhost_tcp_port(10000, 30000))
    pkconfig.reset_state_for_testing(
        PKDict(
            SIREPO_PKCLI_SERVICE_IP=pkconst.LOCALHOST_IP,
            SIREPO_PKCLI_SERVICE_PORT=p,
            SIREPO_PKCLI_SERVICE_TORNADO_PRIMARY_PORT=p,
            SIREPO_SRDB_ROOT=str(pkio.mkdir_parent(pkunit.work_dir().join("db"))),
        )
    )

    from sirepo import cron
    from sirepo.pkcli import service

    p = PKDict(calls=0)
    cron.CronTask(24 * 60 * 60, _pre_start, p)
    service.server()
    pkunit.pkeq(2, p.calls)
