<!--

/*  ************************************************************************  *
 *                                 tocui.js                                   *
 *  ************************************************************************  */

/*  Load by script from TOC.JS. Familiarity is assumed with MASTER.JS and 
    and TOC.JS.  */

/*  This script exists just for adding interactivity to a document page. It 
    was separated from DOCUMENT.JS in 2021.  */

/*  ************************************************************************  */
/*  Configuration  */

/*  A hint about usage is shown while hovering over a list-item's marker 
    box.  */
    
/*  First, the basic operations...  */

var oTreeOperationHints = {
    Expand:         "Click to expand",
    Collapse:       "Click to collapse", 
    ExpandAll:      "Ctrl-Click for complete expansion",
    CollapseAll:    "Ctrl-Shift-Click for complete collapse"
};

/*  Now the possible compounds according to the expansion state... 

    When an operation is redundant, it is better not offered. For instance, 
    the ExpandAll operation is not useful for a (simple) folder that 
    contains no folders or for a folder that is already fully expanded. 

    TO DO: 

    Revisit this when the logic is sorted out correctly for a proper rewrite 
    of the tree implementation.  */

var oTreeHints = {
    Collapsed: {
        Simple:     oTreeOperationHints.Expand,
        Fully:      oTreeOperationHints.Expand,
        General:    oTreeOperationHints.Expand 
                        + "\n" + oTreeOperationHints.ExpandAll
    },
    Expanded: {
        Simple:     oTreeOperationHints.Collapse,
        Fully:      oTreeOperationHints.Collapse 
                        + "\n" + oTreeOperationHints.CollapseAll,
        General:    oTreeOperationHints.Collapse 
                        + "\n" + oTreeOperationHints.ExpandAll 
                        + "\n" + oTreeOperationHints.CollapseAll
    }
};

/*  ************************************************************************  */
/*  Marker Box Measurement  */

function MarkerBoxTracker (ListItem)
{
    this.ListItem = ListItem;
    this.MouseMove = null;
    this.EntryX = null;
    this.EntryY = null;
    this.LastX = null;
    this.LastY = null;
    this.Left = null;
}

MarkerBoxTracker.prototype.Reset = function ()
{
    this.EntryX = null;
    this.EntryY = null;
    this.LastX = null;
    this.LastY = null;
    this.Left = null;
}

MarkerBoxTracker.prototype.Start = function (Event)
{
    this.EntryX = Event.clientX;
    this.EntryY = Event.clientY;
}

MarkerBoxTracker.prototype.Update = function (Event)
{
    /*  The very first update is all we need when the mouse enters the 
        marker box from the left.  */

    if (this.LastX == null 
            && this.EntryY != null
            && Event.clientY == this.EntryY) {

        if (Event.clientX == this.EntryX + 1) {
            this.Left = this.EntryX;
            return true;
        }

        /*  In the odd case that the mouse hasn't actually moved since the 
            start, the next update may as well be the first.  */

        if (Event.clientX == this.EntryX) return false;
    }

    /*  Ordinarily, track the updated position in the hope of eventually 
        catching an exit to the left.  */

    this.LastX = Event.clientX;
    this.LastY = Event.clientY;

    return false;
}

MarkerBoxTracker.prototype.End = function (Event, InMarker)
{
    /*  If we have a result from the first update, be happy.  */

    var left = this.Left;
    if (left != null) return left;

    /*  We have a result from the last update if the mouse is leaving the 
        marker box to the left.  */

    if (InMarker && this.LastY != null && Event.clientY == this.LastY) {
        left = Event.clientX + 1;
        if (left == this.LastX) return left;
    }

    return null;
}

MarkerBoxTracker.prototype.RegisterMouseMove = function (Handler)
{
    if (this.MouseMove != null) return;

    this.MouseMove = window.top.RegisterEventHandler (
        this.ListItem,
        "mousemove",
        Handler);
}

MarkerBoxTracker.prototype.UnregisterMouseMove = function ()
{
    if (this.MouseMove == null) return;

    window.top.UnregisterEventHandler (
        this.ListItem, 
        "mousemove", 
        this.MouseMove);

    this.MouseMove = null;
}

MarkerBoxTracker.prototype.OnMouseMove = function (Event)
{
    if (this.Update (Event)) this.UnregisterMouseMove ();
}

Folder.prototype.StartMarkerBoxMeasurement = function (Event, InMarker)
{
    var tracker = this.MarkerBoxTracker;
    if (tracker == null) {
        tracker = new MarkerBoxTracker (this.ListItem);
        this.MarkerBoxTracker = tracker;
    }
    else {
        tracker.Reset ();
    }

    if (InMarker) tracker.Start (Event);

    var onmousemove = function (Event) {
        tracker.OnMouseMove (Event);
    };
    tracker.RegisterMouseMove (onmousemove);
}

Folder.prototype.EndMarkerBoxMeasurement = function (Event, InMarker)
{
    var tracker = this.MarkerBoxTracker;

    tracker.UnregisterMouseMove ();

    var mbleft = tracker.End (Event, InMarker);
    if (mbleft == null) return null;

    var bbleft = this.ListItem.getBoundingClientRect ().left;
    return mbleft + nListItemImageWidth <= bbleft 
        ? bbleft - (mbleft + (nListItemImageWidth + 1) / 2)
        : null;
}

/*  ************************************************************************  */
/*  Interactivity  */

/*  The essential interactivity is that the user clicks on list-item markers 
    to expand and collapse folders. There are elaborations, including a 
    keyboard interface.  */

/*  ************  */
/*  Mouse Events  */

/*  Did a given mouse event occur in the marker box for the folder's top LI 
    element?  */

Folder.prototype.InMarker = function (Event)
{
    /*  For an LI element, the usual margin, border, padding and content 
        boxes are together just a principal box. There is also a marker box. 
        There is some configurability about the marker box, but also much 
        that varies. Some looks to have been left unspecified in the 
        standards, else misinterpeted. Inevitably, browsers vary. 

        Some of the variability goes away by deliberate configuration. The 
        stylesheet specialises the list-style-position as outside. This 
        means the marker box is outside the border box. Exactly where is one 
        of those things that looks to be unspecified. The marker box may be 
        disjoint from the border box. It may lie inside the margin box, but 
        it need not. 

        Where the variability is most troubling is with the area in which a 
        click sends an "onclick" event to a list item. 

        In the simplest interpretation, which appears to be reliable as the 
        modern implementation, the click is either inside the border box or 
        inside the marker box. This is clean: if the click was anywhere left 
        of the left border, then it can only have hit the marker box! 

        Unfortunately, this is not the interpretation for early versions of 
        Internet Explorer, even in their supposed Standards Mode. It is 
        therefore better to turn the test around: if the click is in the 
        border box, then it is not a click on the marker.  */

    var borderbox = this.ListItem.getBoundingClientRect ();
    if (Event.clientX >= borderbox.left) return false;

    /*  Early versions of Internet Explorer may fire a click event for an LI 
        element even if the click is outside both the marker box and the 
        margin box. What appears to be the implementation is that a 
        clickable box extends as far left as needed to contain the marker 
        box (which is fine) but has the whole height of the LI (which is 
        less helpful). 

        No formal means is known of locating the marker box exactly within 
        the possibly large part of this clickable box that's to the left of 
        the border box. Some heuristics will have to do. 

        First, if the folder is collapsed, then the whole LI, even with 
        margins, is one line of the TOC. The clickable box is not large. 
        That part of it that's to the left of the border is a reasonable 
        approximation of the marker box.  */

    if (!this.Expanded) return true;

    /*  When the folder is expanded, then the clickable box has sufficient 
        height for all the exposed descendants, but these each have their own 
        marker box lower and to the right. The marker box for the LI that has 
        the event must be above all these.  */

    var borderbox = this.FirstChildUL.getBoundingClientRect ();
    return Event.clientY < borderbox.top;
}

/*  ========  */
/*  Tooltips  */

/*  There are two distinct cases of tooltip. Hovering over a list-item 
    marker can usefully tell of options for expanding and collapsing. The 
    rest of the list item has text already, but if this text is only 
    partially visible, we can usefully show the whole as a tooltip.  */

/*  ----------  */
/*  Marker Box  */

Folder.prototype.GetHint = function ()
{
    if (this.Expanded) {
        if (this.Children.length == 0) return oTreeHints.Expanded.Simple;
        if (this.FullyExpanded) return oTreeHints.Expanded.Fully;
        return oTreeHints.Expanded.General;
    }
    else {
        if (this.Children.length == 0) return oTreeHints.Collapsed.Simple;
        if (this.FullyExpanded) return oTreeHints.Collapsed.Fully;
        return oTreeHints.Collapsed.General;
    }
}

/*  We want the tooltip to show for an LI element only while hovering over 
    the marker box, not over the rest of the element. Therefore, we set when 
    entering the marker box and we clear when leaving.  */

Folder.prototype.SetMarkerBoxTooltip = function ()
{
    SetListItemTitle (this.ListItem, this.GetHint ());
}

Folder.prototype.ClearMarkerBoxTooltip = function ()
{
    SetListItemTitle (this.ListItem, "");
}

/*  -------------------  */
/*  Partly Visible Text  */

function IsElementFullyVisible (Element)
{
    var rect = Element.getBoundingClientRect ();
    var scrollbox = new ScrollBox;

    return scrollbox.Left <= rect.left 
        && rect.right <= scrollbox.Right
        && scrollbox.Top <= rect.top
        && rect.bottom <= scrollbox.Bottom;
}

function GetElementText (Element)
{
    /*  Take as granted that we don't have any formatting inside A elements 
        in the TOC. The A will have just the one child and it will be the 
        text we seek. 

        TO DO: Can we take less as granted? Trim trailing white space?  */

    for (var p = Element.firstChild; p != null; p = p.nextSibling) {
        if (p.nodeType == 3) return p.nodeValue;
    }
    return null;
}

/*  Since the text never changes, any tooltip we set for a partly visible 
    element stays in place until we ever learn that the element is fully 
    visible. */

Toc.prototype.SetElementTooltip = function (Element)
{
    /*  A fully visible element needs no tooltip. A partially visible 
        element may have a tooltip from an earlier hover.  */

    if (IsElementFullyVisible (Element)) {
        if (Element.title) Element.title = "";
    }
    else {
        if (!Element.title) Element.title = GetElementText (Element);
    }
}

/*  =====  */
/*  Click  */

Folder.prototype.OnClick = function (Event)
{
    /*  A simple click (with none of Ctrl, Alt or Shift down) just toggles 
        the folder's expansion state.  */

    if (!Event.ctrlKey) {
        if (!Event.altKey) {
            if (!Event.shiftKey) {
                this.Expanded ? this.Collapse () : this.Expand ();
                return true;
            }
        }
        else {

            /*  Hold the Alt key down, alone, just to get the focus moved to 
                the folder's link (if it has one).  */

            if (!Event.shiftKey) return true;
        }
    }

    /*  Hold the Ctrl key down to act on subfolders too: by itself to 
        expand the folder and subfolders, even if any are already expanded; 
        with the Shift key to collapse, even if any are already collapsed.  */

    else if (!Event.altKey) {
        if (!Event.shiftKey) {
            this.ExpandFull ();
        }
        else {
            this.CollapseFull ();
        }
        return true;
    }

    return false;
}

Toc.prototype.OnClick = function (Event)
{
    var master = window.top;

    var src = master.GetEventSource (Event);
    if (src.nodeName == "LI") {
        var folder = GetElementFolder (src);
        if (folder != null && folder.InMarker (Event)) {
            if (folder.OnClick (Event)) folder.SetFocus ();
        }
        return;
    }

    master.RedirectClickedLink (Event, this.Root);
}

Toc.prototype.OnContextMenu = function (Event)
{
    window.top.RedirectClickedLink (Event, this.Root);
}

/*  =====  */
/*  Hover  */

/*  We have two interests with mouse events that tell of hovering. One is to 
    show tooltips. The other, initially experimental, is that if the user 
    does happen to hover near a list-item marker, we may as well take the 
    opportunity to check the marker's position relative to the list item and 
    possibly then reconfigure the TOC sight lines.  */

Toc.prototype.OnMouseOverFolder = function (Event, Folder)
{
    var inmarker = Folder.InMarker (Event);
    if (inmarker) Folder.SetMarkerBoxTooltip ();

    if (this.Alignment.Measured != null) return;

    Folder.StartMarkerBoxMeasurement (Event, inmarker);
}

Toc.prototype.OnMouseOutFolder = function (Event, Folder)
{
    var inmarker = Folder.InMarker (Event);
    if (inmarker) Folder.ClearMarkerBoxTooltip ();

    var alignment = this.Alignment;
    if (alignment.Measured != null) return;

    var margin = Folder.EndMarkerBoxMeasurement (Event, inmarker);
    if (margin == null) return;

    alignment.Set (margin);
}

Toc.prototype.OnMouseOver = function (Event)
{
    var src = window.top.GetEventSource (Event);
    switch (src.nodeName) {

        case "A":
        case "SPAN": {
            this.SetElementTooltip (src);
            return;
        }

        case "LI": {
            var folder = GetElementFolder (src);
            if (folder != null) this.OnMouseOverFolder (Event, folder);
            return;
        }
    }
}

Toc.prototype.OnMouseOut = function (Event)
{
    var src = window.top.GetEventSource (Event);
    if (src.nodeName == "LI") {

        var folder = GetElementFolder (src);
        if (folder != null) this.OnMouseOutFolder (Event, folder);
    }
}

/*  ==========  */
/*  Miscellany  */

/*  TO DO: 

    This was specific to Internet Explorer. It's needed so that clicking 
    with the Ctrl or Shift key down does not select text. Find out, some 
    time, what to do about standardisation.  */

Toc.prototype.OnSelectStart = function (Event)
{
    window.top.SetEventDone (Event);
}

/*  ***************  */
/*  Keyboard Events  */

/*  Our keyboard interface does much the same as clicking on a list-item 
    marker except that the only list item it can operate on is the one that 
    has the keyboard focus. 

    We act on just a handful of keys. By the time the following is called, 
    the keycode is one-to-one with the desired operation.  */

Folder.prototype.OnKeyDown = function (KeyCode)
{
    switch (KeyCode) {
        case 0x6B: {                            // number pad +
            this.Expand ();
            break;
        }
        case 0x6D: {                            // number pad -
            this.Collapse ();
            break;
        }
        case 0x6A: {                            // number pad *
            this.ExpandFull ();
            break;
        }
        case 0x6F: {                            // number pad /
            this.CollapseFull ();
            break;
        }
    }
}

Toc.prototype.GetKeyDownFolder = function (KeyCode, Event)
{
    /*  Our keyboard interface is only for a few keys on the (rarely used) 
        number pad, and only then by themselves. Mostly, we'll be doing 
        nothing and we want that we know this as soon as possible.  */

    switch (KeyCode) {

        case 0x6B:                              // number pad +
        case 0x6D:                              // number pad -
        case 0x6A:                              // number pad *
        case 0x6F: {                            // number pad /

            /*  Even for the few keys we act on, we skip if any of Ctrl, Alt 
                or Shift is down.  */

            if (Event.ctrlKey || Event.altKey || Event.shiftKey) return null;

            /*  Only now that an operation is required do we look into what 
                we're to do with what folder. Take our cue entirely from 
                whatever is the source of the event.  */

            var src = window.top.GetEventSource (Event);

            /*  This must, by definition, be an element that can have the 
                keyboard focus. Ideally - certainly most simply - it's an A 
                (or SPAN) in an LI which is in turn the folder to operate 
                on.  */

            var folder = GetElementFolder (src);
            if (folder != null) return folder;

            /*  When the source is in an LI that is not a folder, expansion 
                is meaningless but we can usefully interpret collapsing as 
                applying to the enclosing folder. Take care to shift not 
                just our attention but the focus too: it must not stay with 
                an element that's soon to be invisible.  */

            if (KeyCode == 0x6D || KeyCode == 0x6F) {
                folder = GetEnclosingFolder (src);
                if (folder != null) folder.SetFocus ();
            }
            return folder;
        }

        default: return null;
    }
}

Toc.prototype.OnKeyDown = function (Event)
{
    var keycode = Event.keyCode;

    var folder = this.GetKeyDownFolder (keycode, Event);
    if (folder == null) return;

    folder.OnKeyDown (keycode);

    window.top.SetEventDone (Event);
}

/*  ************************************************************************  */
/*  Load-Time Initialisation  */

Toc.prototype.InitTocUI = function ()
{
    var master = window.top;
    var toc = this;

    var onclick = function (Event) {
        toc.OnClick (Event);
    };
    var oncontextmenu = function (Event) {
        toc.OnContextMenu (Event);
    };
    var onkeydown = function (Event) {
        toc.OnKeyDown (Event);
    };
    var onmouseout = function (Event) {
        toc.OnMouseOut (Event);
    };
    var onmouseover = function (Event) {
        toc.OnMouseOver (Event);
    };
    var onselectstart = function (Event) {
        toc.OnSelectStart (Event);
    };

    master.RegisterEventHandler (this.Root, "click", onclick);
    master.RegisterEventHandler (this.Root, "contextmenu", oncontextmenu);
    master.RegisterEventHandler (this.Root, "keydown", onkeydown);
    master.RegisterEventHandler (this.Root, "mouseout", onmouseout);
    master.RegisterEventHandler (this.Root, "mouseover", onmouseover);
    master.RegisterEventHandler (this.Root, "selectstart", onselectstart);
}

/*  ************************************************************************  *
 *        Copyright © 2007-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->