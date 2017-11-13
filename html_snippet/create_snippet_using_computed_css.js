(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        root.createSnippet = factory();
    }
}(this, function () {
	"use strict";
    
    // TODO: Dar soporte a todos los posibles pseudoelementos

    var pseudoElements = ["::after", "::before", "::cue", "::first-letter", "::first-line", "::selection"]
    var fontFaceProperties = ["font-family", "font-style", "font-weight", "font-stretch", "unicode-range", "src"]

	var idCounter = 1;
    
    // list of shorthand properties based on CSSShorthands.in from the Chromium code
    // https://github.com/ChromiumWebApps/blink/blob/master/Source/core/css/CSSShorthands.in
    var shorthandProperties = {
        "animation": ["animation-name", "animation-duration", "animation-timing-function", "animation-delay", "animation-iteration-count", "animation-direction", "animation-fill-mode", "animation-play-state"],
        //"background": ["background-image", "bakcground-position", "background-position-x", "background-position-y", "background-size", "background-repeat", "background-repeat-x", "background-repeat-y", "background-attachment", "background-origin", "background-clip", "background-color"],
//		"background-position": ["background-position-x", "background-position-y"],
//		"background-repeat": ["background-repeat-x", "background-repeat-y"],
        "border": ["border-left", "border-right", "border-bottom", "border-top", "border-color", "border-style", "border-width", "border-top-color", "border-top-style", "border-top-width", "border-right-color", "border-right-style", "border-right-width", "border-bottom-color", "border-bottom-style", "border-bottom-width", "border-left-color", "border-left-style", "border-left-width"],
//		"border-color": ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
//		"border-image": ["border-image-source", "border-image-slice", "border-image-width", "border-image-outset", "border-image-repeat"],
        "border-bottom": ["border-bottom-width", "border-bottom-style", "border-bottom-color"],
        "border-left": ["border-left-width", "border-left-style", "border-left-color"],
        "border-top": ["border-top-width", "border-top-style", "border-top-color"],
        "border-right": ["border-right-width", "border-right-style", "border-right-color"],
        "border-radius": ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"],
//		"border-spacing": ["-webkit-border-horizontal-spacing", "-webkit-border-vertical-spacing"],
//		"border-style": ["border-top-style", "border-right-style", "border-bottom-style", "border-left-style"],
//		"border-width": ["border-top-width", "border-right-width", "border-bottom-width", "border-left-width"],
        "flex": ["flex-grow", "flex-shrink", "flex-basis"],
        "flex-flow": ["flex-direction", "flex-wrap"],
        "font": ["font-family", "font-size", "font-style", "font-variant", "font-weight", "line-height"],
        "grid-area": ["grid-row-start", "grid-column-start", "grid-row-end", "grid-column-end"],
        "grid-column": ["grid-column-start", "grid-column-end"],
        "grid-row": ["grid-row-start", "grid-row-end"],
//		"height": ["min-height", "max-height"],
        "list-style": ["list-style-type", "list-style-position", "list-style-image"],
        "margin": ["margin-top", "margin-right", "margin-bottom", "margin-left"],
        "marker": ["marker-start", "marker-mid", "marker-end"],
        "outline": ["outline-color", "outline-style", "outline-width"],
        "overflow": ["overflow-x", "overflow-y"],
        "padding": ["padding-top", "padding-right", "padding-bottom", "padding-left"],
        "text-decoration": ["text-decoration-line", "text-decoration-style", "text-decoration-color"],
        "transition": ["transition-property", "transition-duration", "transition-timing-function", "transition-delay"],
//		"-webkit-animation": ["-webkit-animation-name", "-webkit-animation-duration", "-webkit-animation-timing-function", "-webkit-animation-delay", "-webkit-animation-iteration-count", "-webkit-animation-direction", "-webkit-animation-fill-mode", "-webkit-animation-play-state"],
        "-webkit-border-after": ["-webkit-border-after-width", "-webkit-border-after-style", "-webkit-border-after-color"],
        "-webkit-border-before": ["-webkit-border-before-width", "-webkit-border-before-style", "-webkit-border-before-color"],
        "-webkit-border-end": ["-webkit-border-end-width", "-webkit-border-end-style", "-webkit-border-end-color"],
        "-webkit-border-start": ["-webkit-border-start-width", "-webkit-border-start-style", "-webkit-border-start-color"],
//		"-webkit-border-radius": ["border-top-left-radius", "border-top-right-radius", "border-bottom-right-radius", "border-bottom-left-radius"],
        "-webkit-columns": ["-webkit-column-width", "-webkit-column-count"],
        "-webkit-column-rule": ["-webkit-column-rule-width", "-webkit-column-rule-style", "-webkit-column-rule-color"],
        "-webkit-margin-collapse": ["-webkit-margin-before-collapse", "-webkit-margin-after-collapse"],
        "-webkit-mask": ["-webkit-mask-image", "-webkit-mask-position-x", "-webkit-mask-position-y", "-webkit-mask-size", "-webkit-mask-repeat-x", "-webkit-mask-repeat-y", "-webkit-mask-origin", "-webkit-mask-clip"],
        "-webkit-mask-position": ["-webkit-mask-position-x", "-webkit-mask-position-y"],
        "-webkit-mask-repeat": ["-webkit-mask-repeat-x", "-webkit-mask-repeat-y"],
        "-webkit-text-emphasis": ["-webkit-text-emphasis-style", "-webkit-text-emphasis-color"],
        "-webkit-text-stroke": ["-webkit-text-stroke-width", "-webkit-text-stroke-color"],
        "-webkit-transition": ["-webkit-transition-property", "-webkit-transition-duration", "-webkit-transition-timing-function", "-webkit-transition-delay"],
        "-webkit-transform-origin": ["-webkit-transform-origin-x", "-webkit-transform-origin-y", "-webkit-transform-origin-z"],
    };
    
    
    // https://github.com/stevenvachon/camelcase-css
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

    function crossDomainCSSFiles() {
        var rules;
        var css_files = [];
        var style_sheets = document.styleSheets;
        var number_of_style_sheets = style_sheets.length;
        
        for (var i=0; i< number_of_style_sheets; i++) {
            rules = style_sheets[i].rules || style_sheets[i].cssRules;
            if (rules === null) {
                css_files.push(style_sheets[i].href);
            }
        }
        return css_files
    }

    function resolveURL(url, base_url) {
        var doc      = document
        , old_base = doc.getElementsByTagName('base')[0]
        , old_href = old_base && old_base.href
        , doc_head = doc.head || doc.getElementsByTagName('head')[0]
        , our_base = old_base || doc_head.appendChild(doc.createElement('base'))
        , resolver = doc.createElement('a')
        , resolved_url
        ;
        our_base.href = base_url;
        resolver.href = url;
        resolved_url  = resolver.href; // browser magic at work here

        if (old_base) old_base.href = old_href;
        else doc_head.removeChild(our_base);

        return resolved_url;
    }
    
    function getFontFaceRulesText() {
        var style_sheets = document.styleSheets;
        
        var list_of_css_rules;
        var css_rule;
        var text;
        var base_url;
        var propertyName;
        var property_value;

        var number_of_style_sheets = style_sheets.length;

        var output = ""
        for (var i=0; i< number_of_style_sheets; i++) {
            var list_of_css_rules = style_sheets[i].rules || style_sheets[i].cssRules;
            
            if (list_of_css_rules === null) continue;
            list_of_css_rules = Array.prototype.slice.call(list_of_css_rules)
            
            while (list_of_css_rules.length !==0) {
                css_rule = list_of_css_rules.shift()

                if(css_rule.constructor.name === "CSSFontFaceRule") {
                    base_url = css_rule.parentStyleSheet.href;

                    var style_of_css_rule = css_rule.style;
                    output += "@font-face {\n"

                    for (var j=style_of_css_rule.length-1; j >=0; j--) {
                        propertyName = style_of_css_rule[j];
                        property_value = style_of_css_rule.getPropertyValue(propertyName);
                        
                        if (propertyName== "src") {
                            property_value = property_value.replace(/url\(["']?(?!data:)(.+?)["']?\)/g, function(matched_string, url){
                                url = resolveURL(url, base_url);
                                return "url('"+url+"')"
                            })
                        }
                        output += "    " + propertyName + ": " + property_value + ";\n";
                    }
                    
                    output += "}\n"
                } else if(css_rule.constructor.name === "CSSMediaRule") {
                    if (css_rule.cssRules.length !==0) {
                        Array.prototype.push.apply(list_of_css_rules, css_rule.cssRules)
                    }
                } else if(css_rule.constructor.name === "CSSImportRule") {
                    Array.prototype.push.apply(list_of_css_rules, css_rule.styleSheet.cssRules)
                }
            }
        }
        
        return output
    }
    
    
    function getCrossDomainCSSLinks() {
        var cross_domain_css_urls = crossDomainCSSFiles()
        
        var href;
        var external_css = ""
        for (var i =0; i < cross_domain_css_urls.length; i++) {
            href = cross_domain_css_urls[i];
            external_css += '<link rel="stylesheet" type="text/css" href="'+ href +'">\n'
        }

        return external_css
    }


    /**
     * Filter that removes all vendor properties.
     *
     * @constructor
     */
    var VendorPropertiesFilter = function() {}
    
    VendorPropertiesFilter.prototype._removeVendorProperties = function(cssProperties) {
        var propertyName, output = {};

        for (propertyName in cssProperties) {
            if (cssProperties.hasOwnProperty(propertyName) && !(propertyName.charAt(0) === "-")) {
                output[propertyName] = cssProperties[propertyName];
            }
        }

        return output;
    }
    
    VendorPropertiesFilter.prototype.process = function (styles) {
        var i, l,
            style,
            output = [];

        for (i = 0, l = styles.length; i < l; i++) {
            style = styles[i];

            output.push({
                id: style.id,
                tagName: style.tagName,
                node: this._removeVendorProperties(style.node),
                before: style.before ? this._removeVendorProperties(style.before) : null,
                after: style.after ? this._removeVendorProperties(style.after) : null
            });
        }

        return output;
    };


    /**
     * Filter that removes all properties that use default browser values.
     *
     * @constructor
     */
    var DefaultValueFilter = function(defaultCssValues) {
        "use strict";
        this.defaultCssValues = defaultCssValues;
    }
    
    DefaultValueFilter.prototype._removeDefaultValues = function(currentStyle, tagName, pseudoElement) {
        var propertyName,
            avalue,
            bvalue,
            output = {},
            defaultStyle;

        defaultStyle = this.defaultCssValues[tagName.toUpperCase()];
        if (typeof defaultStyle === "undefined") return currentStyle;

        for (propertyName in currentStyle) {
            if (currentStyle.hasOwnProperty(propertyName)) {
                avalue = defaultStyle[propertyName];
                bvalue = currentStyle[propertyName];    

                if (avalue !== bvalue) {
                    output[propertyName] = bvalue;
                }
            }
        }

        return output;
    }

    DefaultValueFilter.prototype.process = function (styles) {
        var i, l,
            style,
            output = [];

        for (i = 0, l = styles.length; i < l; i++) {
            style = styles[i];

            output.push({
                id: style.id,
                tagName: style.tagName,
                node: this._removeDefaultValues(style.node, style.tagName),
                before: style.before ? this._removeDefaultValues(style.before, style.tagName, ':before') : null,
                after: style.after ? this._removeDefaultValues(style.after, style.tagName, ':after') : null
            });
        }

        return output;
    };


    /**
     * Filter that removes all non-shorthand properties (where possible) resulting in more concise and readable code.
     * e.g.
     * {border-color: red; border-width: 2px; border-style: solid; border: red 2px solid;}
     * ->
     * {border: red 2px solid;}
     *
     * @constructor
     */
    var ShorthandPropertyFilter = function() {}
    
    ShorthandPropertyFilter.prototype._keepOnlyShorthandProperties = function(cssProperties) {
        var propertyName,
            output = {},
            shorthand,
            longhands,
            blacklist = {},
            i, l;

        for (shorthand in shorthandProperties) {
            // We need to build a 'blacklist' of redundant properties that can be safely removed.
            // We can't safely remove all longhand properties because there are edge cases where
            // these can't be replaced by shorthands (when shorthands are not expressive enough).
            // e.g
            // We can't remove 'overflow-x' and 'overflow-y' if their values are different ('overflow-x: auto; overflow-y: scroll')
            // because 'overflow' property takes only one value ('overflow: auto, scroll' is invalid).
            //
            // If shorthand property isn't expressive enough to describe the longhand properties it will be empty
            // and we can safely remove it leaving only longhand properties.

            if (cssProperties.hasOwnProperty(shorthand) && cssProperties[shorthand]) {
                longhands = shorthandProperties[shorthand];

                for (i = 0, l = longhands.length; i < l; i++) {
                    blacklist[longhands[i]] = true;
                }
            } else if (!cssProperties[shorthand]) {
                blacklist[shorthand] = true;
            }
        }

        for (propertyName in cssProperties) {
            if (cssProperties.hasOwnProperty(propertyName) && !blacklist.hasOwnProperty(propertyName)) {
                output[propertyName] = cssProperties[propertyName];
            }
        }

        return output;
    }

    ShorthandPropertyFilter.prototype.process = function (styles) {
        var i, l,
            style,
            output = [];

        for (i = 0, l = styles.length; i < l; i++) {
            style = styles[i];

            output.push({
                id: style.id,
                tagName: style.tagName,
                node: this._keepOnlyShorthandProperties(style.node),
                before: style.before ? this._keepOnlyShorthandProperties(style.before) : null,
                after: style.after ? this._keepOnlyShorthandProperties(style.after) : null
            });
        }

        return output;
    };


    /**
     * Utility that combines together rules with exact same properties and values.
     *
     * e.g
     * #A1 {color: red}, #SPAN3 {color: red}
     * ->
     * #A1, #SPAN3 {color: red}
     *
     * TODO Currently, code requires that :after and :before are also equal when comparing two elements. This restriction should be
     * removed.
     *
     * @constructor
     */        
    function SameRulesCombiner() {
        "use strict";

        function compareRules(rulesA, rulesB) {
            return JSON.stringify(rulesA) === JSON.stringify(rulesB);
        }

        this.process = function (styles) {
            var i, j,
                stylesA, stylesB,
                ids,
                output = [];

            for (i = 0; i < styles.length; i++) {
                stylesA = styles[i];
                ids = [stylesA.id];
                j = i + 1
                while(j < styles.length) {
                    stylesB = styles[j];

                    if (compareRules(stylesA.node, stylesB.node) &&
                        compareRules(stylesA.after, stylesB.after) &&
                        compareRules(stylesA.before, stylesB.before)) {

                        ids.push(stylesB.id);
                        styles.splice(j, 1);
                    } else {
                        j++
                    }
                }

                output.push({
                    id: ids,
                    node: stylesA.node,
                    before: stylesA.before,
                    after: stylesA.after
                });
            }

            return output;
        };
    }
    
    /**
     * Utility that transforms object representing CSS rules to actual CSS code.
     *
     * @constructor
     */
    var CssStringifier = function() {}

    CssStringifier.prototype._propertiesToString= function(properties) {
        var propertyName,
            output = "";

        for (propertyName in properties) {
            if (properties.hasOwnProperty(propertyName)) {
                output += "    " + propertyName + ": " + properties[propertyName] + ";\n";
            }
        }

        return output;
    }

    CssStringifier.prototype._printSelectors= function(ids, pseudoElement) {
        var i, l,
            selectorText,
            output = [];

        if (!(ids instanceof Array)) {
            ids = [ids];
        }

        for (i = 0, l = ids.length; i < l; i++) {
            selectorText = '.' + ids[i];
            if (pseudoElement) {
                selectorText += pseudoElement;
            }

            output.push(selectorText);
        }

        return output.join(', ');
    }

    CssStringifier.prototype.process = function (styles) {
        var i, l,
            style,
            output = "";

        for (i = 0, l = styles.length; i < l; i++) {
            style = styles[i];

            output += this._printSelectors(style.id) + ' {\n';
            output += this._propertiesToString(style.node);
            output += '}\n\n';

            if (style.after) {
                output += this._printSelectors(style.id, '::after') + ' {\n';
                output += this._propertiesToString(style.after);
                output += '}\n\n';
            }

            if (style.before) {
                output += this._printSelectors(style.id, '::before') + ' {\n';
                output += this._propertiesToString(style.before);
                output += '}\n\n';
            }
        }

        return output;
    };

	function createID(prefix, node) {
		return prefix + node.tagName + '_' + idCounter++;
	}
    
    function removeElementsByTagName(node, tagName) {
        var element = node.getElementsByTagName(tagName), index;

        for (index = element.length - 1; index >= 0; index--) {
            element[index].parentNode.removeChild(element[index]);
        }
    }

    function removeAttributes(node) {
        var listOfElements = [node];
        var element;
        var attributes;
        var attributeName;
        
        while(listOfElements.length !==0) {
            element = listOfElements.pop();

            if (element.hasAttributes()) {
                attributes = Array.prototype.slice.call(element.attributes);

                for(var i = attributes.length - 1; i >= 0; i--) {
                    attributeName = attributes[i].name;
                    element.removeAttribute(attributeName); 
                }

            }
            
            Array.prototype.push.apply(listOfElements, element.children)
        }        
    }
    
    function dumpCSS(node, pseudoElement) {
		var styles,i, l, cssName, camelCaseName, output = {};

		styles = node.ownerDocument.defaultView.getComputedStyle(node, pseudoElement);

		if (pseudoElement && styles.getPropertyValue('content').length === 0) {
			//if we are dealing with pseudoelement, check if 'content' property isn't empty
			//if it is, then we can ignore the whole element
            return null;
		}

		for (i = 0, l = styles.length; i < l; i++) {
            cssName = styles[i] 
			output[cssName] = styles[cssName];
		}

		// Since shorthand properties are not available in the indexed array, copy them from named properties
		for (cssName in shorthandProperties) {
            camelCaseName = camelCaseCSS(cssName)
            if (typeof styles[camelCaseName] !== "undefined") {
                output[cssName] = styles[camelCaseName];
            }
		}

        if (output.content.length === 0) {
            delete output.content
        } else {
            var text = "";
            var temp_text = output.content;
            var temp_text_length = temp_text.length;
            var hex;
            for (var k=0; k < temp_text_length; k++) {
                if (temp_text.charCodeAt(k) <= 255) {
                    text += temp_text.charAt(k);
                } else {
                    hex = temp_text.charCodeAt(k).toString(16);
                    hex = ("000"+hex).slice(-4);

                    text += "\\"+hex;
                }
            }
            
            // Work around http://crbug.com/313670 (the "content" property is not present as a computed style indexed property value).
            output.content = text;
        }


		return output;
	}
    

	function cssObjectForElement(element, omitPseudoElements) {
		return {
			tagName: element.tagName,
			node: dumpCSS(element, null),
			before: omitPseudoElements ? null : dumpCSS(element, ':before'),
			after: omitPseudoElements ? null : dumpCSS(element, ':after')
		};
	}

	/**
	 * Replaces all relative URLs (in images, links etc.) with absolute URLs
	 * @param element
	 */
	function relativeURLsToAbsoluteURLs(element) {
		switch (element.nodeName) {
			case 'A':
			case 'AREA':
			case 'LINK':
			case 'BASE':
				if (element.hasAttribute('href')) {
					element.setAttribute('href', element.href);
				}
				break;
			case 'IMG':
			case 'IFRAME':
			case 'INPUT':
			case 'FRAME':
			case 'SCRIPT':
				if (element.hasAttribute('src')) {
					element.setAttribute('src', element.src);
				}
				break;
			case 'FORM':
				if (element.hasAttribute('action')) {
					element.setAttribute('action', element.action);
				}
				break;
		}
	}

	function createSnippet(root, options) {
        if (!options) options = {
            ancestors: false,
            removeDefaultCssValues: false,
            vendorProperties: false,
            combineToShorthandProperties: true,
            combineRules: true
        };

		var snippetCssRules = [],
			ancestorCss = [],
			descendants,
			descendant,
			htmlSegments,
            reverseAncestors = [],
			leadingAncestorHtml="",
			trailingAncestorHtml="",
			i, j, l,
			parent,
			clone,
            prefix = options.prefix || "",
            root_display,
            root_css,
            snippetHtml,
            snippetCss,
            element,
            listOfElements,
            id,
            font_face_css_rules_text,
            html,
            clonedParent;

        root_display = root.ownerDocument.defaultView.getComputedStyle(root, null).getPropertyValue("display");
        root.style.display = "none"
		// First we go through all nodes and dump all CSS
        root_css = cssObjectForElement(root)
        root_css["node"]["display"] = root_display       

        snippetCssRules.push(root_css)
        
        descendants = root.getElementsByTagName('*');
		for (i = 0, l = descendants.length; i < l; i++) {
            descendant = descendants[i];

            if (typeof descendant.ownerSVGElement !== "undefined" || descendant.tagName==="STYLE" || descendant.tagName==="SCRIPT") {
                snippetCssRules.push(null)
            } else {
                snippetCssRules.push(cssObjectForElement(descendant));
            }
		}      

        if (options.ancestors) {
            parent = root.parentElement;
            while (parent && parent !== document.documentElement) {
                if (!(parent.tagName === "SCRIPT" || parent.tagName === "STYLE")) {
                    reverseAncestors.push(parent);
                }
                parent = parent.parentElement;
            }
            
            for (i = reverseAncestors.length - 1; i >= 0; i--) {
                ancestorCss.push(cssObjectForElement(reverseAncestors[i], true));
            }
            
            // Build leading and trailing HTML for ancestors
            for (i = reverseAncestors.length - 1; i >= 0; i--) {
                element = reverseAncestors[i]
                leadingAncestorHtml += '<' + element.tagName + ' class="' + createID(element) + '">';
            }

            for (i = 0, l = reverseAncestors.length; i < l; i++) {
                element = reverseAncestors[i]
                trailingAncestorHtml +=  '</' + element.tagName + '>';
            }
        }
        
        
		clone = root.cloneNode(true);

		listOfElements = Array.prototype.slice.call(clone.getElementsByTagName('*'));
        listOfElements.unshift(clone);

		for (i = 0, l = listOfElements.length; i < l; i++) {
            if (snippetCssRules[i]=== null) continue;

            element = listOfElements[i];
            element.removeAttribute("style")

            if (element.hasAttributes()) {
                var attributes = Array.prototype.slice.call(element.attributes);
                var attributeName;

                for(j = attributes.length - 1; j >= 0; j--) {
                    attributeName = attributes[j].name;
                    if (attributeName.startsWith("on")) {
                        element.removeAttribute(attributeName); 
                    }
                }

            }

            relativeURLsToAbsoluteURLs(element);

            id = createID(prefix, element);
			element.setAttribute('class', id);

            snippetCssRules[i]["id"] = id;
		}

        snippetCssRules = snippetCssRules.filter( function(item){
            return item !== null
        })

        removeElementsByTagName(clone, "script")
        removeElementsByTagName(clone, "style")

        if (options.ancestors) {
            snippetHtml = leadingAncestorHtml + clone.outerHTML + trailingAncestorHtml
            snippetCssRules = Array.prototype.push.apply(ancestorCss, snippetCssRules)
        } else {
            if (root.tagName === "BODY") {
                snippetHtml = clone.outerHTML;
            } else {
                snippetHtml = "<body>\n"+clone.outerHTML+"\n</body>";
            }
        }

		if (options.removeDefaultCssValues) {
            
            var defaultValueFilter = new DefaultValueFilter(options.defaultValues)
			snippetCssRules = defaultValueFilter.process(snippetCssRules);
		}

		if (options.combineToShorthandProperties) {
            var shorthandPropertyFilter = new ShorthandPropertyFilter()
			snippetCssRules = shorthandPropertyFilter.process(snippetCssRules);
		}

		if (!options.vendorProperties) {
            var vendorPropertiesFilter = new VendorPropertiesFilter()
			snippetCssRules = vendorPropertiesFilter.process(snippetCssRules);
		}
		if (options.combineRules) {
            var sameRulesCombiner = new SameRulesCombiner()
			snippetCssRules = sameRulesCombiner.process(snippetCssRules);
		}

        var cssStringifier = new CssStringifier();
        snippetCss = cssStringifier.process(snippetCssRules)

        font_face_css_rules_text = getFontFaceRulesText();

        if (font_face_css_rules_text) {
            snippetCss = font_face_css_rules_text +"\n" + snippetCss
        }

        html = "<!DOCTYPE html>\n";
        html += "<html>\n";
        html += "<head>\n";
        html += "<meta charset='UTF-8'>\n";
        html += "<title>Snippet of "+ window.location.href  + "</title>\n";
        html += getCrossDomainCSSLinks();
        html += "<style>\n"
        html += snippetCss
        html += "</style>\n"
        html += "</head>\n"
        html += snippetHtml
        html += "</html>"
        
        root.style.display = root_display

        return html
	}

    return createSnippet

}));
