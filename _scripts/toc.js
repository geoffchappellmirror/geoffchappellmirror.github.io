<!--

/*  ************************************************************************  *
 *                                  toc.js                                    *
 *  ************************************************************************  */

/*  Include in the HEAD of each table-of-contents page. Include MASTER.JS 
    first.  */

/*  This script is still heavy with some of the site's oldest code. It is 
    the last to get attended to properly for the big review in 2021. Much of 
    it is ugly. All needs to be rethought from scratch.  */

/*  ************************************************************************  */

/*  This website has several table-of-contents (TOC) pages. Each exists 
    solely to present a multi-level list of links for navigation. A list 
    item that has a list nested beneath it is called a folder item. Anything 
    else is a page item. Typically, but not necessarily, each list item has 
    a link to a document page, i.e., an HTM page that is intended for 
    presentation in the document panel. 

    It is important that sections of the list can be expanded and collapsed 
    at the user's direction. These changes to the visual rendering of the 
    list are eased by cooperation with a style sheet (TOC.CSS).  */

/*  ************************************************************************  */
/*  Configuration  */

/*  ID for TOC root  */

var sTocRoot = "Root";

/*  Class names for LI elements  */

var sPageClass = "Page";
var sCollapsedClass = "Collapsed";
var sExpandedClass ="Expanded";
var sInitiallyExpandedClass = "Expanded Folder";

/*  Class names for A elements  */

var sCurrentLink = "Current";
var sOtherLink = "";

/*  The images for the list-item markers are all specified in the stylesheet 
    but our heuristic determination of alignment requires some knowledge of 
    the dimensions.  */

var nListItemImageWidth = 9;

/*  Interactivity is handled by a separate script. The following pathname 
    must be absolute (not relative).  */

var sTocUIScriptPathname = "/_scripts/tocui.js";

/*  ************************************************************************  */
/*  DOM Helpers  */

/*  Begin with functions that work just with DOM elements. These help later 
    functions that implement the TOC and its folders as objects.  */

/*  ===  */
/*  TOC  */

/*  Each TOC.HTM has just the one TOC. This is a UL (though perhaps it ought 
    to be an OL) which has beneath it a possibly deep nesting of possibly 
    many UL and LI elements. The LI elements are the TOC's folders and 
    pages.  */

function GetTocRoot ()
{
    /*  Each TOC.HTM exists for very little but the TOC. Both as a default 
        and as ordinary practice, the root is the first UL that is a direct 
        child of the BODY. Well, that's how it used to be. Because of a bug 
        that lived for 3-4 years in some browsers - not Internet Explorer - 
        the BODY must have a DIV for scrolling, and this DIV in turn has the 
        TOC root. 

        It always was that the author could vary from the default and label 
        any other UL as the root. This was ordinary practice even for a root 
        that is the only UL among the body's children. Working around the 
        browser bug has required that every TOC be edited. A side-effect is 
        that every TOC has been checked for a labelled root. Absence is now 
        an error that we do not trouble to make good.  */

    var root = window.document.getElementById (sTocRoot);
    return root != null && root.nodeName == "UL" ? root : null;
}

/*  ==========  */
/*  List Items  */

/*  Given any HTML element, return the LI that either is the element or is 
    the nearest LI among the element's ancestors.  */

function GetListItem (Element)
{
    for (var p = Element; p != null; p = p.parentNode) {
        if (p.nodeName == "LI") return p;
        if (p.id == sTocRoot) break;
    }
    return null;
}

function SetListItemClassName (ListItem, Class)
{
    if (ListItem.className != Class) ListItem.className = Class;
}

function SetListItemTitle (ListItem, Title)
{
    if (ListItem.title != Title) ListItem.title = Title;
}

/*  -------  */
/*  Folders  */

/*  Get the first UL among an LI element's children. A list item that has a 
    list beneath it is a folder. Finding this UL is therefore also a test of 
    whether the list item is a folder.  */

function GetListItemSubList (ListItem)
{
    /*  The LI for a folder has among its children at least one UL, possibly 
        more, even many. Typically, this UL wil be the first child.  */

    for (var p = ListItem.firstChild; p != null; p = p.nextSibling) {
        if (p.nodeName == "UL") return p;
    }
    return null;
}

/*  Get the last LI among the given LI element's descendants. This is needed 
    only for an ugly hack at and soon after loading.  */

function GetLastDescendantListItem (ListItem)
{
    for (var p = ListItem.lastChild; p != null; p = p.previousSibling) {
        if (p.nodeName == "UL") {
            for (var q = p.lastChild; q != null; q = q.previousSibling) {
                if (q.nodeName == "LI") return GetLastDescendantListItem (q);
            }
        }
    }
    return null;
}

/*  =====  */
/*  Links  */

/*  Get the link for a given LI element. This is the first A before any UL 
    among the list item's children. 

    An A after a UL would be semantically difficult. Its existence is here 
    dismissed as an error by the TOC's author. We simply never notice any 
    such A. By contrast, an A before a UL could be semantically sensible 
    even if not an immediate child - but we presently ignore this too.  */

function GetListItemLink (ListItem)
{
    /*  Typically the desired A will be the very first child.  */

    for (var p = ListItem.firstChild; p != null; p = p.nextSibling) {
        if (p.nodeName == "A") return p;
        if (p.nodeName == "UL") return null;
    }
    return null;
}

/*  Search a collection of links for the one that links to the given URL. 

    TO DO:

    Consider whether this search can be avoided. Surely we only ever look 
    during initialisation and could have our answer by checking while we 
    enumerate all the LI elements. Of course, that it can be avoided doesn't 
    mean it's better avoided.  */

function FindUrlInLinks (Links, Url)
{
    var numlinks = Links.length;
    for (var n = 0; n < numlinks; n ++) {
        var a = Links [n];
        if (a.href == Url) return a;
    }
    return null;
}

/*  =====  */
/*  Focus  */

/*  We have a keyboard interface, which presents two tasks. The relatively 
    straightforward one is that we'd like the focus to start with the link 
    to whatever page currently shows in the document panel. The other is 
    that the keyboard interface has to act on folders that don't have 
    links.  */

function EnsureCanFocus (ListItem)
{
    /*  If the list item has a link, then the link should already be able to 
        receive the focus.  */

    if (GetListItemLink (ListItem) != null) return;

    /*  The case to ensure is when the list item is a folder that does not 
        have a link. Wrap all the folder's text into a SPAN and set the SPAN 
        as a tab stop. 

        Setting the tabindex property on elements that don't have links is 
        convenient for keyboard navigation and is very successful in 
        Internet Explorer but is seen to make trouble for other browsers. 
        For instance, some extend the focus to the items in the level 
        beneath. It's unclear what to do about this. 

        For now, we keep what works in Internet Explorer. If we can't set 
        the focus to a folder that does not itself have a link, how can the 
        folder be opened with the keyboard interface? 

        As for the coding, below, any LI that has neither link nor text is a 
        mistake. So keep to the simple code, not minding that it creates an 
        empty SPAN in a defective case. 

        TO DO: 

        There can be very many of these. The time taken adds up. Find some 
        rearrangement that makes this change only once the list itme is 
        visibile.  */

    var span = window.document.createElement ("SPAN");
    span.tabIndex = 0;
    var p = ListItem.firstChild;
    while (p != null && p.nodeName != "UL") {
        span.appendChild (p);
        p = ListItem.firstChild;
    }
    ListItem.insertBefore (span, p);
}

/*  Set the focus to the given list item - meaning specifically to its 
    link if it has one, else to the SPAN we confected for a folder that 
    has no link.  */

function SetFocus (ListItem)
{
    var p = GetListItemLink (ListItem);
    if (p == null) {
        p = ListItem.firstChild;
        if (p.nodeName != "SPAN" || p.tabIndex == null) return;
    }
    p.focus ();
}

/*  ************************************************************************  */
/*  User-Defined Objects  */

/*  The old implementation tracked the whole TOC in global variables, mostly 
    as arrays indexed by folder number, but even with arrays of arrays. Now 
    we have a separate object for each folder and another for the whole TOC.  */

/*  =============  */
/*  Folder Object  */

function Folder (Tree, FolderNumber, ListItem, FirstChildUL)
{
    /*  TO DO: 

        Try to eliminate the back-link to the tree. It creates a circular 
        chain of references. Whether this then stops the tree or folder from 
        being deleted is not known, but why invite the problem?  */

    this.Tree = Tree;

    /*  Every folder is numbered during enumeration. The numbering is vital 
        to the persistence of the TOC expansion state when navigating 
        between pages in the same subweb.  */

    this.FolderNumber = FolderNumber;

    /*  The LI element that's the folder in the DOM tree.  */

    this.ListItem = ListItem;

    /*  The UL element that continues the list beneath the folder's LI 
        element  */

    this.FirstChildUL = FirstChildUL;

    /*  The folder knows its place in the tree from references to the one 
        Folder object for its parent and to potentially many for its 
        children. That parent and child have references to each other is 
        more circularity.  */

    this.Parent = null;
    this.Children = new Array ();

    /*  References to folders even deeper into the tree  */

    this.FirstDescendant = null;
    this.LastDescendant = null;

    /*  A boolean for whether the folder is expaneded, else collapsed, but 
        null until this expansion state is known (which it needn't be until 
        the parent is expanded or collapsed)  */

    this.Expanded = null;

    /*  Bookkeeping for what options to show in a tooltip for the folder's 
        list-item marker  */

    this.FullyExpanded = false;
    this.FullyExpandedChildren = 0;

    this.MarkerBoxTracker = null;

    /*  Provide for easily getting the folder object from the list item.  */

    ListItem.Folder = this;
}

Folder.prototype.Insert = function (ParentListItem)
{
    /*  The given list item is the nearest ancestor LI to the folder's own 
        LI. It is necessarily a folder and is specifically this folder's 
        parent folder. 

        Map this folder to its parent. Add it to its parent's list of 
        children.  */

    var parent = ParentListItem.Folder;
    this.Parent = parent;

    parent.Children.push (this);

    /*  It perhaps does not cost very much if we also track for each 
        ancestor the range of folder numbers for its descendants. This 
        allows the "full" expansion of folders a faster implementation 
        without recursion.  */

    if (parent.FirstDescendant == null) {
        parent.FirstDescendant = parent.LastDescendant = this;
    }

    for (var p = parent; p != null; p = p.Parent) {
        if (this.FolderNumber > p.LastDescendant.FolderNumber) {
            p.LastDescendant = this;
        }
    }
}

/*  Given any HTML element, if the corresponding list item is a folder, 
    return the folder object.  */

function GetElementFolder (Element)
{
    var li = GetListItem (Element);
    return li != null ? li.Folder : null;
}

/*  Given any HTML element, return the corresponding list item's closest 
    ancestor that is a folder. This is the folder that would have to be 
    expanded if the given element is to be seen.  */

function GetEnclosingFolder (Element)
{
    var li = GetListItem (Element);
    if (li == null) return null;

    /*  If the corresponding list item is a folder, we know its parent.  */

    var folder = li.Folder
    if (folder != null) return folder.Parent;

    /*  Otherwise, the next LI up the tree must be a folder (since it has 
        an LI beneath it).  */

    return GetElementFolder (li.parentNode);
}

Folder.prototype.SetFocus = function ()
{
    SetFocus (this.ListItem);
}

/*  ==========  */
/*  TOC Object  */

function Toc ()
{
    /*  Reference to the UL element that starts the TOC  */

    this.Root = null;

    /*  References to all the Folder objects, in order of increasing folder 
        number 

        TO DO: Can we eliminate this?  */

    this.Folders = new Array;

    /*  The expansion state of all the folders, in order of increaing folder 
        number 

        TO DO: 

        Can we eliminate this? Each Folder object has the same expansion 
        state.  */

    this.Expanded = new Array;

    /*  Each time the TOC loads, one link becomes current, namely the one 
        that represents whatever page is loaded into the document frame.  */

    this.CurrentLink = null;

    /*  Let's also distinguish the very first link, if only for use as a 
        default.  */

    this.HomeLink = null;

    /*  A count of all links is available for showing in the status bar (not 
        that modern browsers have any such thing).  */

    this.LinkCount = 0;

    /*  An experimental provision for heuristically determinating the 
        list-item alignment  */

    this.Alignment = null;

    /*  The last is used only for a hack and is needed only during 
        initialisation. It might better be moved to the initialisation 
        context.  */

    this.LastInitiallyDisplayedListItem = null;
}

Toc.prototype.InitListItem = function (ListItem)
{
    /*  Count the list items that have links: the total can contribute to a 
        summary in the window's status bar.  */

    if (GetListItemLink (ListItem) != null) this.LinkCount ++;

    /*  A list item that has no list beneath it is only a page item and has 
        no further interest.  */

    var ul = GetListItemSubList (ListItem);
    if (ul == null) return;

    /*  With a UL beneath it, the list item is a folder, and needs more 
        substantial preparation. For one thing, it gets a folder object. 
        Each folder object tracks its children, but the TOC object tracks 
        all folders and numbers them.  */

    var folder = new Folder (this, this.Folders.length, ListItem, ul);
    this.Folders.push (folder);

    /*  Map the folder to its parent. If there is a parent, add the newly 
        numbered folder to the parent's list of children.  */

    var li = GetListItem (ListItem.parentElement);
    if (li != null) folder.Insert (li);

    /*  Ensure that every folder is capable of receiving the focus.  */

    EnsureCanFocus (ListItem);
}

Toc.prototype.InitFolders = function ()
{
    this.Root = GetTocRoot ();
    if (this.Root == null) return;

    /*  Enumerate the LI elements, identifying the folder items and 
        initialising them (which means to number them and to build whatever 
        information we mean to keep, for efficiency, about relationships
        between them).  */

    var list = this.Root.getElementsByTagName ("LI");
    var count = list.length;
    for (var n = 0; n < count; n ++) {
        this.InitListItem (list [n]);
    }
}

/*  The SetCurrentLink function is to be called from the onload handler once 
    it is known which link matches whatever page is being shown in the 
    document frame.  */

Toc.prototype.SetCurrentLink = function (Link)
{
    this.CurrentLink = Link;

    /*  The current link is highlighted.  */

    Link.className = sCurrentLink;

    /*  The current link does not always have the focus, but it does always 
        start with the focus.  */

    if (Link != window.document.activeElement) {

        /*  TO DO: 

            Internet Explorer 7 throws an exception here if the focus is not 
            already in the TOC frame.  */

        var e;
        try {
            Link.focus ();
        }
        catch (e) {
        }
    }
}

Toc.prototype.GetDocumentLink = function (Document)
{
    /*  TO DO: Ideally, Document can't be null. Check.  */

    if (Document == null) return this.HomeLink;

    /*  If the given document page is already a known link, then we can save 
        some trouble.  */

    if (this.CurrentLink != null && Document == this.CurrentLink.href) {
        return this.CurrentLink;
    }
    if (this.HomeLink != null && Document == this.HomeLink.href) {
        return this.HomeLink;
    }

    /*  Ordinarily, search all the links in the TOC.  */
    
    var links = this.Root.getElementsByTagName ("A");
    if (links.length == 0) return null;

    if (this.HomeLink == null) this.HomeLink = links [0];
    if (Document == null) return this.HomeLink;

    var a = FindUrlInLinks (links, Document);
    if (a != null) return a;

    /*  Although every link from within the site should specify a file, links 
        from outside may specify a directory, expecting the site to add a 
        default filename. Given that the link hasn't matched any in the TOC, 
        it perhaps does not hurt to add the default filename and retry.  */

    return FindUrlInLinks (links, window.top.PathAppend (Document, null));
}

/*  ************************************************************************  */
/*  Folder Expansion  */

/*  A folder can at any time be in one of three expansion states: namely, 
    expanded, collapsed or undefined. A folder is also at any time either 
    visible or not. However, the combination of undefined with visible is 
    not permitted. 

    Transitions are performed by two operators. The "expand" and "collapse" 
    operators change a folder from any state to the expanded and collapsed 
    state, respectively. The folder's own visibility does not change. That 
    of its children do. 

    Under the "expand" operator, every child item becomes visible. A child 
    item that has the expanded or collapsed state keeps that state, but 
    undefined changes to collapsed. Under the "collapsed" operator, every 
    child item becomes invisible but none changes its expansion state. 

    One folder, here called the top folder, is the ancestor of all others. 
    In the initial state, this folder is collapsed and visible.  */

Folder.prototype.TrackFullyExpanded = function (Expanded)
{
    /*  A folder is fully expanded if all its child folders are fully 
        expanded - independently of whether the folder itself is expanded.  */

    if (Expanded) {

        /*  Since this folder was not expanded, none of its ancestor folders 
            can have been fully expanded - but this expansion can be the one 
            that changes all that.  */

        for (var folder = this.Parent; folder != null; folder = folder.Parent) {
            folder.FullyExpandedChildren ++;
            if (folder.FullyExpandedChildren != folder.Children.length) break;
            folder.FullyExpanded = true;
            if (!folder.Expanded) break;
        }
    }
    else {

        /*  When this folder is collapsed, no ancestor folder can remain 
            fully expanded.  */

        for (var folder = this.Parent; folder != null; folder = folder.Parent) {
            folder.FullyExpandedChildren --;
            if (!folder.FullyExpanded) break;
            folder.FullyExpanded = false;
        }
    }
}

Folder.prototype.SetExpanded = function (Expanded)
{
    if (this.Expanded == Expanded) return;
    this.Expanded = Expanded;

    this.Tree.Expanded [this.FolderNumber] = Expanded;

    /*  If the folder is fully expaneded, then expanding or collapsing it 
        involves bookkeeping for ancestors. 

        Remember, by the way, that the only reason we do this bookkeeping is 
        for the hint we provide when the mouse hovers over the folder's 
        list-item marker.  */

    if (this.FullyExpanded) this.TrackFullyExpanded (Expanded);

    /*  The visual indicator of whether a folder is expanded or collapsed 
        comes from changing the class.  */

    SetListItemClassName (
        this.ListItem, 
        Expanded ? sExpandedClass : sCollapsedClass);
}

/*  ====================  */
/*  Expansion Operations  */

Folder.prototype.Expand = function ()
{
    /*  Since expansion of a visible folder makes child folders visible, 
        first ensure that every child folder has a well-defined expansion 
        state. Default to collapsed so that a first expansion expands only 
        one level.  */

    var children = this.Children;
    var count = children.length;
    for (var n = 0; n < count; n ++) {
        var child = children [n];
        if (child.Expanded == null) child.SetExpanded (false);
    }
    this.SetExpanded (true);
}

Folder.prototype.Collapse = function ()
{
    this.SetExpanded (false);
}

Folder.prototype.ExpandFull = function ()
{
    var children = this.Children;
    var count = children.length;
    for (var n = 0; n < count; n ++) {
        children [n].ExpandFull ();
    }
    this.SetExpanded (true);
}

Folder.prototype.CollapseFull = function ()
{
    this.SetExpanded (false);

    var children = this.Children;
    var count = children.length;
    for (var n = 0; n < count; n ++) {
        children [n].CollapseFull ();
    }
}

Folder.prototype.ExpandInit = function () 
{
    /*  TO DO: Initialise from persistent state.  */

    var children = this.Children;
    var count = children.length;
    for (var n = 0; n < count; n ++) {
        children [n].ExpandInit ();
    }
    if (count == 0) this.FullyExpanded = true;
    if (this.ListItem.className == sInitiallyExpandedClass) {
        this.SetExpanded (true);
    }
    else {
        SetListItemClassName (this.ListItem, sCollapsedClass);
    }
}

/*  =====================  */
/*  Expansion Persistence */

function BuildStateString (State, Expand, All)
{
    var str = null, first = null, last = null;
    for (var i in State) {

        if (State [i] != Expand) {
            All = false;
            continue;
        }

        i = parseInt (i);
        if (str == null) {
            first = last = i;
            str = first;
        }
        else if (i == last + 1) {
            last = i;
        }
        else {
            if (first != last) {
                str += (last == first + 1 ? "," : "-") + last;
            }
            first = last = i;
            str += "," + first;
        }
    }
    if (first != null && first != last) {
        str += (last == first + 1 ? "," : "-") + last;
    }
    return All ? "all" : str;
}

Toc.prototype.GetExpansionState = function (Document)
{
    var state = new Array ();
    var gotexpanded = false;
    var gotcollapsed = false;
    var all = true;

    /*  For each folder whose expansion state is not (still) undefined, 
        check whether any child folder is expanded.  */

    for (var i in this.Expanded) {
        var folder = this.Folders [i];

        /*  TO DO: Can't this be tracked during expansion?  */

        var hasexpandedchild = false;
        var children = folder.Children;
        var count = children.length;
        for (var n = 0; n < count; n ++) {
            if (children [n].Expanded) {
                hasexpandedchild = true;
                break;
            }
        }

        /*  If a folder is expanded but has at least one expanded child, 
            then the folder's expanded state can be regenerated from the 
            child, and needn't be recorded. 

            The opposite applies if a folder is collapsed but has any 
            expanded child. The collapsed state must be recorded, if only 
            to stop the false regeneration of an expanded state from the 
            child.  */
            
        if (folder.Expanded) {
            if (!hasexpandedchild) {
                state [i] = true;
                gotexpanded = true;
            }
        }
        else {
            if (hasexpandedchild) {
                state [i] = false;
                gotcollapsed = true;
            }
            all = false;
        }
    }

    /*  The ancestor folders of the given document can all be known from the 
        document, and need not be recorded.  */

    var a = this.GetDocumentLink (Document);
    if (a != null) {
        for (var folder = GetEnclosingFolder (a); 
                folder != null; 
                folder = folder.Parent) {
            delete state [folder.FolderNumber];
        }
    }

    /*  The root folder will always get expanded. 

        TO DO: 

        But if the root folder is collapsed, should it not still be after 
        the navigation?  */

    delete state [0];

    /*  Build comma-separated descriptions of the expanded and collapsed 
        folders. Separate these two with a semicolon.  */

    var xstr = gotexpanded ? BuildStateString (state, true, all) : null;
    if (xstr == null) return null;
    var cstr = gotcollapsed ? BuildStateString (state, false, false) : null;
    return cstr != null ? xstr + ";" + cstr : xstr;
}

function ExpansionState ()
{
    this.InitExpand = null;
    this.InitCollapse = null;
}

ExpansionState.prototype.Load = function (Arg)
{
    var parts = Arg.split (";");
    if (parts.length > 0) {
        this.InitExpand = parts [0];
        if (parts.length > 1) this.InitCollapse = parts [1];
    }
    return this;
}

ExpansionState.prototype.Parse = function (Expand, FolderState, FolderCount)
{
    var str = Expand ? this.InitExpand : this.InitCollapse;
    if (str == null) return;

    /*  The string may be a keyword to direct expansion of "all" folders.  */

    if (Expand && str == "all") {
        for (var i = 0; i < FolderCount; i ++) {
            FolderState [i] = true;
        }
    }
    else {

        /*  In general, however, the string is a sequence of ranges 
            separated by commas. Each range is either a single folder number 
            or a pair (first and last) separated by a hyphen.  */

        var args = str.split (",");
        for (var n in args) {
            var range = args [n].split ("-");
            if (range.length > 0) {

                /*  Extract the folder numbers from the range, and validate 
                    them. Treat a single folder number as a trivial pair.  */

                var first = parseInt (range [0]);
                if (!(0 <= first && first < FolderCount)) return null;
                var last = first;
                if (range.length > 1) {
                    last = parseInt (range [1]);
                    if (!(0 <= last && last < FolderCount)) return null;
                    if (range.length > 2) return null;
                }

                for (var i = first; i <= last; i ++) {
                    FolderState [i] = Expand;
                }
            }
        }
    }
}

Toc.prototype.InitExpansion = function (InitialState, Doc)
{
    this.Folders [0].Collapse ();

    var lastexpanded = null;

    var a = this.GetDocumentLink (Doc);
    if (a == null) return this.HomeLink;

    var state = new Array ();
    if (InitialState != null) {
        var numfolders = this.Folders.length;
        InitialState.Parse (true, state, numfolders);
        if (state.length != 0) InitialState.Parse (false, state, numfolders);
    }

    var folder = GetEnclosingFolder (a);
    if (folder != null) state [folder.FolderNumber] = true;

    for (i in state) {
        folder = this.Folders [i];
        if (state [i]) {

            folder.Expand ();

            for (var parent = folder.Parent; 
                    parent != null && state [parent.FolderNumber] == null; 
                    parent = parent.Parent) {
                if (!parent.Expanded) parent.Expand ();
            }

            if (lastexpanded == null || i > lastexpanded) lastexpanded = i;
        }
        else {
            folder.Collapse ();
        }
    }

    /*  Always expand the top level.  */

    this.Folders [0].Expand ();

    if (lastexpanded == null) lastexpanded = 0;

    this.LastInitiallyDisplayedListItem 
        = GetLastDescendantListItem (this.Folders [lastexpanded].ListItem);

    return a;
}

/*  ************************************************************************  */
/*  Scrolling  */

function ScrollBox ()
{
    /*  Adjust according to whether the stylesheet has the scrollbars on the 
        HTML or the BODY. Surprise, surprise, but it turns out that this 
        troubles some browsers so much that can end up showing working 
        scrollbars but with no active scrollLeft or scrollTop on either the 
        HTML or BODY elements. We have ended up putting our scrollbars on a 
        DIV.  */

    var root = window.document.getElementById ("Toc");

    this.Left = root.scrollLeft;
    this.Top = root.scrollTop;

    this.Right = this.Left + root.clientWidth;
    this.Bottom = this.Top + root.clientHeight;

    this.Root = root;
}

ScrollBox.prototype.GetTopForVisibleLink = function (Link)
{
    var arect = Link.getBoundingClientRect ();

    /*  It's neater to align the top of the containing LI (and perhaps even 
        a pixel or two above that).  */
    
    var li = GetListItem (Link);
    var lirect = li.getBoundingClientRect ();

    var top = lirect.top;
    var bottom = arect.bottom;

    /*  The rectangle we're given is relative to where the client window is 
        scrolled.  */

    top += this.Top;
    bottom += this.Top;

    /*  The cases that are most easily dealt with (and may be anyway the 
        most common in practice) have the link at least partly in view. Get 
        to these first.  */

    if (bottom <= this.Bottom) {

        if (top >= this.Top) {

            /*  The whole element is already visible in the client area. Do 
                nothing.  */

            return this.Top;
        }

        if (bottom >= this.Top) {

            /*  The element is partly visible at the top of the client area. 
                A little move is all that's needed.  */

            return top;
        }
    }
    else {

        if (top < this.Top) {

            /*  The element straddles the client area. This case is not 
                anticipated in practice - at least, not while the element is 
                expected to be just a link, which is in all typical use of 
                negligible height relative to the TOC frame.  */

            return top;
        }
        
        if (top <= this.Bottom) {

            /*  The element is partly visible at the bottom of the client 
                area. This doesn't seem like good cause for much change. 
                Just nudge the scrolling enough to make the element wholly 
                visible.  */

            return this.Top - (this.Bottom - bottom);
        }
    }

    /*  The element is wholly outside the client area. Bringing it into 
        view is unavoidably a large change in appearance. There's possibly 
        no entirely satisfactory strategy. At least seek some sort of 
        natural boundary to scroll to the top. 

        First, an obvious special case. If the link to show is the very first, 
        then obviously scroll to the top!  */
        
    if (li.Folder != null && li.Folder.FolderNumber == 0) return 0;

    /*  If all else fails, scroll the element to the top. Better is to have 
        its containing folder at the top. Better yet is to work up through 
        as many levels as would keep the element in sight.  */

    var newtop = top;
    for (var folder = GetEnclosingFolder (Link); folder != null; folder = folder.Parent) {
        var enctop = folder.ListItem.getBoundingClientRect ().top;
        enctop += this.Top;
        if (folder.FolderNumber == 0) enctop = 0;
        if (bottom > enctop + this.Bottom - this.Top) break;
        newtop = enctop;
    }
    return newtop;
}

ScrollBox.prototype.AdjustForVisibleLink = function (Link)
{
    var top = this.GetTopForVisibleLink (Link);
    if (top == this.Top) return false;
    this.Bottom += top - this.Top;
    this.Top = top;
    return true;
}

ScrollBox.prototype.UpdateWindow = function (Left, Top)
{
    if (Left != this.Left) this.Root.scrollLeft = Left;
    if (Top != this.Top) this.Root.scrollTop = Top;
}

/*  ========================  */
/*  Scroll State Persistence  */

function ScrollState (ScrollBox)
{
    if (arguments.length < 1 || ScrollBox == null) {

        this.X = null;
        this.Y = null;

        return;
    }

    this.X = ScrollBox.Left;
    this.Y = ScrollBox.Top;
}

ScrollState.prototype.SetScroll = function ()
{
    var scrollbox = new ScrollBox;
    if (this.X == null && this.Y == null) return scrollbox;
    scrollbox.UpdateWindow (this.X, this.Y);
    return new ScrollBox;
}

ScrollState.prototype.Load = function (Arg)
{
    var args = Arg.split (",");
    if (args.length == 2) {
        this.X = args [0];
        this.Y = args [1];
    }
    return this;
}

ScrollState.prototype.toString = function ()
{
    if (this.X == 0 && this.Y == 0) return null;
    return Math.round (this.X) + "," + Math.round (this.Y);
}

Toc.prototype.GetScrollState = function ()
{
    return new ScrollState (new ScrollBox);
}

Toc.prototype.SetScroll = function (State, Link)
{
    var scrollbox = State != null ? State.SetScroll () : new ScrollBox;

    scrollbox.UpdateWindow (
        scrollbox.Left, 
        scrollbox.GetTopForVisibleLink (Link));
}

/*  Scrolling  */
/*  ************************************************************************  */
/*  Alignment  */

/*  Our measure of alignment is the margin-left for LI elements. We can get 
    this as text in two ways. It can be specified in a URL search-string 
    argument. It can be read from a rule in TOC.CSS. The latter is in effect 
    a default.  */

function ParseListItemMargin (Margin)
{
    /*  Parse the given margin as a number and units.  */

    var parts = Margin.match (/^(\d+)(.*)/);
    if (parts == null || parts.length < 3) return null;

    /*  We expect either no units or "px".  */

    return parts [2] == "" || parts [2] == "px" ? parts [1] : null;
}

function AlignmentState ()
{
    this.Rule = null;
    this.Css = null;
    this.Specified = null;
    this.Measured = null;
}

AlignmentState.prototype.LoadFromCss = function ()
{
    var master = window.top;
    var sheet = master.GetLastStyleSheet (window);
    if (sheet == null) return;

    var rules = master.GetRules (sheet);
    if (rules == null) return;

    var count = rules.length;
    for (var n = 0; n < count; n ++) {
        var rule = rules [n];
        switch (rule.selectorText) {
            case "LI":
            case "li": {
                var margin = rule.style.marginLeft;
                if (margin) {
                    this.Rule = rule;
                    this.Css = ParseListItemMargin (margin);
                }
            }
        }
    }

    return this;
}

AlignmentState.prototype.SetMarginRule = function (Margin)
{
    this.Rule.style.marginLeft = Margin + "px";
}

AlignmentState.prototype.Load = function (Arg)
{
    var margin = ParseListItemMargin (Arg);
    if (margin != null && margin >= (nListItemImageWidth + 1) / 2) {
        this.Specified = margin;
        this.LoadFromCss ();
        if (margin != this.Css) this.SetMarginRule (margin);
    }
    return this;
}

AlignmentState.prototype.Set = function (Margin)
{
    this.Measured = Margin;

    if (this.Specified != null) {
        if (Margin == this.Specified) return;
    }
    else {
        if (Margin == this.Css) return;
    }

    this.SetMarginRule (Margin);
}

AlignmentState.prototype.toString = function ()
{
    var margin = this.Measured;
    if (margin == null) {
        margin = this.Specified;
        if (margin == null) return null;
    }
    return margin != this.Css ? margin : null;
}

Toc.prototype.SetAlignmentState = function (Alignment)
{
    if (Alignment == null) Alignment = (new AlignmentState).LoadFromCss ();
    this.Alignment = Alignment;
}

/*  Alignment  */
/*  ************************************************************************  */
/*  Persistence  */

/*  When initialising, we may have state to persist from the page we've 
    navigated from. Since it does not need to live past the TOC's 
    initialisation, it's its own object.  */

function InitialisationContext ()
{
    /*  Initial state specified in URL search string  */

    var query = window.top.Viewer.QueryParameter;
    var urlargs = window.top.Config.UrlArguments;

    var tx = query (urlargs.TocExpansion);
    this.Expansion = tx != null
        ? (new ExpansionState).Load (tx)
        : null;

    var ts = query (urlargs.TocScroll);
    this.Scroll = ts != null
        ? (new ScrollState).Load (ts)
        : null;

    var ta = query (urlargs.TocAlignment);
    this.Alignment = ta != null
        ? (new AlignmentState).Load (ta)
        : null;

    /*  State determined at initialisation, kept for whole of 
        initialisation, but then not needed  */

    this.Url = null;
}

Toc.prototype.LoadInitialState = function ()
{
    /*  The viewer in the top window is the keeper of a parsing of the URL 
        search string whose parts tell of initial state. Some tell 
        specifically of initial state for the TOC.  */

    var initstate = new InitialisationContext;

    /*  The viewer also coordinates the preparation of what the target page 
        in a navigation will see as its initial state. The viewer does not 
        itself know what state is specific to the TOC, let alone to prepare 
        it. Tell the viewer how to call us for that.  */

    window.top.Viewer.SetTocObject (this);

    return initstate;
}

/*  ====  */
/*  Exit  */

/*  Public function - called from DOCUMENT.JS to help the Viewer object's 
    implementation of its method that has this same name  */

Toc.prototype.LoadPersistentState = function (Target)
{
    var master = window.top;
    var names = master.Config.UrlArguments;

    if (this.Alignment != null) {
        var ta = this.Alignment.toString ();
        if (ta != null) Target.AppendSearch (names.TocAlignment, ta);
    }

    /*  If the navigation's target is not in the same subweb, it will have 
        a different TOC, and there is no point to preserving the current 
        TOC's expansion or scrolling.  */

    if (master.GetSubwebPath (Target.Pathname) != master.GetSubwebPath (null)) {
        return;
    }

    var tx = this.GetExpansionState (master.ComposeLocalUrl (Target.Pathname));
    if (tx != null) Target.AppendSearch (names.TocExpansion, tx);

    var ts = this.GetScrollState ().toString ();
    if (ts != null) Target.AppendSearch (names.TocScroll, ts);
}

/*  Persistence  */
/*  ************************************************************************  */
/*  Load-Time Initialisation  */

/*  Here's a very unwelcome hack. Continuity of the TOC's presentation when 
    browsing from page to page is highly desired. If the new page was 
    visible in the TOC before the navigation, then the TOC's only change 
    would ideally be just to move the highlight. If the new page was not 
    visible before, then whatever expansion or scrolling is required to 
    bring the page into visibility would ideally be minimal and natural. 

    Achieving this requires agreement between the layout before and after. 
    The layout after navigation takes time to settle. Measurements, either 
    to reproduce the scolling from before navigation or to determine how 
    much to scroll the new page, can be wrong if done too soon. But how soon 
    is too soon? 

    The document's load event is sometimes too soon. LI elements for mere 
    pages, as distinct from folders, are observed to have their height - 
    whether measured as offsetHeight or by asking getBoundingClientRect - 
    computed as "auto", not yet from the applicable CSS. 

    What event we might handle to be certain that the layout has settled is 
    not (yet) known. So, we inspect, starting at the document's load event 
    but then repeatedly.  */

function IsDisplayedSingleListItem (ListItem) 
{
    if (ListItem.getElementsByTagName ("UL").length != 0) return false;

    for (var p = ListItem.parentNode; p != null; p = p.parentNode) {
        switch (p.nodeName) {
            case "LI": {
                if (p.className != sExpandedClass) return false;
                continue;
            }
            case "UL": {
                if (p.id == sTocRoot) return true;
                continue;
            }
            default: {
                return false;
            }
        }
    }
    return false;
}

Toc.prototype.GetLastInitiallyDisplayedSingleListItem = function (InitialState)
{
    /*  Note: the presently unused InitialState, perhaps better thought of 
        as an initialisation context, is eventually to hold the 
        LastInitiallyDisplayedListItem, which is not needed once this hack 
        is done.  */

    /*  Accept any LI that we've noted along the way, if it's still 
        plausible.  */

    var li = this.LastInitiallyDisplayedListItem;
    if (li != null && IsDisplayedSingleListItem (li)) return li;

    /*  Without the hint, work backwards through all the LI elements in the 
        TOC.  */

    var list = this.Root.getElementsByTagName ("LI");
    var n = list.length;
    while (n -- != 0) {
        li = list [n];
        if (IsDisplayedSingleListItem (li)) {
            this.LastInitiallyDisplayedListItem = li;
            return li;
        }
    }
    return null;
}

Toc.prototype.IsListItemDisplayStable = function (InitialState)
{
    if (window.getComputedStyle == null) return true;

    var li = this.GetLastInitiallyDisplayedSingleListItem (InitialState);
    if (li == null) return false;

    var rect = li.getBoundingClientRect ();
    var offsetheight = rect.bottom - rect.top;

    var style = window.getComputedStyle (li);
    var lineheight = parseFloat (style.lineHeight);

    return Math.round (offsetheight) == Math.round (lineheight);
}

Toc.prototype.FinaliseDisplay = function (InitialState, InitialLink, Count)
{
    if (!this.IsListItemDisplayStable (InitialState) && Count ++ < 4) {
        var toc = this;
        var timeout = function () {
            toc.FinaliseDisplay (InitialState, InitialLink, Count);
        };
        window.setTimeout (timeout, 0);
        return;
    }
    this.SetScroll (InitialState.Scroll, InitialLink);
    this.SetCurrentLink (InitialLink);
}

Toc.prototype.GetStatus = function (Pathname)
{
    return window.top.GetSubwebName (Pathname) + " has " 
        + this.LinkCount + " pages in " 
        + this.Folders.length + " folders";
}

Toc.prototype.OnLoad = function (InitialState, Hider)
{
    var a = null;

    /*  The document's load event is the first we know that all the DOM tree 
        for the body is available. If we're not going to be able to make it 
        interactive, we're in trouble. Don't make things worse. 

        TO DO: 

        The assumption here is that TOCUI.JS must execute before TOC.JS can 
        see the load event. This is demonstrably broken if TOC.JS has the 
        DEFER attribute. Look into this!  */

    var ok = typeof this.InitTocUI == "function";
    if (ok) {

        var master = window.top;

        /*  Examine it for its tree of folders and map out which of them are 
            to be expanded or collapsed. The expansion must extend to the 
            link for the current document.  */

        this.InitFolders ();

        a = this.InitExpansion (
            InitialState.Expansion, 
            master.ComposeLocalUrl ());

        /*  We would anyway have wanted to hide all the content that's 
            intended to show only if scripts don't run.  */

        // master.HideNoScriptBlocks (window);
    }

    /*  Now that we know which folders to show, let them all show.  */

    Hider.Reveal (false);

    if (ok) {

        /*  Now that the TOC is laid out and measurements are known, scroll 
            it into place, ensuring that the link to the current document 
            shows and is highlighted. This is a little complicated - see 
            above - because the measurements can take a while to become 
            stable.  */

        if (a != null) this.FinaliseDisplay (InitialState, a , 0);

        /*  If only as a temporary measure, show the number of pages and 
            folders.  */

        top.status = this.GetStatus (top.location.pathname);

        /*  Make the TOC interactive.  */

        this.InitTocUI ();
    }
}

/*  Load-Time Initialisation  */
/*  ************************************************************************  */
/*  Global initialisation  */

function ConstructToc ()
{
    var master = window.top;
    
    /*  When freshly loaded, the TOC is fully expanded (being styled by 
        default for when scripts don't run) and scrolled to the top. Only 
        rarely will this be how the TOC ends up being shown. The user might 
        well be spared seeing the TOC get collapsed and some folders get 
        expanded. Hide the BODY until we really do need that it be laid 
        out.  */

    var hider = new master.ConstructionHider (window);

    /*  All scripting of interactivity of both the viewer and the original 
        document has been moved to a separate script. Get started on 
        downloading it, parsing it and even executing it. Non-trivial 
        execution doesn't start until we near the end of our own load-time 
        initialisation and call a function that we expect this script to 
        provide. 
        
        TO DO: 
        
        Of course, since there are only seven TOC.HTM pages, the author 
        could instead edit the necessary SCRIPT tag into the HTML. So, this 
        may go away.  */

    var head = new master.Head (window);

    /*  Still, while we do have the script edit the HEAD, we may as well do 
        something that is not so easily done in the HTML (at least, not 
        without prescribing the site's location).  */
        
    head.EnsureCanonicalLink (master.ComposeCanonicalUrl (window));
    
    /*  Our real business with the HEAD is to load the interactivity 
        script (TOCUI.JS).  */
    
    /* head.InsertDeferredScript (sTocUIScriptPathname); */

    /*  Neither this script (TOC.JS) nor the interactivity script has any 
        reason to exist except for the TOC object.  */

    var toc = new Toc;

    /*  The URL search string - already parsed by the viewer - may tell of 
        an initial state that we should aim to respect, typically for 
        continuity of experience while the user navigates from page to page 
        in the site.  */ 

    var initstate = toc.LoadInitialState ();

    /*  The relative alignment of list items at successive levels is a 
        question of styling. Work can start on it before the load event.  */

    toc.SetAlignmentState (initstate.Alignment);

    /*  Everything else must wait until we have a BODY.  */

    var onload = function (Event) {
        toc.OnLoad (initstate, hider);
    };
    master.RegisterEventHandler (window, "load", onload);
}

/*  Now that we don't duplicate the execution of MASTER.JS in our window, we 
    don't have its help if someone loads TOC.HTM directly, i.e., into its 
    own window, and runs scripts. The page doesn't quite exist only to show 
    in the viewer: it's good for the script-less user interface, too. Load 
    it directly and it shows as if scripts did not run. 

    That's fine as far as it goes. Indeed, it's as far as we want it to go 
    if the user has somehow got hold of a link to a TOC.HTM but does mean to 
    run scripts. They can click on any link in the TOC and start seeing the 
    site as intended. 

    If, however, we want that they can have scripts enabled but can simulate 
    the viewing of this site as if scripts are disabled, then we have a 
    little more work to do.  */

function IsNoViewer ()
{
    return window == top && window.location.search == "?noviewer=true";
}

function EnableNoViewer ()
{
    var redirect = function (Event) {
        if (Event == null) Event = window.event;
        var src = Event.target != null ? Event.target : Event.srcElement;
        if (src != null 
                && src.nodeName == "A" 
                && src.hostname == window.location.hostname) {
            src.href += "?noviewer=true";
        }
    };
    window.document.onclick = redirect;
    window.document.oncontextmenu = redirect;
}

function CanInitToc () 
{
    var top = window.top;
    return window != top 
        && typeof top.IsMasterJsGood == "function" 
        && top.IsMasterJsGood (window) 
        && typeof top.Viewer == "function" 
        && typeof top.Viewer.IsTocWindow == "function"
        && top.Viewer.IsTocWindow (window);
}

/*  Finally the global initialisation that starts the substantial execution  */

if (CanInitToc ()) ConstructToc ();
else if (IsNoViewer ()) EnableNoViewer ();

/*  ************************************************************************  *
 *        Copyright © 2007-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->