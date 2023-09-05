<!--

/*  ************************************************************************  *
 *                                  box.js                                    *
 *  ************************************************************************  */

/*  Load this script from the HEAD of any document page that wants it. The 
    DEFER attribute is recommended. 

    Load MASTER.JS and DOCUMENT.JS first. Then load CONTROLS.JS, optionally 
    with the DEFER attribute. Familiarity with all three is assumed.  */

/*  ************************************************************************  */
/*  Background  */

/*  This script eases the inclusion of expandable digressions in a document. 
    Each example is some arbitrary amount of HTML which is not wanted in the 
    ordinary flow but which the reader is invited to reveal, if in the mind 
    for diversion. 

    All the HTML for the example goes into a DIV. If scripting is enabled, 
    the DIV is hidden and a "show" button appears in its place. Clicking the 
    button reveals the DIV and the "show" turns to "hide". 

    The example may have its own user-interface name, for use in relevant 
    buttons. Set this as the ID of the DIV.  */

/*  ************************************************************************  */
/*  Configuration  */

/*  Every element in the Digression container has a class. These must agree 
    with BOX.CSS.  */

Config.BoxClasses = {
    Digression : "Digression",
    Box : "Box", 
    Content : "Content"
};

/*  ************************************************************************  */
/*  Load-Time Preparation  */

function InsertNewDiv (Class, Parent, Child)
{
    /*  Create a DIV with the given CLASS.  */

    var newdiv = window.document.createElement ("DIV");
    newdiv.className = Class;

    /*  Insert this new DIV between the Parent and the Child such that the 
        Child becomes the Parent's grand-child.  */

    Parent.insertBefore (newdiv, Child);
    newdiv.appendChild (Child);

    return newdiv;
}

function CreateBox (Digression, Box)
{
    /*  Construction is mostly a matter of reworking the author's DOM tree. 
        Added elements are then restyled interactively by changing their 
        CLASS. Implementations in CONTROLS.JS do all the continuing work.  */

    id = Digression.id;
    var name = id 
        ? "Digression (" + id + ")"
        : "Digression";

    var otarget = new ShowHideTarget (Box, Config.BoxClasses.Box, false);
    var ocontrols = new ShowHideControls (name);
    ocontrols.InsertBeforeTargetNode (Box);
    ocontrols.ConnectTarget (otarget);

    /*  The one variation is not so much with the controls and targets but 
        with the box's styling. We want the box to adjust to its content, 
        but some complications described in BOX.CSS go away if the box is 
        put into a container.  */

    InsertNewDiv (Config.BoxClasses.Content, Digression, Box);
}

function InitBox (Digression)   // actually forEach callback
{
    /*  Content to show in a box is in a DIV whose CLASS contains Box. We 
        ignore all but the first such block, but since it needn't be the 
        first child, the greater efficiency likely comes from asking the 
        browser for a collection. The better collection is likely to be of 
        all descendants that are DIV elements, since we don't expect many, 
        rather than of all children.  */

    var box = FindInCollectionByClass (
        Digression.getElementsByTagName ("DIV"), 
        Config.BoxClasses.Box);
    if (box == null) {

        /*  Old pages have just the DIV whose CLASS is Digression. 
            Everything in this DIV becomes the box.  */

        var digressionclass = Digression.className;

        box = Digression;
        box.className = Config.BoxClasses.Box;

        Digression = InsertNewDiv (digressionclass, box.parentNode, box);
    }
    CreateBox (Digression, box);
}

function InitBoxes (Viewer)
{
    /*  A page can have multiple digressions, each in its own DIV whose 
        CLASS contains Digression.  */

    var divs = Viewer.DocFrame.getElementsByTagName ("DIV");

    /*  What the browser gives us is a live collection of DIV elements. 
        Configuring a DIV as a Digression creates another DIV and thus may 
        affect the collection. At first, make a separate list of DIV 
        elements that look to be digressions. Then configure them each in 
        turn.  */

    var digressions = ExtractFromCollectionByClass (
        divs, 
        Config.BoxClasses.Digression);

    CollectionForEach (digressions, InitBox);
}

/*  ************************************************************************  */
/*  Initialisation  */

/*  As well as the usual check that we have the use of scripts in MASTER.JS 
    and DOCUMENT.JS, we also depend on objects that are implemented in 
    CONTROLS.JS.  */

function CanInitBoxes () 
{
    return typeof IsMasterJsGood == "function" && IsMasterJsGood (window)
        && typeof Viewer == "function" 
        && typeof Viewer.CallWhenInserted == "function"
        && typeof ShowHideControls == "function";
}

/*  We might add a listener for the document's load event, but we might then 
    configure the boxes only to have that DOCUMENT.JS fails at building the 
    viewer. Instead, register to be called back when the viewer is ready.  */

if (CanInitBoxes ()) Viewer.CallWhenInserted (InitBoxes);

/*  ************************************************************************  *
 *        Copyright © 2008-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->