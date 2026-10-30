# Memory benchmark

- Schema version: 1
- Domain: `memory`
- Revision: `ed1998351ce64461e78805227dc90a499bcb977a` (dirty)
- Source digest: `9735bf37a54cd02d1603ca7403184d58fd00148047b0049290ae16311a4ca94d`
- Corpus digest: `aff3f2c93071f5be3ef28cb7f0a1656b463daf962d86e0dec3865174dea3b3fb`
- Profile: `text/html`
- Capabilities: `html-parsing`, `dom-tree`
- Environment: `v24.22.1-linux-x86_64-6.18.54.1-microsoft-standard-wsl2`

## Runs

| Run | Mode | Samples | Warmup operations | Measured operations | Node | V8 | Platform | Architecture | Kernel | CPU |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-30T04-54-31Z-3158893-memory-peak-concurrent | peak-concurrent | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |
| 2026-10-30T04-54-31Z-3158893-memory-peak-scaling | peak-scaling | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |
| 2026-10-30T04-54-31Z-3158893-memory-peak-sequential | peak-sequential | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |
| 2026-10-30T04-54-31Z-3158893-memory-peak-single | peak-single | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |
| 2026-10-30T04-54-31Z-3158893-memory-retained-concurrent | retained-concurrent | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |
| 2026-10-30T04-54-31Z-3158893-memory-retained-scaling | retained-scaling | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |
| 2026-10-30T04-54-31Z-3158893-memory-retained-sequential | retained-sequential | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |
| 2026-10-30T04-54-31Z-3158893-memory-retained-single | retained-single | 10 | n/a | n/a | 24.22.1 | 13.6.233.17-node.58 | Linux | x86_64 | 6.18.54.1-microsoft-standard-WSL2 | 12th Gen Intel(R) Core(TM) i7-12700K |

- Incremental Peak RSS noise floor: 1048576 bytes

## peak: concurrent

| Case | Input representation | Output | Input bytes | Nodes | Samples | Noise samples |
| --- | --- | --- | --- | --- | --- | --- |
| document-1 | utf8-string | dom-tree | 128 | 12 | 10 | 10 |
| document-2 | utf8-string | dom-tree | 256 | 24 | 10 | 10 |
| document-4 | utf8-string | dom-tree | 512 | 48 | 10 | 10 |
| document-8 | utf8-string | dom-tree | 1024 | 96 | 10 | 10 |
| document-16 | utf8-string | dom-tree | 2048 | 192 | 10 | 8 |

### Baseline Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | 70787072 | 71122944 | 71307264 | 71307264 | 71101645 | 165823 |
| document-2 | 10 | 70983680 | 71225344 | 71516160 | 71516160 | 71230669 | 176490 |
| document-4 | 10 | 70963200 | 71188480 | 71458816 | 71458816 | 71197901 | 176509 |
| document-8 | 10 | 70635520 | 71278592 | 71462912 | 71462912 | 71231488 | 224954 |
| document-16 | 10 | 71041024 | 71204864 | 71467008 | 71467008 | 71245005 | 125029 |

### Parse Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | 70877184 | 71094272 | 71450624 | 71450624 | 71115571 | 181918 |
| document-2 | 10 | 70795264 | 71196672 | 71454720 | 71454720 | 71155712 | 206367 |
| document-4 | 10 | 70860800 | 71266304 | 71442432 | 71442432 | 71200358 | 196262 |
| document-8 | 10 | 71340032 | 71516160 | 71831552 | 71831552 | 71548928 | 134046 |
| document-16 | 10 | 71585792 | 72171520 | 72540160 | 72540160 | 72148582 | 249501 |

### Incremental Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | -380928 | -24576 | 651264 | 651264 | 13926 | 265180 |
| document-2 | 10 | -393216 | -221184 | 360448 | 360448 | -74957 | 265824 |
| document-4 | 10 | -577536 | -20480 | 475136 | 475136 | 2458 | 328877 |
| document-8 | 10 | -8192 | 311296 | 843776 | 843776 | 317440 | 228924 |
| document-16 | 10 | 307200 | 925696 | 1335296 | 1335296 | 903578 | 257607 |

### Peak amplification (bytes/input byte)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | -2976.000 | -192.000 | 5088.000 | 5088.000 | 108.800 | 2071.723 |
| document-2 | 10 | -1536.000 | -864.000 | 1408.000 | 1408.000 | -292.800 | 1038.375 |
| document-4 | 10 | -1128.000 | -40.000 | 928.000 | 928.000 | 4.800 | 642.338 |
| document-8 | 10 | -8.000 | 304.000 | 824.000 | 824.000 | 310.000 | 223.558 |
| document-16 | 10 | 150.000 | 452.000 | 652.000 | 652.000 | 441.200 | 125.785 |

## peak: scaling

| Case | Input representation | Output | Input bytes | Nodes | Samples | Noise samples |
| --- | --- | --- | --- | --- | --- | --- |
| list-1 | utf8-string | dom-tree | 37 | 8 | 10 | 10 |
| list-16 | utf8-string | dom-tree | 232 | 38 | 10 | 10 |
| list-64 | utf8-string | dom-tree | 856 | 134 | 10 | 10 |

### Baseline Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | 70758400 | 71143424 | 71450624 | 71450624 | 71143424 | 182509 |
| list-16 | 10 | 70828032 | 71045120 | 71471104 | 71471104 | 71099597 | 181597 |
| list-64 | 10 | 71057408 | 71118848 | 71618560 | 71618560 | 71199130 | 170987 |

### Parse Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | 71069696 | 71131136 | 71516160 | 71516160 | 71192576 | 136207 |
| list-16 | 10 | 71036928 | 71118848 | 71442432 | 71442432 | 71201587 | 150182 |
| list-64 | 10 | 71389184 | 71532544 | 72069120 | 72069120 | 71630029 | 189922 |

### Incremental Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | -266240 | 57344 | 540672 | 540672 | 49152 | 211347 |
| list-16 | 10 | -204800 | 81920 | 413696 | 413696 | 101990 | 167169 |
| list-64 | 10 | 122880 | 421888 | 806912 | 806912 | 430899 | 191470 |

### Peak amplification (bytes/input byte)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | -7195.676 | 1549.838 | 14612.757 | 14612.757 | 1328.432 | 5712.088 |
| list-16 | 10 | -882.759 | 353.103 | 1783.172 | 1783.172 | 439.614 | 720.558 |
| list-64 | 10 | 143.551 | 492.860 | 942.654 | 942.654 | 503.387 | 223.680 |

## peak: sequential

| Case | Input representation | Output | Input bytes | Nodes | Samples | Noise samples |
| --- | --- | --- | --- | --- | --- | --- |
| document-16 | utf8-string | dom-tree | 2048 | 192 | 10 | 6 |

### Baseline Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 70828032 | 71163904 | 71442432 | 71442432 | 71178240 | 190323 |

### Parse Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 71872512 | 72228864 | 72568832 | 72568832 | 72211251 | 183646 |

### Incremental Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 700416 | 913408 | 1601536 | 1601536 | 1033011 | 253686 |

### Peak amplification (bytes/input byte)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 342.000 | 446.000 | 782.000 | 782.000 | 504.400 | 123.870 |

### document-16: sequential checkpoints

| Metric | Completed | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline heap | 1 | 10 | 12303016 | 12303384 | 12389456 | 12389456 | 12320418 | 34072 |
| Parse heap | 1 | 10 | 12548096 | 12585568 | 13049520 | 13049520 | 12652188 | 156845 |
| Incremental heap | 1 | 10 | 158640 | 282016 | 746208 | 746208 | 331770 | 171205 |
| Baseline heap | 2 | 10 | 12303656 | 12304024 | 12390096 | 12390096 | 12321058 | 34072 |
| Parse heap | 2 | 10 | 12473600 | 12650744 | 12735016 | 12735016 | 12657107 | 69174 |
| Incremental heap | 2 | 10 | 169648 | 346536 | 431200 | 431200 | 336049 | 78600 |
| Baseline heap | 4 | 10 | 12304144 | 12304512 | 12390584 | 12390584 | 12321546 | 34072 |
| Parse heap | 4 | 10 | 12607248 | 12784392 | 12868664 | 12868664 | 12790755 | 69174 |
| Incremental heap | 4 | 10 | 302808 | 479696 | 564360 | 564360 | 469209 | 78600 |
| Baseline heap | 8 | 10 | 12304632 | 12305000 | 12391072 | 12391072 | 12322034 | 34072 |
| Parse heap | 8 | 10 | 13254176 | 14066768 | 14849560 | 14849560 | 14027611 | 369890 |
| Incremental heap | 8 | 10 | 863104 | 1678712 | 2544344 | 2544344 | 1705577 | 388058 |
| Baseline heap | 16 | 10 | 12305120 | 12305488 | 12391560 | 12391560 | 12322522 | 34072 |
| Parse heap | 16 | 10 | 11652592 | 11966776 | 12699408 | 12699408 | 12156805 | 321264 |
| Incremental heap | 16 | 10 | -652528 | -357464 | 393920 | 393920 | -165718 | 333456 |

## peak: single

| Case | Input representation | Output | Input bytes | Nodes | Samples | Noise samples |
| --- | --- | --- | --- | --- | --- | --- |
| document | utf8-string | dom-tree | 128 | 12 | 10 | 10 |
| table | utf8-string | dom-tree | 161 | 23 | 10 | 10 |

### Baseline Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 70733824 | 71106560 | 71290880 | 71290880 | 71059866 | 184322 |
| table | 10 | 70873088 | 71057408 | 71475200 | 71475200 | 71153254 | 228226 |

### Parse Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 70979584 | 71131136 | 71565312 | 71565312 | 71226573 | 183435 |
| table | 10 | 70799360 | 71069696 | 71442432 | 71442432 | 71117619 | 214617 |

### Incremental Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | -180224 | 204800 | 524288 | 524288 | 166707 | 212669 |
| table | 10 | -651264 | -49152 | 520192 | 520192 | -35635 | 354483 |

### Peak amplification (bytes/input byte)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | -1408.000 | 1600.000 | 4096.000 | 4096.000 | 1302.400 | 1661.478 |
| table | 10 | -4045.118 | -305.292 | 3231.006 | 3231.006 | -221.337 | 2201.757 |

## retained: concurrent

| Case | Input representation | Output | Input bytes | Nodes | Samples | Noise samples |
| --- | --- | --- | --- | --- | --- | --- |
| document-1 | utf8-string | dom-tree | 128 | 12 | 10 | 10 |
| document-2 | utf8-string | dom-tree | 256 | 24 | 10 | 9 |
| document-4 | utf8-string | dom-tree | 512 | 48 | 10 | 10 |
| document-8 | utf8-string | dom-tree | 1024 | 96 | 10 | 8 |
| document-16 | utf8-string | dom-tree | 2048 | 192 | 10 | 5 |

### Baseline Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | 71622656 | 71864320 | 72024064 | 72024064 | 71870464 | 124093 |
| document-2 | 10 | 71704576 | 71761920 | 72859648 | 72859648 | 71911424 | 330323 |
| document-4 | 10 | 71467008 | 71737344 | 71876608 | 71876608 | 71717274 | 134502 |
| document-8 | 10 | 71569408 | 71815168 | 72015872 | 72015872 | 71826637 | 109660 |
| document-16 | 10 | 71528448 | 71847936 | 72163328 | 72163328 | 71858995 | 188042 |

### Parse Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | 71565312 | 71925760 | 72056832 | 72056832 | 71856538 | 160032 |
| document-2 | 10 | 71610368 | 71675904 | 72376320 | 72376320 | 71837286 | 224079 |
| document-4 | 10 | 71446528 | 71610368 | 71979008 | 71979008 | 71677133 | 173257 |
| document-8 | 10 | 72044544 | 72372224 | 73486336 | 73486336 | 72505754 | 400128 |
| document-16 | 10 | 72556544 | 72900608 | 73400320 | 73400320 | 72903066 | 237308 |

### Incremental Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | -360448 | -28672 | 262144 | 262144 | -13926 | 182915 |
| document-2 | 10 | -1183744 | -49152 | 671744 | 671744 | -74138 | 448614 |
| document-4 | 10 | -327680 | -155648 | 311296 | 311296 | -40141 | 223754 |
| document-8 | 10 | 126976 | 544768 | 1671168 | 1671168 | 679117 | 433506 |
| document-16 | 10 | 688128 | 1028096 | 1622016 | 1622016 | 1044070 | 306508 |

### Peak amplification (bytes/input byte)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | -2816.000 | -224.000 | 2048.000 | 2048.000 | -108.800 | 1429.021 |
| document-2 | 10 | -4624.000 | -192.000 | 2624.000 | 2624.000 | -289.600 | 1752.397 |
| document-4 | 10 | -640.000 | -304.000 | 608.000 | 608.000 | -78.400 | 437.020 |
| document-8 | 10 | 124.000 | 532.000 | 1632.000 | 1632.000 | 663.200 | 423.346 |
| document-16 | 10 | 336.000 | 502.000 | 792.000 | 792.000 | 509.800 | 149.662 |

### Retained heap (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | 173424 | 173640 | 173800 | 173800 | 173623 | 121 |
| document-2 | 10 | 219488 | 219632 | 219888 | 219888 | 219699 | 145 |
| document-4 | 10 | 252712 | 253016 | 253208 | 253208 | 253004 | 167 |
| document-8 | 10 | 335864 | 338320 | 339832 | 339832 | 338423 | 1388 |
| document-16 | 10 | 477080 | 477528 | 483032 | 483032 | 478711 | 2043 |

### Retained external memory (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| document-2 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| document-4 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| document-8 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| document-16 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |

### Retained ArrayBuffers (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| document-2 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| document-4 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| document-8 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| document-16 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |

### Released heap delta (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | 158088 | 158304 | 158464 | 158464 | 158287 | 121 |
| document-2 | 10 | 192808 | 192952 | 193208 | 193208 | 193019 | 145 |
| document-4 | 10 | 203344 | 203648 | 203840 | 203840 | 203636 | 167 |
| document-8 | 10 | 203576 | 205280 | 207176 | 207176 | 205358 | 821 |
| document-16 | 10 | 245176 | 245552 | 247512 | 247512 | 245722 | 616 |

### Retained bytes/node

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-1 | 10 | 14452.000 | 14470.000 | 14483.333 | 14483.333 | 14468.600 | 10.108 |
| document-2 | 10 | 9145.333 | 9151.333 | 9162.000 | 9162.000 | 9154.133 | 6.023 |
| document-4 | 10 | 5264.833 | 5271.167 | 5275.167 | 5275.167 | 5270.917 | 3.486 |
| document-8 | 10 | 3498.583 | 3524.167 | 3539.917 | 3539.917 | 3525.242 | 14.459 |
| document-16 | 10 | 2484.792 | 2487.125 | 2515.792 | 2515.792 | 2493.287 | 10.640 |

## retained: scaling

| Case | Input representation | Output | Input bytes | Nodes | Samples | Noise samples |
| --- | --- | --- | --- | --- | --- | --- |
| list-1 | utf8-string | dom-tree | 37 | 8 | 10 | 10 |
| list-16 | utf8-string | dom-tree | 232 | 38 | 10 | 10 |
| list-64 | utf8-string | dom-tree | 856 | 134 | 10 | 10 |

### Baseline Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | 71725056 | 71811072 | 72777728 | 72777728 | 71928218 | 295317 |
| list-16 | 10 | 71454720 | 71729152 | 72019968 | 72019968 | 71779533 | 189305 |
| list-64 | 10 | 71602176 | 71835648 | 72028160 | 72028160 | 71834829 | 154673 |

### Parse Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | 71491584 | 71581696 | 72032256 | 72032256 | 71713178 | 193281 |
| list-16 | 10 | 71536640 | 71786496 | 72146944 | 72146944 | 71827866 | 214197 |
| list-64 | 10 | 71815168 | 72085504 | 72359936 | 72359936 | 72110899 | 185045 |

### Incremental Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | -937984 | -307200 | 303104 | 303104 | -215040 | 343870 |
| list-16 | 10 | -368640 | -36864 | 688128 | 688128 | 48333 | 284705 |
| list-64 | 10 | -212992 | 229376 | 757760 | 757760 | 276070 | 262427 |

### Peak amplification (bytes/input byte)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | -25350.919 | -8302.703 | 8192.000 | 8192.000 | -5811.892 | 9293.787 |
| list-16 | 10 | -1588.966 | -158.897 | 2966.069 | 2966.069 | 208.331 | 1227.175 |
| list-64 | 10 | -248.822 | 267.963 | 885.234 | 885.234 | 322.512 | 306.573 |

### Retained heap (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | 144704 | 144936 | 145024 | 145024 | 144904 | 124 |
| list-16 | 10 | 223008 | 224896 | 225112 | 225112 | 224712 | 582 |
| list-64 | 10 | 307408 | 325744 | 366872 | 366872 | 328050 | 14052 |

### Retained external memory (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| list-16 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| list-64 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |

### Retained ArrayBuffers (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| list-16 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| list-64 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |

### Released heap delta (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | 131600 | 131832 | 131920 | 131920 | 131800 | 124 |
| list-16 | 10 | 186744 | 188632 | 188848 | 188848 | 188448 | 582 |
| list-64 | 10 | 191424 | 191496 | 191640 | 191640 | 191533 | 67 |

### Retained bytes/node

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| list-1 | 10 | 18088.000 | 18117.000 | 18128.000 | 18128.000 | 18113.000 | 15.537 |
| list-16 | 10 | 5868.632 | 5918.316 | 5924.000 | 5924.000 | 5913.474 | 15.323 |
| list-64 | 10 | 2294.090 | 2430.925 | 2737.851 | 2737.851 | 2448.137 | 104.865 |

## retained: sequential

| Case | Input representation | Output | Input bytes | Nodes | Samples | Noise samples |
| --- | --- | --- | --- | --- | --- | --- |
| document-16 | utf8-string | dom-tree | 2048 | 192 | 10 | 10 |

### Baseline Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 71548928 | 71770112 | 72204288 | 72204288 | 71790182 | 169046 |

### Parse Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 71704576 | 72151040 | 72585216 | 72585216 | 72177664 | 314093 |

### Incremental Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 0 | 303104 | 806912 | 806912 | 387482 | 273650 |

### Peak amplification (bytes/input byte)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 0.000 | 148.000 | 394.000 | 394.000 | 189.200 | 133.618 |

### Retained heap (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 237128 | 237256 | 237512 | 237512 | 237287 | 136 |

### Retained external memory (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |

### Retained ArrayBuffers (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |

### Released heap delta (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 237128 | 237256 | 237512 | 237512 | 237287 | 136 |

### Retained bytes/node

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document-16 | 10 | 1235.042 | 1235.708 | 1237.042 | 1237.042 | 1235.871 | 0.707 |

### document-16: sequential checkpoints

| Metric | Completed | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Baseline heap | 1 | 10 | 10087360 | 10087456 | 10087664 | 10087664 | 10087468 | 91 |
| Parse heap | 1 | 10 | 10244264 | 10244360 | 10245448 | 10245448 | 10244510 | 331 |
| Incremental heap | 1 | 10 | 156672 | 156976 | 157992 | 157992 | 157042 | 336 |
| Baseline heap | 2 | 10 | 10096144 | 10096240 | 10096448 | 10096448 | 10096252 | 91 |
| Parse heap | 2 | 10 | 10288880 | 10288952 | 10289240 | 10289240 | 10289010 | 116 |
| Incremental heap | 2 | 10 | 192504 | 192792 | 192952 | 192952 | 192758 | 117 |
| Baseline heap | 4 | 10 | 10103688 | 10103784 | 10103992 | 10103992 | 10103796 | 91 |
| Parse heap | 4 | 10 | 10302640 | 10302712 | 10303000 | 10303000 | 10302770 | 116 |
| Incremental heap | 4 | 10 | 198720 | 199008 | 199168 | 199168 | 198974 | 117 |
| Baseline heap | 8 | 10 | 10103976 | 10104072 | 10104280 | 10104280 | 10104084 | 91 |
| Parse heap | 8 | 10 | 10311800 | 10313976 | 10314312 | 10314312 | 10313638 | 890 |
| Incremental heap | 8 | 10 | 207520 | 209976 | 210192 | 210192 | 209554 | 950 |
| Baseline heap | 16 | 10 | 10104160 | 10104256 | 10104464 | 10104464 | 10104268 | 91 |
| Parse heap | 16 | 10 | 10364152 | 10364368 | 10373032 | 10373032 | 10366877 | 3967 |
| Incremental heap | 16 | 10 | 259920 | 260064 | 268736 | 268736 | 262609 | 3940 |

## retained: single

| Case | Input representation | Output | Input bytes | Nodes | Samples | Noise samples |
| --- | --- | --- | --- | --- | --- | --- |
| document | utf8-string | dom-tree | 128 | 12 | 10 | 10 |
| table | utf8-string | dom-tree | 161 | 23 | 10 | 10 |

### Baseline Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 71524352 | 71778304 | 72138752 | 72138752 | 71835648 | 174261 |
| table | 10 | 71520256 | 71811072 | 71999488 | 71999488 | 71775437 | 150140 |

### Parse Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 71524352 | 71786496 | 71950336 | 71950336 | 71804109 | 113320 |
| table | 10 | 71499776 | 71831552 | 72167424 | 72167424 | 71840154 | 195379 |

### Incremental Peak RSS (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | -393216 | -45056 | 245760 | 245760 | -31539 | 196583 |
| table | 10 | -499712 | 49152 | 536576 | 536576 | 64717 | 278467 |

### Peak amplification (bytes/input byte)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | -3072.000 | -352.000 | 1920.000 | 1920.000 | -246.400 | 1535.803 |
| table | 10 | -3103.801 | 305.292 | 3332.770 | 3332.770 | 401.968 | 1729.606 |

### Retained heap (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 173328 | 173496 | 173728 | 173728 | 173536 | 167 |
| table | 10 | 203960 | 204072 | 204288 | 204288 | 204105 | 92 |

### Retained external memory (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| table | 10 | 0 | 0 | 0 | 0 | 0 | 0 |

### Retained ArrayBuffers (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| table | 10 | 0 | 0 | 0 | 0 | 0 | 0 |

### Released heap delta (bytes)

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 157992 | 158160 | 158392 | 158392 | 158200 | 167 |
| table | 10 | 176600 | 176712 | 176928 | 176928 | 176745 | 92 |

### Retained bytes/node

| Case | Count | Minimum | p50 | p95 | Maximum | Mean | Stddev |
| --- | --- | --- | --- | --- | --- | --- | --- |
| document | 10 | 14444.000 | 14458.000 | 14477.333 | 14477.333 | 14461.333 | 13.952 |
| table | 10 | 8867.826 | 8872.696 | 8882.087 | 8882.087 | 8874.122 | 3.998 |

Incremental Peak RSS values with an absolute value below 1048576 bytes are counted as noise; signed raw values remain in JSON and JSONL.
