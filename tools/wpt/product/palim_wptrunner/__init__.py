import json
import os
import subprocess

from wptrunner.browsers.base import NullBrowser, get_timeout_multiplier
from wptrunner.executors import executor_kwargs as base_executor_kwargs
from wptrunner.executors.base import TestharnessExecutor
from wptrunner.products import Product


class PalimExecutor(TestharnessExecutor):
    supports_testdriver = True
    supports_jsshell = True

    def __init__(
        self,
        logger,
        browser,
        server_config,
        timeout_multiplier=1,
        debug_info=None,
        runner_path=None,
        **kwargs,
    ):
        super().__init__(
            logger,
            browser,
            server_config,
            timeout_multiplier=timeout_multiplier,
            debug_info=debug_info,
            **kwargs,
        )
        self.runner_path = runner_path

    def do_test(self, test):
        url = self.test_url(test)
        timeout = test.timeout * self.timeout_multiplier
        try:
            completed = subprocess.run(
                ["node", self.runner_path, url],
                capture_output=True,
                check=False,
                env={**os.environ, "NODE_TLS_REJECT_UNAUTHORIZED": "0"},
                text=True,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired as error:
            message = error.stderr.strip() if error.stderr else ""
            return test.make_result(
                "TIMEOUT",
                message or "palim execution timed out",
            ), []

        if completed.returncode != 0:
            message = completed.stderr.strip() or "palim execution failed"
            return test.make_result("ERROR", message), []

        prefix = "ALERT: RESULT: "
        result_line = next(
            (
                line[len(prefix):]
                for line in completed.stdout.splitlines()
                if line.startswith(prefix)
            ),
            None,
        )
        if result_line is None:
            return test.make_result("ERROR", "palim returned no WPT result"), []
        try:
            result = json.loads(result_line)
        except json.JSONDecodeError as error:
            return test.make_result("ERROR", str(error)), []
        return self.convert_result(test, result)

    def wait(self):
        return


def check_args(**kwargs):
    runner_path = os.environ.get("PALIM_WPT_NODE_RUNNER")
    if not runner_path or not os.path.isfile(runner_path):
        raise ValueError("PALIM_WPT_NODE_RUNNER must name the Node runner")


def browser_kwargs(logger, test_type, run_info_data, **kwargs):
    return {}


def executor_kwargs(
    logger,
    test_type,
    test_environment,
    run_info_data,
    **kwargs,
):
    result = base_executor_kwargs(
        test_type,
        test_environment,
        run_info_data,
        **kwargs,
    )
    result["runner_path"] = os.environ["PALIM_WPT_NODE_RUNNER"]
    return result


def env_extras(**kwargs):
    return []


def get_product():
    return Product(
        name="palim",
        browser_classes={None: NullBrowser},
        check_args=check_args,
        get_browser_kwargs=browser_kwargs,
        get_executor_kwargs=executor_kwargs,
        env_options={
            "server_host": "127.0.0.1",
            "bind_address": True,
            "testharnessreport": "testharnessreport-servo.js",
        },
        get_env_extras=env_extras,
        get_timeout_multiplier=get_timeout_multiplier,
        executor_classes={"testharness": PalimExecutor},
    )
