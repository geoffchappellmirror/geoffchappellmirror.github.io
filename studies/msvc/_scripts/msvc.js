<!--

/*  ************************************************************************  *
 *                                  msvc.js                                   *
 *  ************************************************************************  */

/*  Include in the HEAD of every document page in the Visual C++ subweb. 
    Include MASTER.JS and DOCUMENT.JS first.  */

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
        case "def": return "module-definition statement";
        case "env": return "environment variable";
    }
    return ClassName;
}

function GetCharStyleToolTipQualifier (ClassName)
{
    switch (ClassName) {
        case "undocumented": return ClassName;
    }
    return null;
}

/*  ************************************************************************  *
 *        Copyright © 2007-2021. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->