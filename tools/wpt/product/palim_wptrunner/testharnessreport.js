(function () {
  var props = {
    output: Number("%(output)d"),
    timeout_multiplier: Number("%(timeout_multiplier)s"),
    explicit_timeout: "%(explicit_timeout)s" === "true",
    debug: "%(debug)s" === "true",
  };
  var start_pathname = location.pathname;
  var start_search = location.search;
  var start_hash = location.hash;
  setup(props);

  add_completion_callback(function (tests, harness_status) {
    var id =
      decodeURIComponent(start_pathname) +
      decodeURIComponent(start_search) +
      decodeURIComponent(start_hash);
    console.log(
      "ALERT: RESULT: " +
        JSON.stringify([
          id,
          harness_status.status,
          harness_status.message,
          harness_status.stack,
          tests.map(function (test) {
            return [test.name, test.status, test.message, test.stack];
          }),
        ]),
    );
  });
})();
