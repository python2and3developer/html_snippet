//https://github.com/wooorm/html-tag-names
var TAG_NAMES = ['A', 'ABBR', 'ACRONYM', 'ADDRESS', 'APPLET', 'ARTICLE', 'ASIDE', 'AUDIO', 'B', 'BIG', 'BLOCKQUOTE', 'BODY', 'BUTTON', 'CANVAS', 'CAPTION', 'CENTER', 'CITE', 'CODE', 'DD', 'DEL', 'DETAILS', 'DFN', 'DIV', 'DL', 'DT', 'EM', 'EMBED', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER', 'HGROUP', 'HR', 'HTML', 'I', 'IFRAME', 'IMG', 'INPUT', 'INS', 'KBD', 'LABEL', 'LEGEND', 'LI', 'MAIN', 'MARK', 'MENU', 'NAV', 'OBJECT', 'OL', 'OPTGROUP', 'OUTPUT', 'P', 'PRE', 'PROGRESS', 'Q', 'RUBY', 'S', 'SAMP', 'SECTION', 'SELECT', 'SMALL', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUMMARY', 'SUP', 'TABLE', 'TBODY', 'TD', 'TEXTAREA', 'TFOOT', 'TH', 'THEAD', 'TIME', 'TR', 'TT', 'U', 'UL', 'VAR', 'VIDEO'];
var SHORTHAND_PROPERTIES = ["animation", "border", "border-bottom", "border-left", "border-top", "border-right", "border-radius", "flex", "flex-flow", "font", "grid-area", "grid-column", "grid-row", "list-style", "margin", "marker", "outline", "overflow", "padding", "text-decoration", "transition", "-webkit-border-after", "-webkit-border-before", "-webkit-border-end", "-webkit-border-start", "-webkit-columns", "-webkit-column-rule", "-webkit-margin-collapse", "-webkit-mask", "-webkit-mask-position", "-webkit-mask-repeat", "-webkit-text-emphasis", "-webkit-text-stroke", "-webkit-transition", "-webkit-transform-origin"]

function camelCaseCSS(css_property) {
    // NOTE :: IE8's "styleFloat" is intentionally not supported
    if (css_property === "float") return "cssFloat";
    
    /*
        Microsoft vendor-prefixed properties are camel cased
        differently than other browsers:
        
        -webkit-something => WebkitSomething
        -moz-something => MozSomething
        -ms-something => msSomething
    */
    if (css_property.indexOf("-ms-") === 0)
    {
        css_property = css_property.substr(1);
    }
    
    return css_property.replace(/-(\w|$)/g, function(dashChar, char){
        return char.toUpperCase();
    });
}

function default_browser_css_values() {
    var cssElement = {}
    var tagName;
    var clone;
    var cloneStyle;

    var propertyName;
    var style;
    var displayValue;
    var camelCaseName;
    
    for (var i =TAG_NAMES.length-1; i>=0; i--) {
        tagName = TAG_NAMES[i];
        style = {};

        clone = document.createElement(tagName);
        document.body.appendChild(clone);

        displayValue = clone.ownerDocument.defaultView.getComputedStyle(clone).getPropertyValue("display");
        clone.style.display = "none";

        cloneStyle = clone.ownerDocument.defaultView.getComputedStyle(clone);
        
        for (var j =cloneStyle.length-1; j >= 0; j--) {
            propertyName = cloneStyle[j] 
			style[propertyName] = cloneStyle[propertyName];
		}
        
        style["display"] = displayValue

		// Since shorthand properties are not available in the indexed array, copy them from named properties
		for (var j =SHORTHAND_PROPERTIES.length-1; j>=0; j--) {
            propertyName = SHORTHAND_PROPERTIES[j]
            camelCaseName = camelCaseCSS(propertyName)
            if (typeof style[camelCaseName] === "undefined") {
                style[propertyName] = cloneStyle[camelCaseName];
            }
		}
        
        document.body.removeChild(clone);
        cssElement[tagName] = style
    }

    return cssElement
}
