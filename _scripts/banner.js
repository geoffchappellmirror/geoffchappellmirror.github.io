<!--

/*  ************************************************************************  *
 *                                 banner.js                                  *
 *  ************************************************************************  */

/*  Load from the HEAD of the banner page (BANNER.HTM) only. This script 
    expects to be the first script to execute in whatever frame the banner 
    page is loaded into. The SCRIPT tag that loads it can have both the 
    ASYNC and DEFER attributes. 

    Though BANNER.HTM does not load it, access to scripts in MASTER.JS is 
    available. Familiarity is assumed.  */

/*  ************************************************************************  */
/*  Configuration                                                             */

/*  ID and CLASS names must match BANNER.CSS and BANNER.HTM.  */

var Config = {

    /*  The banner is an arrangement of named parts. One lists the available 
        subwebs and is distinguished by the following ID.  */

    Subwebs: "Subwebs",

    /*  The Subwebs list may have multiple levels, such that a list item may 
        represent a single subweb or a group of them. Each that represents a 
        single subweb has Subweb in its CLASS. One such item can have its 
        CLASS altered so that it is specially presented as the current 
        subweb.  */

    Subweb: "Subweb",
    Current: "Current"
};

/*  ************************************************************************  */

/*  The expected execution is that our browser context is that of a frame 
    that we were loaded into by scripts running in the top window. One of 
    those scripts, MASTER.JS, has utility functions that we call liberally.  */

var Master = window.top;

/*  ************************************************************************  */
/*  Subwebs                                                                   */

/*  Search the Subwebs part of the banner for an A element that links to the 
    given URL. There is, of course, no point doing this unless the given URL 
    is that of an index page for one of the subwebs.  */

function GetCurrentSubwebLink (Url)
{
    var subwebs = window.document.getElementById (Config.Subwebs);
    if (subwebs == null) return null;

    var callback = function (Element) {
        return Element.href == Url;
    };
    return Master.CollectionFind (
        subwebs.getElementsByTagName ("A"), 
        callback);
}

/*  Given a link in the Subwebs part of the banner, find the element - 
    whether the link itself or an ancestor - that governs the link's styling 
    as representing a Subweb. Mark it as representing the Current Subweb.  */

function ShowAsCurrentSubweb (Link)
{
    for (var p = Link; p != null; p = p.parentNode) {
        var classname = p.className;
        if (Master.ClassNameContains (classname, Config.Subweb)) {
            p.className = Config.Current + " " + classname;
            return;
        }
    }
}

/*  ************************************************************************  */
/*  Load-Time Initialisation                                                  */

function OnLoad (Event)
{
    /*  The only thing we need to do with the banner now that we can work 
        with its BODY is to distinguish which of the subwebs is current. 

        First, compose a URL for the default page at the root of the current 
        subweb. This work is just a sequence of utility functions in 
        MASTER.JS (also in the top window).  */

    var path = Master.GetSubwebPath (null);         // null = current subweb 
    var pathname = Master.PathAppend (path, null);  // null = default page 
    var url = Master.ComposeLocalUrl (pathname);

    /*  Show any matching link as current. This is our own work in our own 
        window (mostly). See above for the helper functions.  */

    var link = GetCurrentSubwebLink (url);
    if (link != null) ShowAsCurrentSubweb (link);
}

/*  ************************************************************************  */
/*  Global initialisation                                                     */

function InitBanner ()
{
    /*  Arrange that when the banner has loaded, we'll identify the link for 
        the current subweb and distinguish it visually.  */

    Master.RegisterEventHandler (window, "load", OnLoad);

    /*  Ensure that following a link from the banner to any page at this 
        site will redraw the frameset in the top window and pass in the URL 
        search parameters whatever needs to be preserved across the 
        navigation.  */

    Master.SetClickedLinkRedirection (window.document);
}

/*  The banner page is meant to be seen in a viewer which presents the page 
    in an IFRAME as context for a document. If this has indeed happened, the 
    viewer is built by DOCUMENT.JS in the top window which is where we can 
    call functions in both MASTER.JS and DOCUMENT.JS. Check that we 
    ourselves are not in the top window but that those two scripts are. 

    Now that we don't execute MASTER.JS in our window, there's really not 
    much to be done about someone loading BANNER.HTM into its own window or 
    into a frame that our other scripts didn't build. But neither is there 
    any compelling reason not to let the banner be seen raw. At least it 
    names the real site and has links to follow.  */

function CanInitBanner ()
{
    return window != Master 
        && typeof Master.IsMasterJsGood == "function" 
        && Master.IsMasterJsGood (window)
        && typeof Master.Viewer == "function" 
        && typeof Master.Viewer.IsBannerWindow == "function"
        && Master.Viewer.IsBannerWindow (window);
}

if (CanInitBanner ()) InitBanner ();

/*  ************************************************************************  *
 *        Copyright © 2007-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->