HTML snippet
============

This is a simple script to create an html snippet extracting the minimal css styles to get the same visual effect or making new style rules computing the css properties.

The program uses selenium to insert a javscript file in the website. It also uses beautifulsoup4 to beautify the html code.

Tested for Chrome.

Installation
------------

**Automatic installation**::

    pip install html_snippet

html_snippet is listed in `PyPI <http://pypi.python.org/pypi/html_snippet/>`_ and can be installed with ``pip`` or ``easy_install``.

**Prerequisites**:
The software only requries selenium. To prettyfiy the output, its necessary beautifulsoup4 and one of its html parsers: html.parser (included by default in Python), html5lib and lxml.


Features
--------
* The content CSS property is handled properly
* Relative to absolute URL for all resources
* Create html snippet extracting only the necessary html styles
* Create html snippet computing the CSS property values
* Include all font-face style rules
* Optionally prettyfy the final output
* Several filters for the approach computing the CSS values
* Ignore SVG element styling
* In the computed CSS approach: Combine same rules, filter CSS properties with default values, possibility to ignore vendor properties

Usage and Example
-----------------
This is the general usage::
    html_snippet [-h] {compute,extract} URL ...

It's necessary to choose between computing all the css values or extracting only the necessary CSS rules from the HTML using the words *compute* or *extract*.

Once the approach has been chosen, the URL for the snippet is provided.

It's also necessary to provide a selector for the interested html element or to provide the path to a javascript file returning that element. In case of providing a selector, It's possible to choose between a CSS selector and a XPATH selector.

By default the script prints the output to stdout. If the **--output** option is provided, the output will be saved to a file.

For example, to convert google website to an snippet computing all the css values.

.. code-block:: bash

    $ html_snippet compute http://www.google.com body > google.html
    
To see all the available options using the extracting CSS rules approach:

.. code-block:: bash

    $ html_snippet extract -h
    
And to see all the available options computing CSS values:

.. code-block:: bash

    $ html_snippet compute -h

License
-------

`Html snippet <https://github.com/aplicacionamedida/html_snippet>`_ use `SATA License <https://github.com/zTrix/sata-license>`_ (Star And Thank Author License), so you have to star this project before using. Read the `LICENSE.txt <https://github.com/aplicacionamedida/html_snippet/LICENSE.txt>`_ carefully.

Reference
---------
 1. The javascript code for computed CSS approach is based on the chrome extension `Snappy Snippet <https://github.com/kdzwinel/SnappySnippet>`_
