<!--

/*  ************************************************************************  *
 *                                 win32.js                                   *
 *  ************************************************************************  */

/*  Include in the HEAD of every document page in the Win32 subweb. Include 
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
        case "catid":           return "CATID";
        case "clsid":           return "CLSID";
        case "cssattribute":    return "CSS attribute";
        case "env":             return "environment variable";
        case "functionprefix":  return "prefix for function name";
        case "guid":            return "GUID";
        case "htmlattribute":   return "HTML attribute";
        case "htmlelement":     return "HTML element";
        case "htmltag":         return "HTML tag";
        case "iid":             return "IID";
        case "inikey":          return "entry in .INI file";
        case "inisect":         return "section in .INI file";
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
        
        case "undocumented":    return ClassName;
        
        /*  translated  */
        
        case "declared":        return "undocumented but declared";
        case "delayed":         return "not initially documented";
        case "minwin":          return 'undocumented but declared in "minwin" disclosure';
        case "obsolete":        return "documented as obsolete";
        case "reserved":        return "documented as reserved";
        case "wdk":             return "documented in WDK";
        case "wdkdecl":         return "undocumented but declared in WDK";
        
        /*  retained until new use settles  */
        
        case "delayedwdk":      return "documented in WDK but not immediately";
        case "lowlevel":        return "documented at higher level";
        case "settlement":      return "documented for settlement";
    }
    return null;
}

/*  ************************************************************************  *
 *        Copyright © 2007-2021. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->