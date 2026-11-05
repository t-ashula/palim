from setuptools import find_packages, setup


setup(
    name="palim-wptrunner",
    version="0.0.0",
    packages=find_packages(),
    package_data={"palim_wptrunner": ["testharnessreport.js"]},
    entry_points={
        "wptrunner.products": [
            "palim = palim_wptrunner:get_product",
        ],
    },
)
