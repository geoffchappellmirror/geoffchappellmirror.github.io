<!--

/*  ************************************************************************  *
 *                                   ie.js                                    *
 *  ************************************************************************  */

/*  Include in the HEAD of every document page in the Internet Explorer 
    subweb. Include MASTER.JS and DOCUMENT.JS first.  */

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
        case "catid": return "CATID";
        case "cgid": return "CGID";
        case "clsid": return "CLSID";
        case "diid": return "DIID";
        case "guid": return "GUID";
        case "iid": return "IID";
        case "inisect": return "section in .INI file";
        case "regkey": return "registry key";
        case "regsz": return "registry string data";
        case "regvalue": return "registry value";
    }
    return ClassName;
}

function GetCharStyleToolTipQualifier (ClassName)
{
    switch (ClassName) {
        case "doc04": return "documented in 2004";
        case "doc0405": return "documented in 2004-2005";
        case "doc0406": return "documented in 2004-2006";
        case "doc05": return "documented in 2005";
        case "doc0506": return "documented in 2005-2006";
        case "doc06": return "documented in 2006";
        case "misdocumented": return "misdocumented";
        case "settlement": return "documented for settlement";
        case "undocumented": return "undocumented";
    }
    return null;
}

/*  ************************************************************************  *
 *        Copyright © 2007-2021. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->