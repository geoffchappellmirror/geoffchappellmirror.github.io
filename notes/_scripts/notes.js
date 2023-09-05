<!--

/*  ************************************************************************  *
 *                                 notes.js                                   *
 *  ************************************************************************  */

/*  Include in the HEAD of every document page in the Notes subweb. Include 
    MASTER.JS and DOCUMENT.JS first.  */

/*  Familiarity with MASTER.JS, DOCUMENT.JS and the dynamically loaded 
    DOCUI.JS is assumed.  */

/*  ************************************************************************  */
/*  Character-style Tooltips - see DOCUI.JS  */

function GetCharStyleToolTip (Span)
{
    return null;
}

function GetCharStyleToolTipBase (ClassName)
{
    switch (ClassName) {
        case "bcdobj": return "BCD object (boot entry)";
        case "bcdopt": return "BCD element (boot option)";
        case "catid": return "CATID";
        case "clsid": return "CLSID";
        case "cssattribute": return "CSS attribute";
        case "cssproperty": return "CSS property";
        case "env": return "environment variable";
        case "guid": return "GUID";
        case "htmlattribute": return "HTML attribute";
        case "htmlelement": return "HTML element";
        case "htmltag": return "HTML tag";
        case "iid": return "IID";
        case "inikey": return "entry in .INI file";
        case "inisect": return "section in .INI file";
        case "licvalue": return "license value";
        case "regkey": return "registry key";
        case "regsz": return "registry string data";
        case "regvalue": return "registry value";
        case "xmlattrname": return "XML attribute name";
        case "xmlattrvalue": return "XML attribute value";
        case "xmlcomment": return "XML comment";
        case "xmltag": return "XML tag";
    }
    return null;
}

function GetCharStyleToolTipQualifier (ClassName)
{
    switch (ClassName) {
        case "internal":
        case "undocumented": return ClassName;
        case "settlement": return "documented for settlement";
        case "wdk": return "documented in WDK";
    }
    return null;
}

/*  ************************************************************************  *
 *        Copyright © 2007-2021. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->