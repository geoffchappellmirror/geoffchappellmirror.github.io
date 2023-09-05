<!--

/*  ************************************************************************  *
 *                                 kernel.js                                  *
 *  ************************************************************************  */

/*  Include in the HEAD of every document page in the Kernel subweb. Include 
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
        case "bcdobj":          return "BCD object (boot entry)";
        case "bcdopt":          return "BCD element (boot option)";
        case "env":             return "environment variable";
        case "functionprefix":  return "prefix for function name";
        case "guid":            return "GUID";
        case "licvalue":        return "license value";
        case "regkey":          return "registry key";
        case "regsz":           return "registry string data";
        case "regvalue":        return "registry value";
    }
    return null;
}

function GetCharStyleToolTipQualifier (ClassName)
{
    switch (ClassName) {

        /*  simple  */

        case "internal":
        case "undocumented":    return ClassName;

        /*  translated  */

        case "delayed":         return "not initially documented";
        case "declared":        return "undocumented but declared";
        case "minwin":          return 'undocumented but declared in "minwin" disclosure';
        case "obsolete":        return "documented as obsolete";
        case "reserved":        return "documented as reserved";
    }
    return null;
}

/*  ************************************************************************  *
 *        Copyright © 2007-2021. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->