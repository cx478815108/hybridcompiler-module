const flexAttributes = {
    "flex-wrap"      : true,
    "align-content"  : true,
    "align-items"    : true,
    "align-self"     : true,
    "justify-content": true,
    "direction"      : true,
    "flex-direction" : true,
    "overflow"       : true,
    "position"       : true,
    "display"        : true,

    // float
    "flex"       : true,
    "flex-grow"  : true,
    "flex-shrink": true,
    "flex-basis" : true,
    "aspectRatio": true,

    // percent float
    "width" : true,
    "height": true,
    "left"  : true,
    "right" : true,
    "top"   : true,
    "bottom": true,
    "start" : true,
    "end"   : true,

    "max-width" : true,
    "max-height": true,
    "min-width" : true,
    "min-height": true,

    "margin"           : true,
    "margin-left"      : true,
    "margin-right"     : true,
    "margin-start"     : true,
    "margin-end"       : true,
    "margin-top"       : true,
    "margin-bottom"    : true,
    "margin-horizontal": true,
    "margin-vertical"  : true,

    "padding"           : true,
    "padding-left"      : true,
    "padding-right"     : true,
    "padding-start"     : true,
    "padding-end"       : true,
    "padding-top"       : true,
    "padding-bottom"    : true,
    "padding-horizontal": true,
    "padding-vertical"  : true,
}

const fontAttributes = {
    'font-style'     : true,
    'font-weight'    : true,
    'font-size'      : true,
    'font-family'    : true,
    'text-align'     : true,
    'color'          : true,
    'highlight-color': true
}

module.exports = {
    flexAttributes,
    fontAttributes,
}