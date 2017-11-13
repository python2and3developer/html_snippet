// TODO: parents is optional

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        root.createSnippet = factory();
    }
}(this, function () {

    function removeJavascript(node) {
        var listOfElements = [node];
        var element;
        var attributeName;
        var attrs;
        var eventAttributes;
        
        while(listOfElements.length !==0) {
            element = listOfElements.pop();
            if (element.tagName === "SCRIPT") {
                element.parentNode.removeChild(element);
            } else {
                if (element.hasAttributes()) {
                    attrs = element.attributes;
                    
                    eventAttributes = []
                    for(var i = attrs.length - 1; i >= 0; i--) {
                        attributeName = attrs[i].name
                        if (attributeName.startsWith("on")) {
                            eventAttributes.push(attributeName)
                        }                        
                    }
                    
                    for(var i = eventAttributes.length - 1; i >= 0; i--) {
                        attributeName = eventAttributes[i];
                        element.removeAttribute(attributeName); 
                    }
                }
                Array.prototype.push.apply(listOfElements, element.children)
            }
        }
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
    
    function indentText(text, indent) {
        indent = indent || "    ";
        var new_text = "";

        var arrayOfLines = text.match(/[^\r\n]+/g);
        for (var i =0; i< arrayOfLines.length ; i++) {
            new_text += indent + arrayOfLines[i] + "\n";
        }
        
        return new_text
    }

    function cssRule2Text(css_rule) {
        if (css_rule.style.length === 0) return "";

        var output = css_rule.selectorText + " {\n"
        var parentRule;
        var propertyName;
        var propertyValue;
        
        var indentLevel =0;
        var indent = "    ";

        for (var i =css_rule.style.length -1; i >= 0; i--) {
            propertyName = css_rule.style[i];
            propertyValue = css_rule.style[propertyName];
            
            if (propertyName==="content") {
                var temp_content = propertyValue;
                var temp_content_length = temp_content.length;
                
                propertyValue = ""
                for (var k=0; k < temp_content_length; k++) {
                    if (temp_content.charCodeAt(k) <= 255) {
                        propertyValue += temp_content.charAt(k);
                    } else {
                        hex = temp_content.charCodeAt(k).toString(16);
                        hex = ("000"+hex).slice(-4);

                        propertyValue += "\\"+hex;
                    }
                }
            }
            output += indent + propertyName + ": " + propertyValue + ";\n";
        }
        
        output += '}\n';
        
        parentRule= css_rule.parentRule;
        while(parentRule !== null) {
            if(parentRule.constructor.name === "CSSMediaRule") {
                indentLevel += 1;
                output = "@media "+parentRule.conditionText + " {\n" + indentText(output, indent.repeat(indentLevel)) + "\n}\n"
            }
            parentRule= parentRule.parentRule;
        }
        
        var base_url = css_rule.parentStyleSheet.href;

        output = output.replace(/url\(["']?(?!data:)(.+?)["']?\)/g, function(matched_string, url){
            
            url = resolveURL(url, base_url);
            return "url('"+url+"')"
        })

        return output
    }

    function isSelectorMatched(el, css_selector) {
        var list_of_comma_separated_selectors;
        var separated_selector;

        if (!!(el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector || el.oMatchesSelector).call(el, css_selector)) {
            return true;
        } else {
            list_of_comma_separated_selectors = css_selector.split(",")
            for (var k=list_of_comma_separated_selectors.length-1; k>=0; k--) {
                separated_selector = list_of_comma_separated_selectors[k];
                separated_selector = separated_selector.replace(/^\s+|\s+$/g, '')

                if (separated_selector.indexOf("::") !== -1) {
                    separated_selector = separated_selector.substring(0, separated_selector.indexOf("::"));
                    if (separated_selector !== "" && el.matches(separated_selector)) {
                        return true
                    }
                }
            }
        }

        return false
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

    function addMatchedRules(el, result) {
        var style_sheets = document.styleSheets;
        result = result || [];
        
        var list_of_css_rules;
        var css_rule;

        var number_of_style_sheets = style_sheets.length;

        for (var i=0; i< number_of_style_sheets; i++) {
            result[i] = result[i] || [];

            var list_of_css_rules = style_sheets[i].rules || style_sheets[i].cssRules;
            
            if (list_of_css_rules === null) continue;
            list_of_css_rules = Array.prototype.slice.call(list_of_css_rules)
            
            while (list_of_css_rules.length !==0) {
                css_rule = list_of_css_rules.shift()

                if (css_rule.constructor.name === "CSSStyleRule") {
                    if (result[i].indexOf(css_rule) === -1 && isSelectorMatched(el, css_rule.selectorText)) {
                        result[i].push(css_rule)
                    }
                } else if(css_rule.constructor.name === "CSSMediaRule") {
                    if (css_rule.cssRules.length !==0) {
                        Array.prototype.push.apply(list_of_css_rules, css_rule.cssRules)
                    }
                } else if(css_rule.constructor.name === "CSSImportRule") {
                    Array.prototype.push.apply(list_of_css_rules, css_rule.styleSheet.cssRules)
                }
            }
        }
        return result;
    }

    function getSnippetStyle(root, css_of_ancestors) {
        var css_rules = addMatchedRules(root);

        var descendants = root.getElementsByTagName('*');
        var descendants_length = descendants.length;
        
        for (var i=0; i < descendants_length; i++) {
            addMatchedRules(descendants[i], css_rules)
        }

        if (css_of_ancestors) {
            parent = root.parentElement;
            while (parent !== null) {
                addMatchedRules(parent, css_rules)
                parent = parent.parentElement;
            }
        }

        var css = "";
        var css_rule;

        var hex;
        var matched_rules_of_stylesheet;
        var number_of_matched_rules_of_stylesheet;

        for (var i =0; i < css_rules.length; i++) {
            matched_rules_of_stylesheet = css_rules[i];
            number_of_matched_rules_of_stylesheet = matched_rules_of_stylesheet.length;
            for (var j=0; j < number_of_matched_rules_of_stylesheet; j++) {            
                css_rule = matched_rules_of_stylesheet[j]
                css += cssRule2Text(css_rule) + "\n";
            }
        }


        var font_face = getFontFaceRulesText();
        if (font_face) {
            css = font_face + "\n"+css
        }
        return css
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

    function getSnippetHtml(root){
        clone = root.cloneNode(true);
        descendants = clone.getElementsByTagName('*');

        for (i = 0, l = descendants.length; i < l; i++) {
            descendant = descendants[i];
            relativeURLsToAbsoluteURLs(descendant);
        }
        
        return clone.outerHTML
    }
    
    function createSnippet(root, options) {
        if (!options) options = {
            includeCssOfAncestors: false
        };
        
        var html = "<!DOCTYPE html>\n";
        html += "<html>\n";
        html += "<head>\n";
        html += "<meta charset='UTF-8'>\n";
        html += "<title>Snippet of "+ window.location.href  + "</title>\n";
        html += getCrossDomainCSSLinks();
        html += "<style>\n"
        html += getSnippetStyle(root, options.includeCssOfAncestors)
        html += "</style>\n"
        html += "</head>\n"
        html += "<body>"
        html += getSnippetHtml(root)
        html += "</body>\n"
        html += "</html>"
        
        return html
    }

    return createSnippet

}));
