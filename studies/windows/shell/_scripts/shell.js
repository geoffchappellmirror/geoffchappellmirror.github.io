<!--

/*  ************************************************************************  *
 *                                 shell.js                                   *
 *  ************************************************************************  */

/*  Include in the HEAD of every document page in the Shell subweb. Include 
    MASTER.JS and DOCUMENT.JS first.  */

/*  Familiarity with MASTER.JS, DOCUMENT.JS and the dynamically loaded 
    DOCUI.JS is assumed.  */

/*  ************************************************************************  */
/*  Character-style Tooltips - see DOCUI.JS  */

function GetCharStyleToolTipQualifier (ClassName)
{
    switch (ClassName) {
        case "undocumented": return "undocumented";
        case "settlement": return "documented for settlement";
        case "postdoc": return "documented years later than settlement";
        case "doc04": return "documented in 2004";
        case "doc0405": return "documented in 2004-2005";
        case "doc0406": return "documented in 2004-2006";
        case "doc05": return "documented in 2005";
        case "doc0506": return "documented in 2005-2006";
        case "doc06": return "documented in 2006";
    }
    return null;
}

function GetCharStyleToolTipBase (ClassName)
{
    switch (ClassName) {
        case "clsid": return "class identifier (CLSID)";
        case "config": return "configurable setting";
        case "guid": return "GUID";
        case "iid": return "interface identifier (IID)";
        case "inikey": return "entry in .INI file";
        case "inisect": return "section in .INI file";
        case "licvalue": return "license value";
        case "object": return "named kernel object";
        case "pkey": return "property key";
        case "polid": return "policy identifier (POLID)";
        case "progid": return "programmatic identifier (ProgID)";
        case "regkey": return "registry key";
        case "regsz": return "string data for registry value";
        case "regvalue": return "registry value";
        case "tag": return "tag from HTML or XML file";
    }
    var qual = GetCharStyleToolTipQualifier (ClassName);
    return qual != null ? qual : ClassName;
}

/*  ************************************************************************  *
 *        Copyright © 2007-2021. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->