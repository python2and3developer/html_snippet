import time
import os
import sys

PY3 = sys.version_info > (3, 0)

if PY3:
    import urllib.parse as urlparse
    import urllib.request as urllib
else:
    import urlparse, urllib
    

def path2url(path):
    return urlparse.urljoin('file:', urllib.pathname2url(path))


def local_to_absolute_path(path):
    return os.path.abspath(os.path.join(os.path.dirname(__file__), path))

COMPUTE_CSS = 0
EXTRACT_CSS = 1

class wait_for_page_load(object):

    def __init__(self, driver, timeout=13, minimum_wait=1):
        self.driver = driver

        self.timeout = timeout
        self.minimum_wait = minimum_wait
    
    def __enter__(self):
        self.old_page = self.driver.find_element_by_tag_name('html')
        
        self.max_time_living = time.time() + self.timeout
        
    def page_has_loaded(self):
        new_page = self.driver.find_element_by_tag_name('html')
        return new_page.id != self.old_page.id

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type: return False
        
        time.sleep(self.minimum_wait)
        self.wait_for(self.page_has_loaded, self.max_time_living)
        
    
    @staticmethod
    def wait_for(somepredicate, max_time_living, period=0.25):

        while time.time() < max_time_living:
            if somepredicate(): 
                break
            time.sleep(period)

def create_snippet(approach, url, screen_size=None, driver=None, browser="chrome", options=None, output=None, prettyfy = True, css_selector=None, xpath_selector=None, path_to_js_script=None, xvfb=False, prettyfy_parser="html.parser", wait=None):
    if approach == COMPUTE_CSS:
        filename_of_snippet_script = "create_snippet_using_computed_css.js"
    elif approach == EXTRACT_CSS:
        filename_of_snippet_script = "create_snippet_extracting_css_styles.js"
    else:
        raise Exception("Unknown approach")

    path_to_snippet_script = os.path.abspath(os.path.join(os.path.dirname(__file__), filename_of_snippet_script))

    if xvfb:
        try:
            from xvfbwrapper import Xvfb
        except ImportError:
            raise Exception("xvfbwrapper is required. Install the module with this command: pip install xvfbwrapper")

        vdisplay = Xvfb()
        vdisplay.start()

    if driver is None:
        from selenium import webdriver
        if browser == "chrome":
            driver = webdriver.Chrome()
        elif browser == "firefox":
            driver = webdriver.Firefox()
        elif browser == "edge":
            driver = webdriver.Edge()
        elif browser == "phantomjs":
            driver = webdriver.PhantomJS() 
        else:
            raise Exception("Browser not valid: %s"%browser)

    if screen_size is None:
        driver.maximize_window()
    else:
        driver.set_window_size(*screen_size)

    if approach == COMPUTE_CSS and options is not None and options.get("removeDefaultCssValues", False):
        path_to_empty_html = local_to_absolute_path("empty.html")
        empty_url = path2url(path_to_empty_html)

        with wait_for_page_load(driver):
            driver.get(empty_url)

        path_to_default_values_script = local_to_absolute_path("default_browser_css_values.js")
        with open(path_to_default_values_script, "r") as f:
            default_browser_css_values_js = f.read()
        
        default_browser_css_values_js += "\nreturn default_browser_css_values()"
        
        default_values = driver.execute_script(default_browser_css_values_js)
        options["defaultValues"] = default_values

    root = None
    
    with wait_for_page_load(driver):
        driver.get(url)
    
    if wait is not None:
        time.sleep(float(wait))

    if path_to_js_script is not None:
        from selenium.webdriver.remote.webelement import WebElement

        with open(path_to_js_script) as f:
            js_script = f.read()
        root = driver.execute_script(js_script)

        if not isinstance(root, WebElement):
            root = None

    if root is None:
        if css_selector is not None:
            root = driver.find_element_by_css_selector(css_selector)
        elif xpath_selector is not None:
            root = driver.find_element_by_xpath(xpath_selector)
        else:
            raise Exception("No selector indicated")
    
    with open(path_to_snippet_script, "r") as f:
        snippet_script = f.read()

    snippet_script += "\nreturn createSnippet(arguments[0], arguments[1])"

    snippet = driver.execute_script(snippet_script, root, options)

    if prettyfy:
        from bs4 import BeautifulSoup
        snippet = BeautifulSoup(snippet, prettyfy_parser).prettify(encoding='utf-8')
    else:
        snippet = snippet.encode("utf-8")
    
    if xvfb:
        vdisplay.stop()

    return snippet

def create_snippet_using_computed_css(url, driver=None, browser="chrome", prettyfy=True, css_selector=None, xpath_selector=None, path_to_js_script=None, xvfb=False, ancestors=True, remove_default_css_values=True, combine_to_shorthand_properties=False, vendor_properties=False, combine_rules=True, prettyfy_parser="html.parser", wait=None):

    options = {
        "ancestors":ancestors, 
        "removeDefaultCssValues": remove_default_css_values,
        "combineToShorthandProperties": combine_to_shorthand_properties, 
        "vendorProperties": vendor_properties, 
        "combineRules": combine_rules
    }

    return create_snippet(COMPUTE_CSS, url, driver=driver, browser=browser, options=options, prettyfy=prettyfy, prettyfy_parser=prettyfy_parser, css_selector=css_selector, xpath_selector=xpath_selector, path_to_js_script=path_to_js_script, xvfb=xvfb, wait=wait)

def create_snippet_extracting_css_styles(url, driver=None, browser="chrome", prettyfy=True, css_selector=None, xpath_selector=None, path_to_js_script=None, xvfb=False, include_css_of_ancestors=False, prettyfy_parser="html.parser", wait=None):   
    options = {
        "includeCssOfAncestors": include_css_of_ancestors
    }
    
    return create_snippet(EXTRACT_CSS, url, driver=driver, browser=browser, options=options, prettyfy = prettyfy, prettyfy_parser=prettyfy_parser, css_selector=css_selector, xpath_selector=xpath_selector, path_to_js_script=path_to_js_script, xvfb=xvfb, wait=wait)

def main():
    import argparse
    
    list_of_browsers = ["chrome", "phantomjs", "firefox", "edge"]
    html_parsers = ["html5lib", "lxml", "html.parser"]

    parser = argparse.ArgumentParser(description='Create snippet of url using a selector')
    subparsers = parser.add_subparsers(help='Method to create snippet')
    parser1 = subparsers.add_parser('compute', help='Generate snippet computing CSS style properties')
    parser1.set_defaults(computed_css=True)
    
    parser1.add_argument('url', action="store")
    parser1.add_argument('css_selector', nargs='?', action="store", help="CSS selector")
    parser1.add_argument('--css-selector', dest="css_selector", action="store", help="CSS selector")
    parser1.add_argument('--xpath', '--xpath-selector', dest="xpath_selector", action="store", help="XPATH selector")
    parser1.add_argument('--js-script', dest="path_to_js_script", action="store", help="Path to javascript file. The script will be executed when the website is loaded. If it returns a webelement, this returned element will be root element used to create the snippet")
    parser1.add_argument('--xvfb', dest="xvfb", action="store_true", help="Use X virtual framebuffer (Only on Linux OS using X11 display server)")
    parser1.add_argument('--wait', dest="wait", action="store", help="Number of seconds to wait")
    parser1.add_argument('-b', '--browser', dest="browser", choices=list_of_browsers, default="chrome", help="Automated browser. Possible options are: %s"%",".join(list_of_browsers), metavar='')
    parser1.add_argument('-p', '--prettify', dest="prettyfy", action="store_true", help="Prettify html")
    
    parser1.add_argument('--prettify-parser', dest="prettyfy_parser", choices=html_parsers, action="store", default="html.parser", help="Beautifulsoup parsers")
    parser1.add_argument('-o', '--output', dest="output", action="store", default=None, help="Output file. Default: stdout")
    parser1.add_argument('--ancestors', dest="ancestors", action="store_true", help="Include ancestors")
    parser1.add_argument('--default-values', dest="remove_default_css_values", action="store_false", help="Don't remove default property values")
    parser1.add_argument('--no-combine-properties', dest="combine_to_shorthand_properties", action="store_false", help="Dont remove all non-shorthand properties (where possible) resulting in more concise and readable code.")
    parser1.add_argument('--vendor-properties', dest="vendor_properties", action="store_true", help="Don't remove vendor properties")
    parser1.add_argument('--no-combine-rules', dest="combine_rules", action="store_false", help="Combines together rules with exact same properties and values")

    parser2 = subparsers.add_parser('extract', help='Extract CSS style rules from source')
    parser2.set_defaults(computed_css=False)

    parser2.add_argument('url', action="store")
    parser2.add_argument('css_selector', nargs='?', action="store", help="CSS selector")
    parser2.add_argument('--css-selector', dest="css_selector", action="store", help="CSS selector")
    parser2.add_argument('--xpath', '--xpath-selector', dest="xpath_selector", action="store", help="XPATH selector")
    parser2.add_argument('--js-script', dest="path_to_js_script", action="store", help="Path to javascript file. The script will be executed when the website is loaded. If it returns a webelement, this returned element will be root")
    parser2.add_argument('--xvfb', dest="xvfb", action="store_true", help="Use X virtual framebuffer (Only on Linux OS using X11 display server)")
    parser2.add_argument('--wait', dest="wait", action="store", help="Number of seconds to wait")
    parser2.add_argument('-b', '--browser', dest="browser", choices=list_of_browsers, default="chrome", help="Automated browser. Possible options are: %s"%",".join(list_of_browsers), metavar='')
    parser2.add_argument('-p', '--prettify', dest="prettyfy", action="store_true", help="Prettify html")
    parser2.add_argument('--prettify-parser', dest="prettyfy_parser", choices=html_parsers, action="store", default="html.parser", help="Beautifulsoup parsers")
    parser2.add_argument('-o', '--output', dest="output", action="store", default=None, help="Output file. Default: stdout")
    parser2.add_argument('--include-css-of-ancestors', dest="include_css_of_ancestors", action="store_true", help="Include CSS of ancestors")

    results = parser.parse_args()

    if results.computed_css:
        snippet = create_snippet_using_computed_css(
            results.url, 
            browser=results.browser,
            prettyfy=results.prettyfy,
            prettyfy_parser=results.prettyfy_parser,
            wait=results.wait,
            css_selector=results.css_selector, 
            xpath_selector=results.xpath_selector, 
            path_to_js_script=results.path_to_js_script, 
            xvfb=results.xvfb,
            ancestors=results.ancestors, 
            remove_default_css_values=results.remove_default_css_values, 
            combine_to_shorthand_properties=results.combine_to_shorthand_properties, 
            vendor_properties=results.vendor_properties, 
            combine_rules=results.combine_rules)
    else:
        snippet = create_snippet_extracting_css_styles(
            results.url, 
            browser=results.browser,
            prettyfy=results.prettyfy, 
            prettyfy_parser=results.prettyfy_parser,
            wait=results.wait,
            css_selector=results.css_selector, 
            xpath_selector=results.xpath_selector, 
            path_to_js_script=results.path_to_js_script,
            xvfb=results.xvfb,
            include_css_of_ancestors=results.include_css_of_ancestors)

    if PY3:
        snippet = snippet.decode('utf-8')

    output = results.output

    if output is None:
        sys.stdout.write(snippet)
    else:
        with open(output, "w") as f:
            f.write(snippet)

if __name__ == "__main__":
    main()
