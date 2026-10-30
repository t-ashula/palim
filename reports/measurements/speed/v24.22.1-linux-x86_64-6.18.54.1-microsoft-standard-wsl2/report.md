# Speed benchmark

- Schema version: 1
- Domain: `speed`
- Revision: `ed1998351ce64461e78805227dc90a499bcb977a` (dirty)
- Source digest: `9735bf37a54cd02d1603ca7403184d58fd00148047b0049290ae16311a4ca94d`
- Corpus digest: `aff3f2c93071f5be3ef28cb7f0a1656b463daf962d86e0dec3865174dea3b3fb`
- Profile: `text/html`
- Capabilities: `html-parsing`, `dom-tree`
- Environment: `v24.22.1-linux-x86_64-6.18.54.1-microsoft-standard-wsl2`

## Runs

| Run | Mode | Samples | Warmup operations | Measured operations | Node | V8 | Platform | Architecture | Kernel | CPU |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-30T04-54-31Z-3158893-speed-cold-start | cold-start | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |
| 2026-10-30T04-54-31Z-3158893-speed-end-to-end | end-to-end | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |
| 2026-10-30T04-54-31Z-3158893-speed-warm | warm | 10 | 16 | 64 | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |

## cold-start

| Case | Input representation | Input bytes | Samples | Operations/sample |
| --- | --- | --- | --- | --- |
| document | utf8-string | 128 | 10 | 1 |
| table | utf8-string | 161 | 10 | 1 |
| list-1 | utf8-string | 37 | 10 | 1 |
| list-16 | utf8-string | 232 | 10 | 1 |
| list-64 | utf8-string | 856 | 10 | 1 |

### cold-start: latency (μs/op)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 64864.853 | 68146.002 | 76289.826 | 76289.826 | 69077.357 | 3370.855 |
| table | 10 | 65123.248 | 70550.957 | 77706.364 | 77706.364 | 71377.437 | 3653.514 |
| list-1 | 10 | 66638.673 | 70424.432 | 76629.420 | 76629.420 | 70291.236 | 2581.281 |
| list-16 | 10 | 64525.864 | 68466.312 | 80988.335 | 80988.335 | 69693.400 | 4210.131 |
| list-64 | 10 | 66044.425 | 69260.031 | 80362.571 | 80362.571 | 71015.077 | 4545.431 |

### cold-start: throughput (bytes/s)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 1678 | 1859 | 1973 | 1973 | 1857 | 87 |
| table | 10 | 2072 | 2235 | 2472 | 2472 | 2261 | 115 |
| list-1 | 10 | 483 | 525 | 555 | 555 | 527 | 19 |
| list-16 | 10 | 2865 | 3370 | 3595 | 3595 | 3340 | 184 |
| list-64 | 10 | 10652 | 12273 | 12961 | 12961 | 12101 | 732 |

## warm

| Case | Input representation | Input bytes | Samples | Operations/sample |
| --- | --- | --- | --- | --- |
| document | utf8-string | 128 | 10 | 64 |
| table | utf8-string | 161 | 10 | 64 |
| list-1 | utf8-string | 37 | 10 | 64 |
| list-16 | utf8-string | 232 | 10 | 64 |
| list-64 | utf8-string | 856 | 10 | 64 |

### warm: latency (μs/op)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 62.966 | 66.185 | 76.093 | 76.093 | 67.820 | 3.710 |
| table | 10 | 70.566 | 74.823 | 92.086 | 92.086 | 76.896 | 6.032 |
| list-1 | 10 | 32.959 | 34.857 | 94.344 | 94.344 | 41.666 | 17.711 |
| list-16 | 10 | 106.228 | 109.665 | 114.622 | 114.622 | 110.020 | 2.474 |
| list-64 | 10 | 235.243 | 240.215 | 246.792 | 246.792 | 240.770 | 4.014 |

### warm: throughput (bytes/s)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 1682141 | 1874108 | 2032829 | 2032829 | 1892807 | 99735 |
| table | 10 | 1748365 | 2146906 | 2281557 | 2281557 | 2105499 | 150396 |
| list-1 | 10 | 392183 | 1026816 | 1122591 | 1122591 | 973150 | 203850 |
| list-16 | 10 | 2024044 | 2106666 | 2183977 | 2183977 | 2109764 | 47282 |
| list-64 | 10 | 3468504 | 3542955 | 3638792 | 3638792 | 3556248 | 59344 |

## end-to-end

| Case | Input representation | Input bytes | Samples | Operations/sample |
| --- | --- | --- | --- | --- |
| document | utf8-bytes | 128 | 10 | 1 |
| table | utf8-bytes | 161 | 10 | 1 |
| list-1 | utf8-bytes | 37 | 10 | 1 |
| list-16 | utf8-bytes | 232 | 10 | 1 |
| list-64 | utf8-bytes | 856 | 10 | 1 |

### end-to-end: latency (μs/op)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 1880.710 | 1971.037 | 3217.950 | 3217.950 | 2103.208 | 376.006 |
| table | 10 | 1962.585 | 1993.470 | 2885.246 | 2885.246 | 2090.929 | 266.962 |
| list-1 | 10 | 1538.413 | 1659.899 | 2503.215 | 2503.215 | 1786.030 | 287.188 |
| list-16 | 10 | 1893.256 | 1992.770 | 2199.575 | 2199.575 | 2024.452 | 77.843 |
| list-64 | 10 | 2604.850 | 2697.059 | 2906.093 | 2906.093 | 2706.005 | 84.521 |

### end-to-end: throughput (bytes/s)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 39777 | 64200 | 68059 | 68059 | 62233 | 7717 |
| table | 10 | 55801 | 80656 | 82035 | 82035 | 77956 | 7508 |
| list-1 | 10 | 14781 | 22054 | 24051 | 24051 | 21163 | 2802 |
| list-16 | 10 | 105475 | 115752 | 122540 | 122540 | 114765 | 4318 |
| list-64 | 10 | 294554 | 317372 | 328618 | 328618 | 316633 | 9581 |

## Unsupported

- `streaming`: DOMParser does not expose a streaming input API.
