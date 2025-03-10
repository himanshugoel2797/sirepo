"""periodic callbacks

:copyright: Copyright (c) 2025 RadiaSoft LLC.  All Rights Reserved.
:license: http://www.apache.org/licenses/LICENSE-2.0.html
"""

from pykern.pkcollections import PKDict
from pykern.pkdebug import pkdc, pkdlog, pkdp
import asyncio
import inspect
import sirepo.srtime

_loop = None

_MIN_PERIOD = 60


class CronTask:
    """Creates a task that runs a coroutine function periodically

    ``coro_func`` must `yield_to_event_loop` to release processor

    For global tasks, not associated with `quest`.

    Args:
        period (int or float): how often to run job, must be greater than 60
        coro_func (func): async function
        params (object): passed verbatim to coro_func
    """

    _loop = None

    _to_start = set()

    def __init__(self, period, coro_func, params):
        if _loop is None:
            raise AssertionError("not yet initialized")
        if period < _MIN_PERIOD:
            raise AssertionError(f"too frequent period={period} min={_MIN_PERIOD}")
        if not inspect.iscoroutinefunction(coro_func):
            raise AssertionError(f"not coroutine function={coro_func}")
        self._period = float(period)
        self._coro_func = coro_func
        self._params = params
        self._destroyed = False
        if self._loop is None:
            self._to_start.add(self)
        else:
            self._start()

    def destroy(self):
        """Stop the polling process"""
        if self._destroyed:
            return
        self._destroyed = True
        self._instances.remove(self)

    @classmethod
    def init_by_uri_router(cls, loop):
        """Allow timer services to be started

        Args:


        """
        if cls._loop is not None:
            raise AssertionError("already initialized")
        cls._loop = loop if loop else False
        if cls._loop:
            for s in cls._to_start:
                s._start()
        cls._to_start.clear()

    async def _poll(self):
        t = 0
        while not self._destroyed:
            t = sirepo.srtime.utc_now_as_float()
            await self._coro_func(self._params)
            if self._destroyed:
                break
            # Sleep exactly
            asyncio.sleep((sirepo.srtime.utc_now_as_float() - t) + self._period)
