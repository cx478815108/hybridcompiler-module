// contentMode
const TokenViewModeMap = {
    "scaleToFill"    : 0,
    "scaleAspectFit" : 1,
    "scaleAspectFill": 2,
    "redraw"         : 3,
    "center"         : 4,
    "top"            : 5,
    "bottom"         : 6,
    "left"           : 7,
    "right"          : 8,
    "topLeft"        : 9,
    "topRight"       : 10,
    "bottomLeft"     : 11,
    "bottomRight"    : 12,
}

// borderStyle UITextField 的边框类型
const TokenTextBorderStyleMap = {
    "none"       : 0,
    "line"       : 1,
    "bezel"      : 2,
    "roundedRect": 3
}

// keyboardType UITextField 输入的键盘类型
const TokenKeyboardTypeMap = {
    "default"     : 0,
    "ascii"       : 1,
    "numbers"     : 2,
    "emailaddress": 7,
    "decimalpad"  : 8,
    "websearch"   : 10,
}

// colorModeType UITextField 键盘颜色类型
const TokenKeyboardColorModeMap = {
    "default": 0,
    "dark"   : 1,
    "light"  : 2,
}

// returnType UITextField 返回键按钮类型
const TokenKeyboardReturnMap = {
    "default"      : 0,
    "go"           : 1,
    "google"       : 2,
    "join"         : 3,
    "next"         : 4,
    "route"        : 5,
    "search"       : 6,
    "send"         : 7,
    "yahoo"        : 8,
    "done"         : 9,
    "emergencycall": 10,
    "continue"     : 10
}

// rightType UITableViewCell右边小视图的类型
const TokenCellRightTypeMap = {
    "none"            : 0,
    "indicator"       : 1,
    "detaildisclosure": 2,
    "checkmark"       : 3,
    "detail"          : 4
}

// align  UITextField 的对其类型
const TokenInputAlignMap = {
    "left"  : 0,
    "center": 1,
    "right" : 2
}

const TokenReflectMap = {
    "contentMode"  : TokenViewModeMap,
    "borderStyle"  : TokenTextBorderStyleMap,
    "keyboardType" : TokenKeyboardTypeMap,
    "colorModeType": TokenKeyboardColorModeMap,
    "returnType"   : TokenKeyboardReturnMap,
    "rightType"    : TokenCellRightTypeMap,
    "align"        : TokenInputAlignMap,
}

module.exports = TokenReflectMap;