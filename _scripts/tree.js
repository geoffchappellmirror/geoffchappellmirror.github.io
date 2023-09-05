<!--

/*  ************************************************************************  *
 *                                  tree.js                                   *
 *  ************************************************************************  */

/*  Load this script from the HEAD of any document page that wants it. The 
    DEFER attribute is recommended. 

    Load MASTER.JS and DOCUMENT.JS first. Familiarity with both is assumed.  */

/*  ************************************************************************  */
/*  Background  */

/*  Though this script is deployed - widely, even - on document pages, it is 
    in some sense experimental. The bulk of it is intended for general use 
    wherever some sort of tree is wanted that can be expanded and collapsed 
    by user interaction. The long-term aim is that this can include the 
    Table of Contents (TOC) pages. Those pages, however, retain some of the 
    site's oldest scripts and are not so easily reworked as might be hoped!  */

/*  ************************************************************************  */
/*  Configuration  */

/*  ===========  */
/*  Class Names  */

Config.TreeClasses = {
    Collapsed: "Collapsed", 
    Expanded: "Expanded"
};

/*  =============  */
/*  Tooltip hints  */

Config.TreeHints = {

    /*  The basic operations  */

    Expand:         "Click to expand",
    Collapse:       "Click to collapse", 

    /*  Fully recursive compounds  */

    ExpandFull:     "Ctrl-Click for recursive expansion", 
    CollapseFull:   "Ctrl-Shift-Click for recursive collapse",  

    /*  A compound of compounds - not presently implemented  */

    ExpandOneLevel: "Shift-Click to expand one level only", 

    /*  A different hint for CollapseFull when the branch is already 
        collapsed:  */

    Reset:          "Ctrl-Shift-Click to reset expansion"
};

Config.TreeHintCompounds = {

    /*  Possible combinations - prepared in advance in the hope of some small 
        efficiency  */

    CollapseOnly: Config.TreeHints.Collapse, 

    CollapseAllDescendantsExpanded: Config.TreeHints.Collapse 
        + "\n" + Config.TreeHints.CollapseFull, 

    CollapseDefault: Config.TreeHints.Collapse 
        + "\n" + Config.TreeHints.ExpandFull 
        + "\n" + Config.TreeHints.CollapseFull,

    ExpandOnly: Config.TreeHints.Expand, 

    ExpandAllDescendantsExpanded: Config.TreeHints.Expand 
        + "\n" + Config.TreeHints.Reset,

    ExpandDefault: Config.TreeHints.Expand 
        + "\n" + Config.TreeHints.ExpandFull 
        + "\n" + Config.TreeHints.Reset
};

/*  ************************************************************************  */
/*  Leaf Object  */

/*  A leaf is an LI node that has no list beneath it, i.e., no UL among its 
    child nodes. It does not usefully exist without at least one child node. 
    Indeed, it is an error of authoring if the LI is empty. 

    Since the whole point to the leaf is to provide a link for the user to 
    click on, the one child node is ideally an A which in turn has a text 
    node as its one child. Exceptionally, the author may disable the link 
    and expose the text node as the LI node's one child. 

    All that said, we don't need to make an object of any leaf.  */

/*  *************  */
/*  Branch Object  */

/*  A branch is an LI node that has at least one UL among its children. Some 
    case could be made for not just a UL but a UL that has at least one LI. 

    An LI node is not identified as a branch without having found the first 
    child node that's a UL. In practice, we have continued need for this UL 
    to help measure the LI node's marker box when running on old browsers. 
    Although the LI is the essential input for constructing the Branch, the 
    first child UL is required too. It could be found from the LI, but the 
    caller must know it and is trusted to provide it. 

    A similar case might be made for the branch's ancestry. It is either a 
    child branch of some other (meaning that the LI node has a UL as parent 
    node which has as its parent an LI node that is the parent branch) or it 
    is a child of the root (meaning that the LI node's parent is the UL that 
    is the tree's root node).  */

function Branch (ListItem, FirstChildUL, ParentBranch)
{
    /*  ==============================  */
    /*  Connections To Other DOM Nodes  */
    /*  ==============================  */

    this.ListItem = ListItem;
    this.FirstChildUL = FirstChildUL;

    /*  =============================  */
    /*  Connections To Other Branches  */
    /*  =============================  */

    /*  Much of the point to a Branch is that it's in a Tree, both with 
        ancestor branches up towards some Root, and with leaves and/or more 
        branches beneath it. 

        See that whenever a Branch is constructed from an LI node, the 
        node's ancestry is known and with it a parent Branch (unless the 
        node is an immediate child of the tree's root), but no child 
        Branch has yet been constructed.  */

    this.ParentBranch = ParentBranch;
    this.ChildBranches = new Array ();

    /*  Add this Branch object to its parent's array of child branches. For 
        a Branch that has no parent, the caller may want to add the Branch 
        to a similar array for the Tree.  */

    if (ParentBranch != null) ParentBranch.ChildBranches.push (this);

    /*  =================  */
    /*  Cached Class Name  */
    /*  =================  */

    /*  The styling of the given LI node in synchrony with the branch's 
        state as expanded or collapsed depends heavily on the presence of 
        "Expanded" or "Collapsed" in the node's CLASS. 

        Cache the CLASS and track whether it (yet) contains "Expanded" or 
        "Collapsed". While at it, correct any authoring error that set them 
        both.  */

    var classname = ListItem.className;
    var qualifiers = Config.TreeClasses;
    var expanded = ClassNameContains (classname, qualifiers.Expanded);
    var collapsed = ClassNameContains (classname, qualifiers.Collapsed);
    if (expanded && collapsed) {
        classname = ClassNameRemove (classname, qualifiers.Expanded);
        classname = ClassNameRemove (classname, qualifiers.Collapsed);
        ListItem.className = this.ClassName = classname;
        expanded = collapsed = false;
    }

    var classnamestate = expanded ? true : collapsed ? false : null;

    this.SetExpandedInClassName = function () {
        switch (classnamestate) {
            case null: {
                classname = classname != "" 
                    ? qualifiers.Expanded + " " + classname 
                    : qualifiers.Expanded;
                break;
            }
            case false: {
                classname = ClassNameReplace (
                    classname, 
                    qualifiers.Collapsed,
                    qualifiers.Expanded);
                break;
            }
            default: return;
        }
        classnamestate = true;
        this.ListItem.className = classname;
    };

    this.SetCollapsedInClassName = function () {
        switch (classnamestate) {
            case null: {
                classname = classname != "" 
                    ? qualifiers.Collapsed + " " + classname 
                    : qualifiers.Collapsed;
                break;
            }
            case false: return;
            default: {
                classname = ClassNameReplace (
                    classname, 
                    qualifiers.Expanded,
                    qualifiers.Collapsed);
                break;
            }
        }
        classnamestate = false;
        this.ListItem.className = classname;
    };

    /*  =============  */
    /*  Tooltip Hints  */
    /*  =============  */

    /*  Also cached is the tooltip that's to show when hovering over the 
        branch's list-item marker box. This is set as the "title" property 
        of the LI but ony while the hover is over the marker box, this being 
        where the user must click for the hinted action. Though the title is 
        cleared on leaving the marker box, we don't want to have to 
        re-compose on every re-entry.  */

    this.Title = null;

    /*  ===============  */
    /*  Expansion State  */
    /*  ===============  */

    /*  Once this branch is ever visible, it must be either expanded or 
        collapsed. If the branch becomes invisible (as when some ancestor 
        gets collapsed), the branch (typically) retains its expansion 
        state (so that expanding the ancestor restores the tree to how it 
        was when the ancestor got collapsed). 

        TO DO: 

        Can the classnamestate local be directly this.Expanded? What 
        presently distinguishes them?  */

    this.Expanded = classnamestate;

    /*  Ideally, the HTML author sets an initial expansion state by adding 
        Expanded and Collapsed to the class for enough branches. Doing so 
        has the merit of avoiding layout shifts (especially for the possibly 
        large amount of material that may follow the tree). Still, let's not 
        make an authoring error of not having set either.  */

    if (this.Expanded == null) {
        if (ParentBranch == null) {
            this.SetExpandedInClassName ();
            this.Expanded = true;
        }
        else {
            this.SetCollapsedInClassName ();
            this.Expanded = false;
        }
    }

    /*  A branch is said to be fully expanded if the branch itself is 
        expanded and all its child branches are fully expanded. 

        The point to tracking a "fully expanded" state is that when members 
        of a Branch rcord that all the child branches are fully expanded, 
        script for just the Branch can know that all the branch's 
        descendants are (fully) expanded. The Expand Full operation is then 
        redundant: there is no point offering it in the branch's tooltip. 

        TO DO: 

        Similarly, a branch is said to be fully collapsed if the branch 
        itself is collapsed and all its child branches are fully collapsed. 
        All descendant branches are collapsed and the Collapse Full 
        operation is therefore redundant.  */

    var fullyexpandedchildren = 0;
    this.AllDescendantsExpanded = true;

    /*  Call the following helper to tell this Branch that one of its child 
        branches has newly acquired the "fully expanded" state. When all the 
        children have this state, the branch knows that all its descendants 
        are expanded. 

        Call the flip side to tell this Branch that one of its children has 
        newly lost the "fully expanded" state. 

        Either way, the code is a little messy for having to invalidate the 
        cached title if the AllDescendantsExpanded state may have changed.  */

    this.IncrementFullyExpandedChildren = function () {
        var all = ++ fullyexpandedchildren == this.ChildBranches.length;
        if (all) this.Title = null;
        return this.AllDescendantsExpanded = all;
    };

    this.DecrementFullyExpandedChildren = function () {
        fullyexpandedchildren --;
        if (!this.AllDescendantsExpanded) return false;
        this.AllDescendantsExpanded = false;
        this.Title = null;
        return true;
    };

    /*  If this Branch knows that all its descendants are expanded and then 
        this Branch is expanded too, it becomes a fully expanded child of 
        its parent. From this news the parent may learn that all its 
        descendants are fully expanded. And so it goes.  */

    this.PropagateNowFullyExpanded = function () {
        for (var p = ParentBranch; p != null; p = p.ParentBranch) {
            if (!p.IncrementFullyExpandedChildren ()) break;
            if (!p.Expanded) break;
        }
    };

    this.PropagateLostFullyExpanded = function () {
        for (var p = ParentBranch; p != null; p = p.ParentBranch) {
            if (!p.DecrementFullyExpandedChildren ()) break;
        }
    };

    /*  When constructing a Branch, no child branches are yet known and the 
        branch counts trivially as having all descendants expanded. This 
        must yet be accounted in the state of ancestors. 

        If the branch is expanded, then it counts as a fully expanded child 
        of its parent. Though it is a new child, pushing it on to the 
        parent's array of child branches incremented the parent's count of 
        all its child branches. Incrementing the parent's count of fully 
        expanded children doesn't change whether all the parent's 
        descendants are expanded. No propagation is needed. 

        When the new branch is not expanded, the parent that did have all 
        descendants expanded does not still - but this is because it now has 
        an extra child, not because its count of fully expanded children 
        changed. If additionally the parent was expanded, then it counted as 
        a fully expanded child of its parent, and is not now, and so on.  */

    if (this.Expanded) {
        if (ParentBranch != null) {
            ParentBranch.IncrementFullyExpandedChildren ();
        }
    }
    else {
        var p = ParentBranch;
        if (p != null && p.AllDescendantsExpanded) {
            p.AllDescendantsExpanded = false;
            if (p.Expanded) p.PropagateLostFullyExpanded ();
        }
    }

    /*  =========================  */
    /*  Access For Event Handling  */
    /*  =========================  */

    /*  Provide for easily getting the Branch object from the LI node.  */

    this.ListItem.Branch = this;
}

/*  Adding Branch as an "expando" property to the DOM-defined ListItem makes 
    for an efficient lookup but may seem ugly. The JavaScript in modern 
    browsers has a built-in Map object that provides for an efficient lookup 
    but older browsers really don't have a good alternative. Still, 
    anticipate using some other way of finding the Branch object from an LI
    node. Always call the following to get the Branch object for an LI.  */

function GetBranch (ListItem)
{
    return ListItem.Branch;
}

function GetFirstULChild (ListItem) 
{
    for (var p = ListItem.firstChild; p != null; p = p.nextSibling) {
        if (p.nodeName == "UL") return p;
    }
    return null;
}

/*  Construction  */
/*  ============  */
/*  Operations    */

Branch.prototype.Expand = function ()
{
    if (this.Expanded) return;
    this.SetExpandedInClassName ();
    this.Expanded = true;
    if (this.AllDescendantsExpanded) this.PropagateNowFullyExpanded ();
};

Branch.prototype.Collapse = function ()
{
    if (this.Expanded != null && !this.Expanded) return;
    this.SetCollapsedInClassName ();
    this.Expanded = false;
    if (this.AllDescendantsExpanded) this.PropagateLostFullyExpanded ();
};

Branch.prototype.ExpandFull = function ()
{
    var childbranches = this.ChildBranches;
    var count = childbranches.length;
    for (var n = 0; n < count; n ++) {
        childbranches [n].ExpandFull ();
    }

    this.Expand ();
};

Branch.prototype.CollapseFull = function ()
{
    this.Collapse ();

    var childbranches = this.ChildBranches;
    var count = childbranches.length;
    for (var n = 0; n < count; n ++) {
        childbranches [n].CollapseFull ();
    }
};

/*  Operations     */
/*  =============  */
/*  Interactivity  */

/*  Did a given mouse event that is known to have this branch's LI as its 
    source occur in the marker box of this LI? */

Branch.prototype.InMarker = function (Event)
{
    /*  For modern browsers, we can (perhaps) take as decisive that the 
        event occurred in the marker box according to whether it's to the 
        left or right of the LI element. 

        For older browsers, however - certainly for Internet Explorer 7 - 
        occurrence to the left of the LI is demonstrably only necessary, not 
        sufficient.  */

    var borderbox = this.ListItem.getBoundingClientRect ();
    if (Event.clientX >= borderbox.left) return false;

    /*  What's seen on Internet Explorer 7 is that an event to the left of 
        the UL beneath an expanded branch has the branch's LI as its source. 
        We therefore also check that the event has not occurred too far 
        down.  */

    if (!this.Expanded) return true;

    borderbox = this.FirstChildUL.getBoundingClientRect ();
    return Event.clientY < borderbox.top;
};

/*  -----  */
/*  Click  */

Branch.prototype.OnClick = function (Event)
{
    /*  Clicking matters to a branch only when the click is over the 
        branch's list-item marker. */

    if (!this.InMarker (Event)) return false;

    /*  The click can cause any of the four 
        operations, depending on control keys. The one that matters most is 
        the Ctrl key. If it is down, then the Shift key matters too. 

        A bare click toggles just the branch's state, i.e., expanded or 
        collapsed. The Ctrl key amplifies the effect into a full expansion 
        or collapse. The two are differentiated by the Shift key: Ctrl alone 
        for full expansion; Ctrl-Shift for full collapse.  */

    if (!Event.ctrlKey) {
        if (!Event.altKey && !Event.shiftKey) {
            this.Expanded ? this.Collapse () : this.Expand ();
            return true;
        }
    }
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
};

/*  -----  */
/*  Hover  */

Branch.prototype.ComposeHint = function ()
{
    if (this.Title != null) return this.Title;

    if (this.Expanded) {

        /*  The branch is expanded. It can certainly be collapsed. But if the 
            branch has only leaves, then a simple collapse is all that's 
            possible.  */

        if (this.ChildBranches.length == 0) {
            return Config.TreeHintCompounds.CollapseOnly;
        }

        /*  Given that the branch has branches beneath it, offer a recursive 
            collapse too, but if the whole tree beneath is already fully 
            expanded, then recursive expansion would be redundant.  */

        return this.AllDescendantsExpanded
            ? Config.TreeHintCompounds.CollapseAllDescendantsExpanded
            : Config.TreeHintCompounds.CollapseDefault;
    }
    else {

        if (this.ChildBranches.length == 0) {
            return Config.TreeHintCompounds.ExpandOnly;
        }

        return this.AllDescendantsExpanded
            ? Config.TreeHintCompounds.ExpandAllDescendantsExpanded
            : Config.TreeHintCompounds.ExpandDefault;
    }
}

Branch.prototype.OnMouseOver = function (Event)
{
    if (this.InMarker (Event)) this.ListItem.title = this.ComposeHint ();
}

Branch.prototype.OnMouseOut = function (Event) 
{
    this.ListItem.title = "";
}

/*  Branch Object  */
/*  ************************************************************************  */
/*  Tree  */

/*  Everything before here looks to be at least capable of being developed 
    for general use, even as the base of the tree on every Table Of Contents 
    page. The remainder is - or might be developed to be - particular to the 
    use of the tree on document pages and can perhaps be separated, e.g., to 
    a DOCTREE.JS.  */

/*  ************************************************************************  */
/*  Configuration  */

var sTreeClass = "Tree";

/*  ************************************************************************  */
/*  Implementation  */

/*  A tree is a nesting of UL and LI nodes beneath a DIV that has "Tree" in 
    its CLASS. The root UL nodes are immediate children of the DIV. There 
    can be any number, though having just one at this level is so much the 
    most common structure that it may as well be called typical. 

    Beneath a root UL node are any number of LI nodes as children. These are 
    most usefully branches. Indeed, a mere leaf at this level has so little 
    usefulness that it might better be dismissed as an error of authoring.  */

function InitTree (Div)  // actually forEach callback
{
    /*  First let's make a subroutine of enumerating all the branches 
        beneath one (root) UL node.  */

    var initsubtree = function (Root, Branches) {

        /*  There's an interesting choice for initialising a tree. 

            On the one hand, we can efficiently get from the browser a 
            collection of all LI nodes that are descendants of the given 
            Root to any depth, and we can then map the whole tree. 

            On the other, we can efficiently get from the browser a 
            collection of all the child nodes of the Root, pick out the LI 
            nodes as the tree's lowest branches, and look no further until 
            these branches are ever expanded (including because they are 
            specified as initially expanded). 

            Here we map the whole tree.  */

        var listitems = Root.getElementsByTagName ("LI");
        var count = listitems.length;
        for (var n = 0; n < count; n ++) {
            var li = listitems [n];

            var firstulchild = GetFirstULChild (li);
            if (firstulchild == null) continue;

            var parentnode = li.parentNode;
            if (parentnode.nodeName != "UL") continue;

            var parentbranch;
            if (parentnode == Root) {

                Branches.push (new Branch (li, firstulchild));
            }
            else {
                parentnode = parentnode.parentNode;
                if (parentnode.nodeName != "LI") continue;

                var parentbranch = GetBranch (parentnode);
                if (parentbranch == null) continue;

                new Branch (li, firstulchild, parentbranch);
            }
        }
    };

    /*  Enumerate the whole tree by looping through the UL nodes that are 
        immediate children of the DIV. 

        In most cases that ever occur in our present real-world practice, we 
        could - and might better - just execute the body of the preceding 
        subroutine but with the DIV as the Root. 

        More generally, we allow that the tree's root branches (LI nodes) 
        can be children of multiple UL nodes, just as sibling branches 
        deeper into the tree can be. We allow the DIV to have child nodes 
        other than lists, e.g., for comments or explanatory text, but we 
        stop the enumeration at any sign of a DIV that's its own Tree.  */

    var endstree = function (Node) {
        if (ElementClassContains (Node, sTreeClass)) return true;
        var divs = Node.getElementsByTagName ("DIV");
        var count = divs.length;
        for (var n = 0; n < count; n ++) {
            if (ElementClassContains (divs [n], sTreeClass)) return true;
        }
        return false;
    };

    var branches = new Array;

    var childnodes = Div.childNodes;
    var count = childnodes.length;
    for (var n = 0; n < count; n ++) {
        var p = childnodes [n];
        switch (p.nodeName) {
            case "OL":
            case "UL": {
                initsubtree (p, branches);
                continue;
            }
            case "DIV": {
                if (endstree (p)) break;
                /*  deliberate drop through  */
            }
            default: continue;
        }
        break;
    }

    /*  Make the tree interactive.  */

    var onclick = function (Event) {
        var src = GetEventSource (Event);
        if (src.nodeName == "LI") {
            var branch = GetBranch (src);
            if (branch != null) branch.OnClick (Event);
            return;
        }
    };

    var onmouseover = function (Event) {
        var src = GetEventSource (Event);
        if (src.nodeName == "LI") {
            var branch = GetBranch (src);
            if (branch != null) branch.OnMouseOver (Event);
        }
    };

    var onmouseout = function (Event) {
        var src = GetEventSource (Event);
        if (src.nodeName == "LI") {
            var branch = GetBranch (src);
            if (branch != null) branch.OnMouseOut (Event);
        }
    };

    RegisterEventHandler (Div, "click", onclick);
    RegisterEventHandler (Div, "mouseover", onmouseover);
    RegisterEventHandler (Div, "mouseout", onmouseout);
    RegisterEventHandler (Div, "selectstart", SetEventDone);
}

function InitTrees (Viewer)
{
    /*  The document can have multiple trees. Each tree is in its own DIV. 
        For a DIV to contain a tree, it must have "Tree" in its CLASS.  */

    var divs = Viewer.DocFrame.getElementsByTagName ("DIV");
    var trees = ExtractFromCollectionByClass (divs, sTreeClass);
    CollectionForEach (trees, InitTree);
}

/*  ************************************************************************  */
/*  initialisation  */

function CanInitTrees () 
{
    return typeof IsMasterJsGood == "function" && IsMasterJsGood (window) 
        && typeof Viewer == "function" 
        && typeof Viewer.CallWhenShowing == "function" 
        && typeof Branch == "function";
}

if (CanInitTrees ()) Viewer.CallWhenShowing (InitTrees);

/*  ************************************************************************  *
 *        Copyright © 2007-2022. Geoff Chappell. All rights reserved.         *
 *  ************************************************************************  */

//-->