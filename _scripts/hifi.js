<!-- 

/*  ************************************************************************  *
 *                                  hifi.js                                   *
 *  ************************************************************************  */

/*  Load this script from the HEAD of any document page that wants it. The 
    DEFER attribute is recommended. 

    Load MASTER.JS and DOCUMENT.JS first. Then load CONTROLS.JS, optionally 
    with the DEFER attribute. Familiarity with all three is assumed.  */

/*  ************************************************************************  */
/*  Background  */

/*  This script provides for clicking on a relative small (lo-fi) image to 
    replace it with a larger (hi-fi) image for closer inspection.  */

/*  ************************************************************************  */
/*  Configuration  */

Config.HiFiClasses = {
    HiFi : "HiFi", 
    Small : "Small", 
    Large : "Large"
};

Config.HiFiHints = {
    Small : "Click for full size",
    Large : "Click to reduce size"
};

/*  ************************************************************************  */
/*  Load-Time Preparation  */

function CreateHiFi (Img, Link)
{
    /*  Build the DIV container where the A presently is.  */

    var doc = window.document;

    var div = doc.createElement ("DIV");
    div.className = Config.HiFiClasses.HiFi;

    Link.parentNode.replaceChild (div, Link);

    /*  All we'll ever need from the A is its HREF. We may as well have it 
        now and let the browser reclaim the A.  */

    var largesrc = Link.href;

    /*  Populate the DIV container with IMG elements, one given, one new.  */

    var small = Img;

    var osmall = new ShowHideTarget (small, Config.HiFiClasses.Small, true);
    div.appendChild (small);

    var large = doc.createElement ("IMG");
    large.alt = small.alt;

    var olarge = new ShowHideTarget (large, Config.HiFiClasses.Large, false);
    div.appendChild (large);

    /*  Make the images interactive. Take care, however, that we don't 
        download the large image unless the small ever is clicked.  */

    var title = small.title;
    if (!title) small.title = Config.HiFiHints.Small;

    title = Link.title;
    if (!title) {
        large.title = Config.HiFiHints.Large;
    }
    else {
        large.title = title;
        Link.Title = "";
    }

    var smallclick = function (Event) {
        osmall.Hide ();
        olarge.Show ();
    };

    var largeclick = function (Event) {
        olarge.Hide ();
        osmall.Show ();
    };

    var largeload = function (Event) {
        smallclick ();
        RegisterEventHandler (large, "click", largeclick);
    };

    var cookie;

    var firstclick = function (Event) {
        large.src = largesrc;
        UnregisterEventHandler (small, "click", cookie);
        RegisterEventHandler (small, "click", smallclick);
        RegisterEventHandler (large, "load", largeload);
    };

    cookie = RegisterEventHandler (small, "click", firstclick);
}

function ConfigureHiFiImage (Link)   // actually forEach callback
{
    var parent = Link.parentNode;
    if (parent.tagName == "A") CreateHiFi (Link, parent);
}

function ConfigureHiFiImages (Viewer)
{
    /*  A page can have multiple expandable images, each in its own IMG 
        whose CLASS is HiFi.  */

    var images = Viewer.DocFrame.getElementsByTagName ("IMG");

    /*  What the browser gives us is a live collection of IMG elements. 
        Configuring an IMG creates another IMG and thus may affect the 
        collection. At first, make a list of IMG elements that look to be 
        suitable. Then configure them each in turn.  */

    var candidates = ExtractFromCollectionByClass (
        images, 
        Config.HiFiClasses.HiFi);

    CollectionForEach (candidates, ConfigureHiFiImage);
}

/*  ************************************************************************  */
/*  Initialisation  */

/*  As well as the usual check that we have the use of scripts in MASTER.JS 
    and DOCUMENT.JS, we also depend on an object that is implemented in 
    CONTROLS.JS.  */

function CanInitialiseHiFi ()
{
    return typeof IsMasterJsGood == "function" && IsMasterJsGood (window)
        && typeof Viewer == "function" 
        && typeof Viewer.CallWhenInserted == "function" 
        && typeof ShowHideTarget == "function";
}

/*  We might add a listener for the document's load event, but we might then 
    configure the boxes only to have that DOCUMENT.JS fails at building the 
    viewer. Instead, register to be called back when the viewer is ready.  */

if (CanInitialiseHiFi ()) Viewer.CallWhenInserted (ConfigureHiFiImages);

/*  ************************************************************************  *
 *        Copyright © 2009-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->