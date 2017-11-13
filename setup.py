from setuptools import setup

setup(
    name='html-snippet',
    version='0.2',
    description="Utility to extract snippets from webpages",
    long_description="This code extracts snippets using a CSS or XPATH selector or evaluating a javascript code. The snippet could be generated using two different approaches: Extracting only the necessary CSS selector or computing the CSS values for every element",
    author='Miguel Martinez Lopez',
    author_email="aplicacionamedida@gmail.com",
    url="https://github.com/aplicacionamedida/html_snippet",
    license='LICENSE.txt',
    packages=['html_snippet'],
    install_requires= "selenium",
    extras_require = {
        'prettify' : ['html5lib'],
    },
    entry_points={
        'console_scripts': [
            'html_snippet = html_snippet:main'
        ]
    },
    keywords="html css snippet",
    classifiers = [
        'Development Status :: 5 - Production/Stable',
        'Environment :: Console',
        'Intended Audience :: Developers',
        'Operating System :: POSIX',
        'Operating System :: MacOS :: MacOS X',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.6',
        'Programming Language :: Python :: 2.7',
        'Topic :: Software Development',
        'Topic :: System',
        'Topic :: Terminals',
        'Topic :: Utilities',
    ],
    include_package_data=True)
